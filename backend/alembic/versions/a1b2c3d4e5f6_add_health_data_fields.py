"""add health data fields: water_intake, activity_minutes, day_intensity, pain_type, pain_body_map, nutrition_photo_url

Revision ID: a1b2c3d4e5f6
Revises: 5c68aede95d8
Create Date: 2026-04-13 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "5c68aede95d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("health_data", sa.Column("pain_type", sa.String(50), nullable=True))
    op.add_column("health_data", sa.Column("pain_body_map", JSONB, nullable=True))
    op.add_column("health_data", sa.Column("water_intake", sa.Float, nullable=True))
    op.add_column("health_data", sa.Column("activity_minutes", sa.Integer, nullable=True))
    op.add_column("health_data", sa.Column("day_intensity", sa.Integer, nullable=True))
    op.add_column("health_data", sa.Column("nutrition_photo_url", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("health_data", "nutrition_photo_url")
    op.drop_column("health_data", "day_intensity")
    op.drop_column("health_data", "activity_minutes")
    op.drop_column("health_data", "water_intake")
    op.drop_column("health_data", "pain_body_map")
    op.drop_column("health_data", "pain_type")
