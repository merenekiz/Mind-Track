from datetime import date, datetime

from sqlalchemy import Text, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Symptom(Base):
    __tablename__ = "symptoms"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    detected_symptoms: Mapped[dict] = mapped_column(JSONB, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="symptoms")
