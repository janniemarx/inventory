from datetime import datetime
from flask import Blueprint, request, render_template, redirect, url_for, flash, jsonify
from decimal import Decimal
from .models import Item, Transaction, Category, Supplier, Usage
from . import db
from flask import current_app as app

bp = Blueprint('inventory', __name__)

@bp.route('/')
def index():
    items = Item.query.all()
    return render_template('inventory_list.html', items=items)

@bp.route('/book/<int:item_id>', methods=['GET', 'POST'])
def book_item(item_id):
    item = Item.query.get_or_404(item_id)
    if request.method == 'POST':
        quantity = request.form.get('quantity', type=int)
        if item.quantity >= quantity:  # Ensure there are enough items to book
            item.quantity -= quantity
            transaction = Transaction(item_id=item.id, type='book', quantity=quantity)
            db.session.add(transaction)
            db.session.commit()
            flash('Item booked successfully.')
        else:
            flash('Not enough items in stock.')
        return redirect(url_for('inventory.index'))
    return render_template('book_item.html', item=item)

@bp.route('/receive', methods=['GET', 'POST'])
def receive_item():
    suppliers = Supplier.query.all()  # Fetch suppliers for GET and POST requests

    if request.method == 'POST':
        name = request.form['name'].strip()
        supplier_part_no = request.form['supplier_part_no'].strip()
        quantity_received = request.form.get('quantity', type=int)
        amount_received = Decimal(request.form.get('amount', type=str))  # Convert amount to string then to Decimal

        # Check if the item already exists
        existing_item = Item.query.filter_by(name=name, supplier_part_no=supplier_part_no).first()

        if existing_item:
            # Update existing item's quantity and amount
            existing_total_amount = existing_item.amount * existing_item.quantity
            new_total_amount = amount_received * quantity_received
            existing_item.quantity += quantity_received
            existing_item.amount = (existing_total_amount + new_total_amount) / existing_item.quantity
            transaction = Transaction(item_id=existing_item.id, type='receive', quantity=quantity_received)
            db.session.add(transaction)
            db.session.commit()
            flash('Existing item quantity updated successfully.')
        else:
            # No existing item, create a new one
            new_item = Item(
                name=name,
                description=request.form.get('description', '').strip(),
                quantity=quantity_received,
                category=request.form.get('category', '').strip(),
                supplier_part_no=supplier_part_no,
                invoice_no=request.form.get('invoice_no', '').strip(),
                amount=amount_received,  # Already a Decimal type
                supplier_id=request.form.get('supplier_id', type=int)
            )
            db.session.add(new_item)
            db.session.commit()
            flash('New item received successfully.')

        return redirect(url_for('inventory.index'))

    # Render the form for GET requests or failed POST validation
    return render_template('receive_item.html', suppliers=suppliers)


@bp.route('/write_off/<int:item_id>', methods=['GET', 'POST'])
def write_off_item(item_id):
    item = Item.query.get_or_404(item_id)
    if request.method == 'POST':
        quantity = request.form.get('quantity', type=int)
        if item.quantity >= quantity:  # Check there are enough items to write off
            item.quantity -= quantity
            transaction = Transaction(item_id=item.id, type='write-off', quantity=quantity)
            db.session.add(transaction)
            db.session.commit()
            flash('Item written off successfully.')
        else:
            flash('Not enough items in stock to write off.')
        return redirect(url_for('inventory.index'))
    return render_template('write_off_item.html', item=item)


@bp.route('/add_category', methods=['POST'])
def add_category():
    category_name = request.form.get('categoryName').strip()
    if category_name:
        existing_category = Category.query.filter_by(name=category_name).first()
        if not existing_category:
            new_category = Category(name=category_name)
            db.session.add(new_category)
            db.session.commit()
            return jsonify({'success': True, 'categoryName': category_name}), 200
        else:
            return jsonify({'success': False, 'message': 'Category already exists.'}), 409  # 409 Conflict
    return jsonify({'success': False, 'message': 'Invalid category name.'}), 400  # 400 Bad Request

@bp.route('/get_categories')
def get_categories():
    categories = Category.query.all()
    categories_list = [{'id': category.id, 'name': category.name} for category in categories]
    return jsonify(categories_list)

@bp.route('/add_supplier', methods=['POST'])
def add_supplier():
    name = request.form.get('name').strip()
    telephone_number = request.form.get('telephone_number').strip()
    address = request.form.get('address').strip()
    contact_person = request.form.get('contact_person').strip()

    if name:
        existing_supplier = Supplier.query.filter_by(name=name).first()
        if not existing_supplier:
            new_supplier = Supplier(name=name, telephone_number=telephone_number,
                                    address=address, contact_person=contact_person)
            db.session.add(new_supplier)
            db.session.commit()
            return jsonify({'success': True, 'supplierName': name}), 200
        else:
            return jsonify({'success': False, 'message': 'Supplier already exists.'}), 409  # Conflict
    return jsonify({'success': False, 'message': 'Invalid supplier name.'}), 400  # Bad Request


@bp.route('/search_items')
def search_items():
    query = request.args.get('q', '').strip()
    search_type = request.args.get('type', '')  # "name" or "supplier_part_no"
    items_list = []
    try:
        if query:
            if search_type == 'name':
                results = Item.query.filter(Item.name.ilike(f'%{query}%')).all()
            elif search_type == 'supplier_part_no':
                results = Item.query.filter(Item.supplier_part_no.ilike(f'%{query}%')).all()
            else:
                return jsonify({'error': 'Invalid search type.'}), 400

            for item in results:
                item_dict = {
                    'id': item.id,
                    'name': item.name,
                    'description': item.description,
                    'supplier_part_no': item.supplier_part_no,
                    'amount': str(item.amount), # Convert decimal to string
                    'category': item.category, # Use the category string
                    'supplier_id': item.supplier_id, # This should be correct based on your Item model
                }
                items_list.append(item_dict)
        return jsonify(items_list)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'An error occurred while searching items.'}), 500

@bp.route('/book_out', methods=['POST'])
def book_out_item():
    item_id = request.form.get('item_id', type=int)
    booked_out_quantity = request.form.get('booked_out_quantity', type=int)
    booked_out_by = request.form.get('booked_out_by')
    booked_out_to = request.form.get('booked_out_to')

    app.logger.info(f'Received book out request: item_id={item_id}, booked_out_quantity={booked_out_quantity}, booked_out_by={booked_out_by}, booked_out_to={booked_out_to}')

    item = Item.query.get_or_404(item_id)
    if item.quantity >= booked_out_quantity:
        item.quantity -= booked_out_quantity
        item.booked_out += booked_out_quantity
        usage = Usage(item_id=item.id, booked_out_by=booked_out_by, booked_out_to=booked_out_to, booked_out_quantity=booked_out_quantity)
        db.session.add(usage)
        db.session.commit()
        app.logger.info('Item booked out successfully.')
        flash('Item booked out successfully.')
    else:
        app.logger.warning('Not enough items in stock to book out.')
        flash('Not enough items in stock.')
    return redirect(url_for('inventory.index'))

@bp.route('/usage_records/<int:item_id>', methods=['GET'])
def get_usage_records(item_id):
    usage_records = Usage.query.filter_by(item_id=item_id, booked_in_timestamp=None).all()
    records = [{
        'id': record.id,
        'item_name': record.item.name,  # This attribute should represent the name of the tool/item.
        'booked_out_by': record.booked_out_by,
        'booked_out_to': record.booked_out_to,
        'booked_out_quantity': record.booked_out_quantity,
        'booked_out_timestamp': record.booked_out_timestamp.strftime('%Y-%m-%d %H:%M:%S')
    } for record in usage_records]
    return jsonify(records)



@bp.route('/book_in/<int:usage_id>', methods=['POST'])
def book_in_item(usage_id):
    usage = Usage.query.get_or_404(usage_id)
    if not usage.booked_in_timestamp:
        usage.booked_in_timestamp = datetime.utcnow()
        item = usage.item
        item.quantity += usage.booked_out_quantity
        item.booked_out -= usage.booked_out_quantity
        db.session.commit()
        flash(f'Item {item.name} booked in successfully.')
    else:
        flash('This usage record has already been booked in.', 'error')
    return redirect(url_for('inventory.index'))
