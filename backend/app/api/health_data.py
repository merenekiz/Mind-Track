from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.health_data import HealthDataCreate, HealthDataUpdate, HealthDataResponse
from app.services.health_data import (
    create_health_data,
    get_health_data_list,
    get_health_data_by_id,
    update_health_data,
    delete_health_data,
)

router = APIRouter()


@router.post("", response_model=HealthDataResponse, status_code=201)
async def add_health_data(
    data: HealthDataCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_health_data(db, current_user.id, data)


@router.get("", response_model=list[HealthDataResponse])
async def list_health_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_health_data_list(db, current_user.id)


@router.get("/{record_id}", response_model=HealthDataResponse)
async def get_health_data(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_health_data_by_id(db, current_user.id, record_id)


@router.put("/{record_id}", response_model=HealthDataResponse)
async def edit_health_data(
    record_id: int,
    data: HealthDataUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await update_health_data(db, current_user.id, record_id, data)


@router.delete("/{record_id}", status_code=204)
async def remove_health_data(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_health_data(db, current_user.id, record_id)
