from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User, Patient, Report
from app.auth.dependencies import get_current_user
from app.patients.schemas import PatientCreate, PatientUpdate, PatientResponse

router = APIRouter(prefix="/api/patients", tags=["Patients"])


@router.get("", response_model=list[PatientResponse])
async def list_patients(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all patients for the current user."""
    result = await db.execute(
        select(Patient, func.count(Report.id).label("report_count"))
        .outerjoin(Report, Report.patient_id == Patient.id)
        .where(Patient.user_id == user.id)
        .group_by(Patient.id)
        .order_by(Patient.name)
    )
    rows = result.all()
    return [
        PatientResponse(
            **{c.key: getattr(patient, c.key) for c in Patient.__table__.columns},
            report_count=count,
        )
        for patient, count in rows
    ]


@router.post("", response_model=PatientResponse, status_code=201)
async def create_patient(
    data: PatientCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new patient profile."""
    patient = Patient(user_id=user.id, **data.model_dump())
    db.add(patient)
    await db.flush()
    await db.refresh(patient)
    return PatientResponse(**{c.key: getattr(patient, c.key) for c in Patient.__table__.columns}, report_count=0)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific patient by ID."""
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.user_id == user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    count_result = await db.execute(
        select(func.count(Report.id)).where(Report.patient_id == patient_id)
    )
    count = count_result.scalar() or 0

    return PatientResponse(
        **{c.key: getattr(patient, c.key) for c in Patient.__table__.columns},
        report_count=count,
    )


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    data: PatientUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a patient profile."""
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.user_id == user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(patient, key, value)

    await db.flush()
    await db.refresh(patient)
    return PatientResponse(
        **{c.key: getattr(patient, c.key) for c in Patient.__table__.columns},
        report_count=0,
    )


@router.delete("/{patient_id}", status_code=204)
async def delete_patient(
    patient_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a patient and all associated data."""
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.user_id == user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    await db.delete(patient)
