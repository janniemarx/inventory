from . import db
from datetime import datetime

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.String(256))
    quantity = db.Column(db.Integer, default=0)
    category = db.Column(db.String(64), nullable=False)  # e.g., 'tool' or 'consumable'
    supplier_part_no = db.Column(db.String(128))  # New field
    invoice_no = db.Column(db.String(128))  # New field
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.id'))
    supplier = db.relationship('Supplier', backref=db.backref('items', lazy=True))
    amount = db.Column(db.Numeric(precision=10, scale=2))
    booked_out = db.Column(db.Integer, default=0)  # New field to track booked out quantity
    transactions = db.relationship('Transaction', backref='item', lazy=True)
    image_filename = db.Column(db.String(256))
    bin_assignment = db.Column(db.String(128))  # New field for bin assignment
    bulk_bin_assignment = db.Column(db.String(128))


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    type = db.Column(db.String(64), nullable=False)  # 'book', 'receive', or 'write-off'
    quantity = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    comments = db.Column(db.String(256))
    doc_no = db.Column(db.String(64), nullable=True)
    amount = db.Column(db.Numeric(precision=10, scale=2))

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    def __repr__(self):
        return f'<Category {self.name}>'

class Supplier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), unique=True, nullable=False)
    telephone_number = db.Column(db.String(64))
    address = db.Column(db.String(256))
    contact_person = db.Column(db.String(128))

    def __repr__(self):
        return f'<Supplier {self.name}>'

class Usage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    booked_out_by = db.Column(db.String(128))
    booked_out_to = db.Column(db.String(128))
    booked_out_quantity = db.Column(db.Integer)
    booked_out_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    booked_in_timestamp = db.Column(db.DateTime, nullable=True)  # Nullable for items not yet booked in

    item = db.relationship('Item', backref=db.backref('usages', lazy=True))

