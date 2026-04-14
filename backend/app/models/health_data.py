from datetime import date, datetime

from sqlalchemy import Integer, Float, String, Text, Date, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class HealthData(Base):
    __tablename__ = "health_data"
    __table_args__ = (
        Index("ix_health_data_user_date", "user_id", "date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    pain_level: Mapped[int | None] = mapped_column(Integer)  # 0-10
    pain_type: Mapped[str | None] = mapped_column(String(50))  # bulanti, bas_donmesi, carpinti, siskinlik, bas_agrisi
    pain_body_map: Mapped[dict | None] = mapped_column(JSONB)  # {"regions": ["head","chest"], "notes": "..."}
    sleep_hours: Mapped[float | None] = mapped_column(Float)  # 0-24
    sleep_quality: Mapped[int | None] = mapped_column(Integer)  # 1-5
    stress_level: Mapped[int | None] = mapped_column(Integer)  # 0-10
    water_intake: Mapped[float | None] = mapped_column(Float)  # 0-12 litre
    activity_minutes: Mapped[int | None] = mapped_column(Integer)  # 0-180 dk
    day_intensity: Mapped[int | None] = mapped_column(Integer)  # 1-10
    mood: Mapped[str | None] = mapped_column(String(50))
    nutrition_photo_url: Mapped[str | None] = mapped_column(String(500))  # beslenme fotoğrafı yolu
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    user = relationship("User", back_populates="health_data")
