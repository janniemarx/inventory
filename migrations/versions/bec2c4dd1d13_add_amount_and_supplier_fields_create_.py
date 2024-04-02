"""Add Amount and Supplier fields, create Supplier table

Revision ID: bec2c4dd1d13
Revises: 4e77cec75d43
Create Date: 2024-03-27 15:50:54.331474

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = 'bec2c4dd1d13'
down_revision = '4e77cec75d43'
branch_labels = None
depends_on = None

def upgrade():
    # Check if the 'supplier' table already exists
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    if 'supplier' not in inspector.get_table_names():
        op.create_table('supplier',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=128), nullable=False),
            sa.Column('telephone_number', sa.String(length=64), nullable=True),
            sa.Column('address', sa.String(length=256), nullable=True),
            sa.Column('contact_person', sa.String(length=128), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('name')
        )

    # Add 'amount' column to 'item' table
    with op.batch_alter_table('item', schema=None) as batch_op:
        batch_op.add_column(sa.Column('amount', sa.Numeric(10, 2), nullable=True))
        batch_op.add_column(sa.Column('supplier_id', sa.Integer(), nullable=True))
        if 'supplier_id' not in [fk['name'] for fk in inspector.get_foreign_keys('item')]:
            batch_op.create_foreign_key('fk_item_supplier', 'supplier', ['supplier_id'], ['id'])

def downgrade():
    # Remove 'amount' column and foreign key from 'item' table
    with op.batch_alter_table('item', schema=None) as batch_op:
        batch_op.drop_constraint('fk_item_supplier', type_='foreignkey')
        batch_op.drop_column('amount')
        batch_op.drop_column('supplier_id')

    # Drop 'supplier' table
    op.drop_table('supplier')
