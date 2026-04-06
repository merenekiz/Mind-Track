from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class HealthDataCreate(BaseModel):
    date: date
    pain_level: Optional[int] = Field(None, ge=0, le=10)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality: Optional[int] = Field(None, ge=1, le=5)
    stress_level: Optional[int] = Field(None, ge=0, le=10)
    mood: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=1000)


class HealthDataUpdate(BaseModel):
    date: Optional[date] = None
    pain_level: Optional[int] = Field(None, ge=0, le=10)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality: Optional[int] = Field(None, ge=1, le=5)
    stress_level: Optional[int] = Field(None, ge=0, le=10)
    mood: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=1000)


class HealthDataResponse(BaseModel):
    id: int
    user_id: int
    date: date
    pain_level: Optional[int]
    sleep_hours: Optional[float]
    sleep_quality: Optional[int]
    stress_level: Optional[int]
    mood: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
