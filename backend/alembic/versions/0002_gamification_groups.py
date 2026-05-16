"""gamification groups and weekly statistics

Revision ID: 0002_gamification_groups
Revises: 0001_initial_schema
Create Date: 2026-05-16 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_gamification_groups"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.add_column("labs", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_labs_completed_at", "labs", ["completed_at"])
    op.execute("UPDATE labs SET completed_at = updated_at WHERE status IN ('completed', 'submitted')")

    op.add_column("learning_tasks", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_learning_tasks_completed_at", "learning_tasks", ["completed_at"])
    op.execute("UPDATE learning_tasks SET completed_at = updated_at WHERE is_completed = true")

    op.create_table(
        "groups",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("invite_code", sa.String(length=32), nullable=False, unique=True),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_groups_invite_code", "groups", ["invite_code"])
    op.create_index("ix_groups_created_by_user_id", "groups", ["created_by_user_id"])

    op.create_table(
        "group_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("group_id", sa.Integer(), sa.ForeignKey("groups.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        *timestamps(),
        sa.UniqueConstraint("group_id", "user_id", name="uq_group_members_group_user"),
    )
    op.create_index("ix_group_members_group_id", "group_members", ["group_id"])
    op.create_index("ix_group_members_user_id", "group_members", ["user_id"])

    op.create_table(
        "weekly_statistics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("group_id", sa.Integer(), sa.ForeignKey("groups.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("week_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_labs_on_time", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_labs_late", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_learning_tasks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("streak_bonus_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("points", sa.Integer(), nullable=False, server_default="0"),
        *timestamps(),
        sa.UniqueConstraint("group_id", "user_id", "week_start", name="uq_weekly_statistics_group_user_week"),
    )
    op.create_index("ix_weekly_statistics_group_id", "weekly_statistics", ["group_id"])
    op.create_index("ix_weekly_statistics_user_id", "weekly_statistics", ["user_id"])
    op.create_index("ix_weekly_statistics_week_start", "weekly_statistics", ["week_start"])
    op.create_index("ix_weekly_statistics_points", "weekly_statistics", ["points"])


def downgrade() -> None:
    op.drop_table("weekly_statistics")
    op.drop_table("group_members")
    op.drop_table("groups")
    op.drop_index("ix_learning_tasks_completed_at", table_name="learning_tasks")
    op.drop_column("learning_tasks", "completed_at")
    op.drop_index("ix_labs_completed_at", table_name="labs")
    op.drop_column("labs", "completed_at")
