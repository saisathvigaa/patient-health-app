from pydantic import BaseModel
from typing import Optional
from datetime import date


class LabValueResponse(BaseModel):
    id: str
    test_name: str
    test_category: Optional[str] = None
    value_numeric: Optional[float] = None
    value_text: Optional[str] = None
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    flag: Optional[str] = None
    note: Optional[str] = None
    ocr_confidence: Optional[float] = None
    user_verified: bool = False

    model_config = {"from_attributes": True}


class LabValueUpdate(BaseModel):
    value_numeric: Optional[float] = None
    value_text: Optional[str] = None
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    flag: Optional[str] = None
    note: Optional[str] = None
    user_verified: bool = True


class ReportResponse(BaseModel):
    id: str
    patient_id: str
    report_date: date
    lab_name: Optional[str] = None
    bill_id: Optional[str] = None
    original_file_url: Optional[str] = None
    report_type: Optional[str] = None
    status: str
    lab_values: list[LabValueResponse] = []

    model_config = {"from_attributes": True}


class ReportListItem(BaseModel):
    id: str
    report_date: date
    lab_name: Optional[str] = None
    status: str
    value_count: int = 0

    model_config = {"from_attributes": True}


class TrendPoint(BaseModel):
    date: date
    value: Optional[float] = None
    value_text: Optional[str] = None
    flag: Optional[str] = None


class TrendMarker(BaseModel):
    test_name: str
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    data_points: list[TrendPoint] = []


class ConfirmValuesRequest(BaseModel):
    values: list[LabValueUpdate]
