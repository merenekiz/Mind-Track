from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, Any


class HealthDataCreate(BaseModel):
    date: date
    pain_level: Optional[int] = Field(None, ge=0, le=10)
    pain_type: Optional[str] = Field(None, max_length=50)
    pain_body_map: Optional[dict[str, Any]] = None
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality: Optional[int] = Field(None, ge=1, le=5)
    stress_level: Optional[int] = Field(None, ge=0, le=10)
    water_intake: Optional[float] = Field(None, ge=0, le=12)
    activity_minutes: Optional[int] = Field(None, ge=0, le=180)
    day_intensity: Optional[int] = Field(None, ge=1, le=10)
    mood: Optional[str] = Field(None, max_length=50)
    nutrition_photo_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)


class HealthDataUpdate(BaseModel):
    date: Optional[date] = None
    pain_level: Optional[int] = Field(None, ge=0, le=10)
    pain_type: Optional[str] = Field(None, max_length=50)
    pain_body_map: Optional[dict[str, Any]] = None
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality: Optional[int] = Field(None, ge=1, le=5)
    stress_level: Optional[int] = Field(None, ge=0, le=10)
    water_intake: Optional[float] = Field(None, ge=0, le=12)
    activity_minutes: Optional[int] = Field(None, ge=0, le=180)
    day_intensity: Optional[int] = Field(None, ge=1, le=10)
    mood: Optional[str] = Field(None, max_length=50)
    nutrition_photo_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)


class HealthDataResponse(BaseModel):
    id: int
    user_id: int
    date: date
    pain_level: Optional[int]
    pain_type: Optional[str]
    pain_body_map: Optional[dict[str, Any]]
    sleep_hours: Optional[float]
    sleep_quality: Optional[int]
    stress_level: Optional[int]
    water_intake: Optional[float]
    activity_minutes: Optional[int]
    day_intensity: Optional[int]
    mood: Optional[str]
    nutrition_photo_url: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
