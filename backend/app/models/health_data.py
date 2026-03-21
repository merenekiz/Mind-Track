from datetime import date, datetime

from sqlalchemy import Integer, Float, String, Text, Date, DateTime, ForeignKey, Index, func
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
    sleep_hours: Mapped[float | None] = mapped_column(Float)  # 0-24
    sleep_quality: Mapped[int | None] = mapped_column(Integer)  # 1-5
    stress_level: Mapped[int | None] = mapped_column(Integer)  # 0-10
    mood: Mapped[str | None] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    user = relationship("User", back_populates="health_data")
