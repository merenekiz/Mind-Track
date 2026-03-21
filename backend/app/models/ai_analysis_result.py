from datetime import date, datetime

from sqlalchemy import Text, Date, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AIAnalysisResult(Base):
    __tablename__ = "ai_analysis_results"
    __table_args__ = (
        Index("ix_ai_analysis_user_date", "user_id", "date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    recommendations: Mapped[dict] = mapped_column(JSONB, nullable=False)
    scientific_references: Mapped[dict] = mapped_column(JSONB, nullable=True)
    data_used: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="ai_analysis_results")
