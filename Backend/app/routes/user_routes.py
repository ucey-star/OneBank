# app/routes/user_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import User, RecommendationHistory
import datetime as dt
import json
import base64
import os
from functools import lru_cache
from cryptography.fernet import Fernet

user_bp = Blueprint("user_bp", __name__)

# -----------------------------
# Encryption Key Setup
# -----------------------------
@lru_cache()
def get_fernet():
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        raise Exception("ENCRYPTION_KEY not set in environment variables!")
    return Fernet(key)

# -----------------------------------------------------------
#   Profile (GET, PUT)
# -----------------------------------------------------------
@user_bp.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    """Return basic profile info for the current user."""
    user = current_user
    base64_pic = ""
    if user.profile_pic:
        # Suppose you store the picture as PNG; or store MIME type in DB.
        base64_bytes = base64.b64encode(user.profile_pic).decode('utf-8')
        base64_pic = f"data:image/png;base64,{base64_bytes}"

    return jsonify({
        "firstName": user.first_name,
        "lastName": user.last_name,
        "profilePic": base64_pic
    })

@user_bp.route('/api/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update first/last name + optional profile pic."""
    user = current_user
    user.first_name = request.form.get("firstName", user.first_name)
    user.last_name = request.form.get("lastName", user.last_name)

    # Handle file upload from multipart/form-data
    file = request.files.get("profilePic")
    if file:
        user.profile_pic = file.read()  # Storing raw bytes in DB

    db.session.commit()
    return jsonify({"message": "Profile updated successfully"})

# -----------------------------------------------------------
#   Default Reward Type
# -----------------------------------------------------------
@user_bp.route('/api/get_default_reward_type', methods=['GET'])
@login_required
def get_default_reward_type():
    """Get the user's default reward type (cashback, miles, or points)."""
    reward_type = getattr(current_user, 'default_reward_type', 'cashback')
    return jsonify({'defaultRewardType': reward_type}), 200

@user_bp.route('/api/set_default_reward_type', methods=['POST'])
@login_required
def set_default_reward_type():
    """Change the user's default reward type."""
    data = request.get_json()
    reward_type = data.get('rewardType', 'cashback')

    if reward_type not in ['cashback', 'miles', 'points']:
        return jsonify({'error': 'Invalid reward type.'}), 400

    try:
        current_user.default_reward_type = reward_type
        db.session.commit()
        return jsonify({'message': 'Default reward type updated.'}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to update reward type.'}), 500

# -----------------------------------------------------------
#   Recommendation History
# -----------------------------------------------------------
@user_bp.route('/api/recommendation-history', methods=['GET'])
@login_required
def get_recommendation_history():
    """Fetch recommendation history for the logged-in user."""
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    query = RecommendationHistory.query.filter_by(user_id=current_user.id)

    if start_date_str and end_date_str:
        # Filter by date range
        try:
            start_date_obj = dt.datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date_obj = dt.datetime.strptime(end_date_str, '%Y-%m-%d').date()
            query = query.filter(RecommendationHistory.date.between(start_date_obj, end_date_obj))
        except ValueError:
            pass

    history = query.order_by(RecommendationHistory.date).all()
    return jsonify([
        {
            "date": record.date.strftime('%Y-%m-%d'),
            "amount": record.amount,
            "recommended_card": record.recommended_card
        }
        for record in history
    ])

# -----------------------------------------------------------
#   Full Card Details for a User
# -----------------------------------------------------------
@user_bp.route('/api/get_full_card_details', methods=['GET'])
@login_required
def get_full_card_details():
    """
    Retrieve full credit card details by card type for the authenticated user.
    Query Param: cardType
    Example: /api/get_full_card_details?cardType=Chase%20Sapphire%20Preferred%C2%AE%20Card
    """
    card_type = request.args.get('cardType')
    if not card_type:
        return jsonify({"error": "Card type parameter is required."}), 400

    # Query the DB for that card belonging to the user
    card = (
        db.session.query(User)
        .join(User.credit_cards)
        .filter(User.id == current_user.id)
        .filter_by(card_type=card_type)
        .first()
    )
    if card and card.credit_cards:
        matched_card = card.credit_cards[0]
        return jsonify({
            "cardHolderName": matched_card.card_holder_name,
            "issuer": matched_card.issuer,
            "cardType": matched_card.card_type
        })
    else:
        return jsonify({"error": "No card found matching that type for this user."}), 404

# -----------------------------------------------------------
#   Encryption Utilities (used by profile pics, etc.)
# -----------------------------------------------------------
def encrypt_field(data: str) -> str:
    """Encrypt a string and return it as base64."""
    return get_fernet().encrypt(data.encode()).decode()

def safe_decrypt(token: str) -> str:
    """Attempt to decrypt; if fail, return partial fallback."""
    try:
        return decrypt_field(token)
    except Exception as e:
        print(f"Decryption error: {e}")
        return token  # fallback

def decrypt_field(token: str) -> str:
    """Decrypt the token from base64 back to the original string."""
    return get_fernet().decrypt(token.encode()).decode()
