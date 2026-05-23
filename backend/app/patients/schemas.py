from pydantic import BaseModel
from typing import Optional
from datetime import date


class PatientCreate(BaseModel):
    name: str
    date_of_birth: Optional[date] = None
    sex: Optional[str] = None
    blood_group: Optional[str] = None
    patient_id_external: Optional[str] = None
    referring_doctor: Optional[str] = None
    hospital: Optional[str] = None


class PatientUpdate(PatientCreate):
    name: Optional[str] = None


class PatientResponse(BaseModel):
    id: str
    name: str
    date_of_birth: Optional[date] = None
    sex: Optional[str] = None
    blood_group: Optional[str] = None
    patient_id_external: Optional[str] = None
    referring_doctor: Optional[str] = None
    hospital: Optional[str] = None
    report_count: int = 0

    model_config = {"from_attributes": True}
