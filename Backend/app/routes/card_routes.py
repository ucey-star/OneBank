# app/routes/card_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import CreditCard
from app.card_benefits_db import credit_cards_db

card_bp = Blueprint("card_bp", __name__)

@card_bp.route('/api/get_credit_cards', methods=['GET'])
@login_required
def get_credit_cards():
    """Fetch all credit cards for the logged-in user."""
    try:
        cards = CreditCard.query.filter_by(user_id=current_user.id).all()
        if not cards:
            return jsonify({
                'message': 'No credit cards found for this user.',
                'cards': []
            }), 200

        card_list = []
        for card in cards:
            card_list.append({
                'id': card.id,
                'cardHolderName': card.card_holder_name,
                'issuer': card.issuer,
                'cardType': card.card_type,
                'socialized_benefits': card.socialized_benefits
            })

        return jsonify({'cards': card_list}), 200
    except Exception as e:
        print(f"Error fetching credit cards: {e}")
        return jsonify({'error': 'Failed to fetch credit cards'}), 500

@card_bp.route('/api/add-credit-card', methods=['POST'])
@login_required
def add_credit_card():
    """Add a new credit card for the logged-in user."""
    if not current_user.is_authenticated:
        return jsonify({'error': 'User not authenticated'}), 401

    if not request.json:
        return jsonify({'error': 'Request must be JSON'}), 400

    card_holder_name = request.json.get('cardHolderName')
    issuer = request.json.get('issuer')
    card_type = request.json.get('cardType')

    if not all([card_holder_name, issuer, card_type]):
        return jsonify({'error': 'Missing required credit card details'}), 400

    # Check if a similar card is already registered
    existing_card = CreditCard.query.filter_by(
        card_holder_name=card_holder_name,
        issuer=issuer,
        card_type=card_type,
        user_id=current_user.id
    ).first()
    if existing_card:
        return jsonify({'error': 'Credit card already registered'}), 409

    new_card = CreditCard(
        card_holder_name=card_holder_name,
        issuer=issuer,
        card_type=card_type,
        user_id=current_user.id
    )

    db.session.add(new_card)
    db.session.commit()

    return jsonify({
        'message': 'Credit card added successfully',
        'card': {
            'id': new_card.id,
            'cardHolderName': card_holder_name,
            'issuer': issuer,
            'cardType': card_type
        }
    }), 201

@card_bp.route('/api/update-credit-card/<int:card_id>', methods=['PUT'])
@login_required
def update_credit_card(card_id):
    """Update details of an existing credit card."""
    try:
        card = CreditCard.query.filter_by(id=card_id, user_id=current_user.id).first()
        if not card:
            return jsonify({'error': 'Credit card not found'}), 404

        data = request.get_json()
        card.card_holder_name = data.get('cardHolderName', card.card_holder_name)
        card.issuer = data.get('issuer', card.issuer)
        card.card_type = data.get('cardType', card.card_type)

        db.session.commit()
        return jsonify({'message': 'Credit card updated successfully'}), 200
    except Exception as e:
        print(f"Error updating credit card: {e}")
        return jsonify({'error': 'Failed to update credit card'}), 500

@card_bp.route('/api/update-card-benefits/<int:card_id>', methods=['PUT'])
@login_required
def update_card_benefits(card_id):
    """Update the socialized benefits of a user's credit card."""
    data = request.get_json()
    benefits = data.get('benefits')
    card = CreditCard.query.filter_by(id=card_id, user_id=current_user.id).first()
    if not card:
        return jsonify({'error': 'Credit card not found'}), 404

    card.socialized_benefits = benefits
    db.session.commit()
    return jsonify({'message': 'Benefits updated successfully'}), 200

@card_bp.route('/api/delete_card/<int:card_id>', methods=['DELETE'])
@login_required
def delete_card(card_id):
    """Delete a user's credit card."""
    card = CreditCard.query.filter_by(id=card_id, user_id=current_user.id).first()
    if not card:
        return jsonify({"error": "Card not found or unauthorized"}), 404

    try:
        db.session.delete(card)
        db.session.commit()
        return jsonify({"message": "Card deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting card: {e}")
        return jsonify({"error": "An error occurred while deleting the card"}), 500

@card_bp.route('/api/get_card_options', methods=['GET'])
def get_card_options():
    """Return a list of issuers and their associated card types."""
    try:
        # card_benefits_db is a dictionary: { issuer: { card_type: {...}, ...}, ... }
        issuers = {
            issuer: list(cards.keys()) for issuer, cards in credit_cards_db.items()
        }
        return jsonify(issuers), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@card_bp.route('/api/get_card_benefits', methods=['GET'])
@login_required
def get_all_card_benefits_route():
    """Return rewards/benefits info for a given issuer + cardType."""
    issuer = request.args.get('issuer')
    card_type = request.args.get('cardType')

    if not issuer or not card_type:
        return jsonify({"error": "Missing required parameters: issuer and cardType"}), 400

    card_data = credit_cards_db.get(issuer, {}).get(card_type, {})
    if not card_data:
        return jsonify({"error": "No data found for the specified card"}), 404

    # Only include non-empty dict sections
    result = {}
    for section in [
        "rewards_structure",
        "redemption",
        "additional_benefits",
        "seasonal_benefits",
        "quarterly_categories",
    ]:
        value = card_data.get(section)
        if isinstance(value, dict) and len(value) > 0:
            result[section] = value

    return jsonify(result), 200

def fetch_user_credit_cards(user_id):
    """
    Utility to fetch all credit cards belonging to a user.
    Called by AI routes to analyze user cards, etc.
    """
    try:
        credit_cards = CreditCard.query.filter_by(user_id=user_id).all()
        return [{
            'issuer': card.issuer,
            'CardType': card.card_type,
            'cardHolderName': card.card_holder_name,
        } for card in credit_cards]
    except Exception as e:
        print(f"Error fetching credit cards: {e}")
        return []
