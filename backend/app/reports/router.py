import os
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import User, Patient, Report, LabValue, ReportStatus
from app.auth.dependencies import get_current_user
from app.reports.schemas import (
    ReportResponse, ReportListItem, LabValueResponse,
    LabValueUpdate, TrendMarker, TrendPoint,
)
from app.config import settings

router = APIRouter(tags=["Reports"])


async def _verify_patient_access(patient_id: str, user: User, db: AsyncSession) -> Patient:
    """Helper: verify the patient belongs to the current user."""
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.user_id == user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/api/patients/{patient_id}/reports/upload", response_model=ReportResponse, status_code=201)
async def upload_report(
    patient_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    report_date: str = Form(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a PDF/image lab report. Triggers OCR pipeline in background."""
    await _verify_patient_access(patient_id, user, db)

    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not supported")

    # Save file to disk
    upload_dir = os.path.join(settings.UPLOAD_DIR, patient_id)
    os.makedirs(upload_dir, exist_ok=True)
    file_ext = file.filename.split(".")[-1] if file.filename else "pdf"
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(upload_dir, file_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Create report record
    report = Report(
        patient_id=patient_id,
        report_date=date.fromisoformat(report_date),
        original_file_url=file_path,
        status=ReportStatus.PENDING,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)

    # Trigger OCR pipeline in background
    background_tasks.add_task(run_ocr_pipeline, report.id, file_path)

    return ReportResponse.model_validate(report)


async def run_ocr_pipeline(report_id: str, file_path: str):
    """Background task: run OCR on the uploaded file and save extracted values."""
    from app.database import async_session
    from app.ocr.pipeline import process_report

    async with async_session() as db:
        try:
            # Update status to processing
            result = await db.execute(select(Report).where(Report.id == report_id))
            report = result.scalar_one()
            report.status = ReportStatus.PROCESSING
            await db.commit()

            # Run OCR pipeline
            extracted = await process_report(file_path)

            # Save extracted lab values
            for item in extracted.get("lab_values", []):
                lab_value = LabValue(
                    report_id=report_id,
                    test_name=item["test_name"],
                    test_category=item.get("test_category"),
                    value_numeric=item.get("value_numeric"),
                    value_text=item.get("value_text"),
                    unit=item.get("unit"),
                    ref_low=item.get("ref_low"),
                    ref_high=item.get("ref_high"),
                    flag=item.get("flag"),
                    note=item.get("note"),
                    ocr_confidence=item.get("confidence", 0.5),
                    user_verified=False,
                )
                db.add(lab_value)

            # Update report metadata from OCR
            report.lab_name = extracted.get("lab_name")
            report.bill_id = extracted.get("bill_id")
            report.report_type = extracted.get("report_type", "Blood Test")
            report.status = ReportStatus.COMPLETED
            await db.commit()

        except Exception as e:
            report.status = ReportStatus.FAILED
            await db.commit()
            print(f"OCR pipeline failed for report {report_id}: {e}")


@router.get("/api/patients/{patient_id}/reports", response_model=list[ReportListItem])
async def list_reports(
    patient_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all reports for a patient, ordered by date."""
    await _verify_patient_access(patient_id, user, db)

    result = await db.execute(
        select(Report, func.count(LabValue.id).label("value_count"))
        .outerjoin(LabValue)
        .where(Report.patient_id == patient_id)
        .group_by(Report.id)
        .order_by(Report.report_date.desc())
    )
    rows = result.all()
    return [
        ReportListItem(
            id=report.id,
            report_date=report.report_date,
            lab_name=report.lab_name,
            status=report.status,
            value_count=count,
        )
        for report, count in rows
    ]


@router.get("/api/reports/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single report with all lab values."""
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.lab_values))
        .join(Patient)
        .where(Report.id == report_id, Patient.user_id == user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportResponse.model_validate(report)


@router.put("/api/reports/{report_id}/values")
async def confirm_values(
    report_id: str,
    updates: list[LabValueUpdate],
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """User confirms/edits extracted lab values after OCR."""
    # Verify access
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.lab_values))
        .join(Patient)
        .where(Report.id == report_id, Patient.user_id == user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Apply updates (match by index for simplicity)
    for i, update in enumerate(updates):
        if i < len(report.lab_values):
            lab_val = report.lab_values[i]
            update_data = update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(lab_val, key, value)
            lab_val.user_verified = True

    return {"message": "Values confirmed", "count": len(updates)}


@router.get("/api/patients/{patient_id}/trends", response_model=list[TrendMarker])
async def get_trends(
    patient_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all lab value trends over time for charts."""
    await _verify_patient_access(patient_id, user, db)

    result = await db.execute(
        select(LabValue, Report.report_date)
        .join(Report)
        .where(Report.patient_id == patient_id, Report.status == ReportStatus.COMPLETED)
        .order_by(Report.report_date)
    )
    rows = result.all()

    # Group by test_name
    markers: dict[str, TrendMarker] = {}
    for lab_val, report_date in rows:
        key = lab_val.test_name
        if key not in markers:
            markers[key] = TrendMarker(
                test_name=lab_val.test_name,
                unit=lab_val.unit,
                ref_low=lab_val.ref_low,
                ref_high=lab_val.ref_high,
            )
        markers[key].data_points.append(
            TrendPoint(
                date=report_date,
                value=lab_val.value_numeric,
                value_text=lab_val.value_text,
                flag=lab_val.flag,
            )
        )

    return list(markers.values())


@router.delete("/api/reports/{report_id}", status_code=204)
async def delete_report(
    report_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a report and its lab values."""
    result = await db.execute(
        select(Report).join(Patient).where(Report.id == report_id, Patient.user_id == user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Delete file from disk
    if report.original_file_url and os.path.exists(report.original_file_url):
        os.remove(report.original_file_url)

    await db.delete(report)
