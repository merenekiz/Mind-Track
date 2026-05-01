from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class IngestRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    max_results: int = Field(5, ge=1, le=20)
    summarize: bool = True


class DocumentSummary(BaseModel):
    id: int
    pubmed_id: str
    title: str
    published_date: Optional[str] = None


class IngestResponse(BaseModel):
    query: str
    found: int
    new: int
    skipped: int
    documents: list[DocumentSummary]


class SearchResultItem(BaseModel):
    id: int
    pubmed_id: str
    title: str
    abstract: Optional[str] = None
    authors: Optional[str] = None
    published_date: Optional[str] = None
    similarity: float


class ScientificDocumentOut(BaseModel):
    id: int
    pubmed_id: str
    title: str
    abstract: Optional[str] = None
    authors: Optional[str] = None
    published_date: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}
