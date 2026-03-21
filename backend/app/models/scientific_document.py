from datetime import date, datetime

from sqlalchemy import String, Text, Date, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector

from app.core.database import Base


class ScientificDocument(Base):
    __tablename__ = "scientific_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    pubmed_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    abstract: Mapped[str | None] = mapped_column(Text)
    authors: Mapped[str | None] = mapped_column(Text)
    published_date: Mapped[date | None] = mapped_column(Date)
    embedding = mapped_column(Vector(768), nullable=True)  # Gemini text-embedding-004
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
