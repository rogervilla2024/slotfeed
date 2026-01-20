"""Add game_content table for SEO content

Revision ID: 20260107_000002
Revises: 20260101_000001
Create Date: 2026-01-07

This migration adds the game_content table to store educational and SEO content
for each slot game including overview, RTP explanation, volatility analysis,
bonus features, strategies, and streamer insights.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260107_000002'
down_revision: Union[str, None] = '20260101_000001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create game_content table
    op.create_table(
        'game_content',
        sa.Column('game_id', sa.String(36), sa.ForeignKey('games.id'), primary_key=True),
        sa.Column('overview', sa.Text, nullable=True, comment='50-75 word game overview'),
        sa.Column('rtp_explanation', sa.Text, nullable=True, comment='75-100 word RTP explanation'),
        sa.Column('volatility_analysis', sa.Text, nullable=True, comment='75-100 word volatility analysis'),
        sa.Column('bonus_features', sa.Text, nullable=True, comment='100-125 word bonus features guide'),
        sa.Column('strategies', sa.Text, nullable=True, comment='75-100 word winning strategies'),
        sa.Column('streamer_insights', sa.Text, nullable=True, comment='25-50 word streamer insights'),
        sa.Column('meta_description', sa.String(160), nullable=True, comment='SEO meta description (160 char max)'),
        sa.Column('focus_keywords', postgresql.ARRAY(sa.String(100)), nullable=True, comment='Array of SEO keywords'),
        sa.Column('is_published', sa.Boolean, default=False, comment='Content published status'),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # Create index on game_id for faster lookups
    op.create_index('idx_game_content_published', 'game_content', ['is_published'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_game_content_published')

    # Drop table
    op.drop_table('game_content')
