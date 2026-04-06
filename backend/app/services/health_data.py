from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.health_data import HealthData
from app.schemas.health_data import HealthDataCreate, HealthDataUpdate


async def create_health_data(db: AsyncSession, user_id: int, data: HealthDataCreate) -> HealthData:
    db_record = HealthData(user_id=user_id, **data.model_dump())
    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)
    return db_record


async def get_health_data_list(db: AsyncSession, user_id: int) -> list[HealthData]:
    result = await db.execute(
        select(HealthData)
        .where(HealthData.user_id == user_id)
        .order_by(desc(HealthData.date))
    )
    return list(result.scalars().all())


async def get_health_data_by_id(db: AsyncSession, user_id: int, record_id: int) -> HealthData:
    result = await db.execute(
        select(HealthData)
        .where(HealthData.id == record_id, HealthData.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sağlık verisi bulunamadı",
        )
    return record


async def update_health_data(
    db: AsyncSession, user_id: int, record_id: int, data: HealthDataUpdate
) -> HealthData:
    record = await get_health_data_by_id(db, user_id, record_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    await db.commit()
    await db.refresh(record)
    return record


async def delete_health_data(db: AsyncSession, user_id: int, record_id: int) -> None:
    record = await get_health_data_by_id(db, user_id, record_id)
    await db.delete(record)
    await db.commit()
