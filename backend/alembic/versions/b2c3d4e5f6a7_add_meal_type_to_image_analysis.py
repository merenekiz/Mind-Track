"""add meal_type and health_data_id to image_analysis

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-25 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("image_analysis", sa.Column("meal_type", sa.String(20), nullable=True))
    op.add_column("image_analysis", sa.Column("health_data_id", sa.Integer(), nullable=True))
    op.create_index(
        "ix_image_analysis_health_data_id",
        "image_analysis",
        ["health_data_id"],
    )
    op.create_foreign_key(
        "fk_image_analysis_health_data_id",
        "image_analysis",
        "health_data",
        ["health_data_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_image_analysis_health_data_id", "image_analysis", type_="foreignkey")
    op.drop_index("ix_image_analysis_health_data_id", table_name="image_analysis")
    op.drop_column("image_analysis", "health_data_id")
    op.drop_column("image_analysis", "meal_type")
