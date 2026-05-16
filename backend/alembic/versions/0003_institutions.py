"""institutions for schools colleges and universities

Revision ID: 0003_institutions
Revises: 0002_gamification_groups
Create Date: 2026-05-16 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_institutions"
down_revision: str | None = "0002_gamification_groups"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "institutions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("city", sa.String(length=255), nullable=True),
        sa.Column("country", sa.String(length=255), nullable=True),
        sa.Column("invite_code", sa.String(length=32), nullable=False, unique=True),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_institutions_type", "institutions", ["type"])
    op.create_index("ix_institutions_invite_code", "institutions", ["invite_code"])
    op.create_index("ix_institutions_created_by_user_id", "institutions", ["created_by_user_id"])

    op.create_table(
        "institution_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("institution_id", sa.Integer(), sa.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        *timestamps(),
        sa.UniqueConstraint("institution_id", "user_id", name="uq_institution_members_institution_user"),
    )
    op.create_index("ix_institution_members_institution_id", "institution_members", ["institution_id"])
    op.create_index("ix_institution_members_user_id", "institution_members", ["user_id"])

    op.add_column("groups", sa.Column("institution_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_groups_institution_id", "groups", "institutions", ["institution_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_groups_institution_id", "groups", ["institution_id"])


def downgrade() -> None:
    op.drop_index("ix_groups_institution_id", table_name="groups")
    op.drop_constraint("fk_groups_institution_id", "groups", type_="foreignkey")
    op.drop_column("groups", "institution_id")
    op.drop_table("institution_members")
    op.drop_table("institutions")
