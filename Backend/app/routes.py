from flask import Blueprint, request, jsonify, send_from_directory
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from .extensions import db
from .models import User, CreditCard, RecommendationHistory
from .card_benefits_db import credit_cards_db
import base64
import os
import datetime as dt
import json
import time
from datetime import date, timedelta
from openai import OpenAI
from cryptography.fernet import Fernet

ai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

main = Blueprint("main", __name__)

encryption_key = os.getenv("ENCRYPTION_KEY")
if not encryption_key:
    raise Exception("ENCRYPTION_KEY not set in environment variables!")

fernet = Fernet(encryption_key)

@main.route("/status")
def check_status():
    print("user is authenticated", current_user.is_authenticated)
    if current_user.is_authenticated:
        return jsonify(isLoggedIn=True)
    else:
        return jsonify(isLoggedIn=False)


# Register a new user
@main.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email")
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({"error": "Email already exists"}), 409

    new_user = User(email=email, first_name=first_name, last_name=last_name)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    login_user(new_user, remember=True)
    return (
        jsonify(
            {
                "message": "Signup successful",
                "user": {
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                },
            }
        ),
        201,
    )


# User login
@main.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        login_user(user, remember=True)
        return jsonify({"message": "Login successful", "user": {"email": email}}), 200
    return jsonify({"error": "Invalid credentials"}), 401


# User logout
@main.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

@main.route('/download-extension')
def download_extension():
    """Serve the extension ZIP file."""
    static_folder = os.path.join(os.getcwd(), 'static')  # Ensure absolute path
    return send_from_directory(static_folder, 'extension.zip', as_attachment=True)

@main.route('/api/get_credit_cards', methods=['GET'])
@login_required
def get_credit_cards():
    try:
        credit_cards = CreditCard.query.filter_by(user_id=current_user.id).all()
        if not credit_cards:
            return jsonify({
                'message': 'No credit cards found for this user.',
                'cards': []
            }), 200

        card_list = []
        for card in credit_cards:
            # Decrypt card number if you need the full value
            decrypted_number = safe_decrypt(card.card_number)
            card_list.append({
                'id': card.id,
                'cardHolderName': card.card_holder_name,
                'cardNumber': f"**** **** **** {decrypted_number[-4:]}",
                'expiryDate': card.expiry_date,
                'issuer': card.issuer,
                'cardType': card.card_type
            })

        return jsonify({'cards': card_list}), 200

    except Exception as e:
        print(f"Error fetching credit cards: {e}")
        return jsonify({'error': 'Failed to fetch credit cards'}), 500




@main.route('/api/add-credit-card', methods=["POST"])
@login_required
def add_credit_card():
    if not current_user.is_authenticated:
        return jsonify({'error': 'User not authenticated'}), 401
    
    if not request.json:
        return jsonify({'error': 'Request must be JSON'}), 400

    card_number = request.json.get('cardNumber')
    card_holder_name = request.json.get('cardHolderName')
    expiry_date = request.json.get('expiryDate')
    cvv = request.json.get('cvv')
    issuer = request.json.get('issuer')
    card_type = request.json.get('cardType')

    if not all([card_number, card_holder_name, expiry_date, cvv, issuer, card_type]):
        return jsonify({'error': 'Missing required credit card details'}), 400

    existing_card = CreditCard.query.filter_by(card_number=card_number, user_id=current_user.id).first()
    if existing_card:
        return jsonify({'error': 'Credit card already registered'}), 409

    # Encrypt sensitive fields before storing
    encrypted_card_number = encrypt_field(card_number)
    encrypted_cvv = encrypt_field(cvv)

    new_card = CreditCard(
        card_number=encrypted_card_number,
        card_holder_name=card_holder_name,
        expiry_date=expiry_date,
        cvv=encrypted_cvv,
        issuer=issuer,
        card_type=card_type,
        user_id=current_user.id
    )

    db.session.add(new_card)
    db.session.commit()

    return jsonify({
        'message': 'Credit card added successfully',
        'card': {
            # Return masked version if needed
            'cardNumber': f"**** **** **** {card_number[-4:]}",
            'cardHolderName': card_holder_name,
            'expiryDate': expiry_date,
            'issuer': issuer,
            'cardType': card_type
        }
    }), 201


def fetch_user_credit_cards(user_id):
    try:
        credit_cards = CreditCard.query.filter_by(user_id=user_id).all()
        return [{
            
            'issuer': card.issuer,
            'CardType': card.card_type,
            'number': safe_decrypt(card.card_number),
            'cvv': card.cvv,
        } for card in credit_cards]
    except Exception as e:
        print(f"Error fetching credit cards: {e}")
        return []
    
@main.route('/api/update-credit-card/<int:card_id>', methods=['PUT'])
@login_required
def update_credit_card(card_id):
    try:
        # Find the credit card by ID and ensure it belongs to the logged-in user
        card = CreditCard.query.filter_by(id=card_id, user_id=current_user.id).first()

        if not card:
            return jsonify({'error': 'Credit card not found'}), 404

        # Get updated data from request
        data = request.get_json()
        card.card_holder_name = data.get('cardHolderName', card.card_holder_name)
        card.expiry_date = data.get('expiryDate', card.expiry_date)
        card.issuer = data.get('issuer', card.issuer)
        card.card_type = data.get('cardType', card.card_type)

        db.session.commit()
        return jsonify({'message': 'Credit card updated successfully'}), 200

    except Exception as e:
        print(f"Error updating credit card: {e}")
        return jsonify({'error': 'Failed to update credit card'}), 500

@main.route('/api/check_reward_type', methods=['POST'])
@login_required
def check_reward_type():
    data = request.get_json()
    merchant = data.get('merchant', 'Unknown Merchant')
    amount = data.get('amount', 0)
    reward_type = data.get('rewardType', 'cashback')

    # Strict prompt forcing the AI to produce the correct JSON structure
    prompt = (
        f"Determine whether the selected reward type '{reward_type}' is optimal for a purchase at "
        f"'{merchant}' amounting to ${amount}.\n\n"
        "You MUST return valid JSON with EXACTLY these two fields:\n"
        "1) \"isSuitable\": a boolean (true or false)\n"
        "2) \"suggestedRewardType\": a string.\n\n"
        "If the reward type is suitable, set \"isSuitable\": true and \"suggestedRewardType\" to the same reward type.\n"
        "If the reward type is not suitable, set \"isSuitable\": false and \"suggestedRewardType\" to a better reward type.\n"
        "Return no extra text—only JSON."
    )

    try:
        completion = ai_client.chat.completions.create(
            model="gpt-4",  # or your chosen model
            messages=[
                {"role": "system", "content": "You are an expert in evaluating reward types for transactions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150
        )
        response_content = completion.choices[0].message.content.strip()
        
        # Attempt to parse the AI's response
        try:
            result = json.loads(response_content)
        except json.JSONDecodeError:
            # If it's invalid JSON, return an error
            return jsonify({"error": "Invalid response from AI", "response": response_content}), 500
        
        # ===== Server-Side Validation & Fallbacks =====
        # Ensure the AI returned both keys
        if "isSuitable" not in result or "suggestedRewardType" not in result:
            return jsonify({"error": "Missing required fields", "response": result}), 500

        # If isSuitable is not a boolean, fallback
        if not isinstance(result["isSuitable"], bool):
            result["isSuitable"] = False

        # If suggestedRewardType is missing or empty, fallback
        if not isinstance(result["suggestedRewardType"], str) or not result["suggestedRewardType"]:
            result["suggestedRewardType"] = "cashback"

        return jsonify(result), 200

    except Exception as e:
        print(f"Failed to check reward type with AI: {e}")
        return jsonify({"error": str(e)}), 500


@main.route('/api/delete_card/<int:card_id>', methods=['DELETE'])
@login_required
def delete_card(card_id):
    """Delete a credit card belonging to the logged-in user."""
    card = CreditCard.query.filter_by(id=card_id, user_id=current_user.id).first()

    if not card:
        return jsonify({"error": "Card not found or unauthorized"}), 404

    try:
        db.session.delete(card)
        db.session.commit()
        return jsonify({"message": "Card deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting the card"}), 500

@main.route('/api/analyze_dom', methods=['POST'])
def analyze_dom():
    """Analyze DOM content and extract transaction details using GPT."""
    print("Analyzing DOM")
    try:
        data = request.json
        dom_content = data.get("html")
        if not dom_content:
            return jsonify({"error": "No DOM content provided"}), 400

        # Call GPT to analyze the DOM
        try:
            completion = ai_client.chat.completions.create(
                model="gpt-4",  # Replace with the model you prefer
                messages=[
                    {
                        "role": "system",
                        "content": "You are an AI model trained to extract key information from HTML DOM content. "
                                   "Your task is to identify the merchant name from the given HTML. "
                                   "If the information cannot be determined, provide 'Unknown' for those fields."
                    },
                    {
                        "role": "user",
                        "content": f"Analyze the following HTML content:\n{dom_content}\n"
                                   f"Extract the merchant name in a strict JSON format like this: "
                                   f'{{"merchant_name": "Merchant Name"}}'
                    }
                ],
                max_tokens=150  # Adjust as needed
            )
            # Parse GPT response
            response_content = completion.choices[0].message.content
            print(dom_content)
            # print(f"Response from GPT: {response_content}")
            try:
                # Ensure the response is valid JSON
                extracted_data = json.loads(response_content)
                return jsonify(extracted_data)
            except json.JSONDecodeError:
                # print(f"Invalid JSON response from GPT: {response_content}")
                return jsonify({"error": "Invalid response from GPT", "response": response_content}), 500
        except Exception as e:
            print(f"Failed to analyze DOM with GPT: {e}")
            return jsonify({"error": "Failed to analyze DOM with GPT"}), 500

    except Exception as e:
        print(f"something else Failed: {e}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@main.route('/api/get_card_options', methods=['GET'])
def get_card_options():
    try:
        issuers = {
            issuer: list(cards.keys()) for issuer, cards in credit_cards_db.items()
        }
        return jsonify(issuers), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def get_card_benefits(issuer, card_type):
    """
    Retrieve benefits for a given issuer and card type from the credit_cards_db.
    """
    try:
        # print(f"Issuer: {issuer}, Card type: {card_type}")
        issuer_cards = credit_cards_db.get(issuer, {})
        # print(f"Issuer cards: {issuer_cards}")
        card_info = issuer_cards.get(card_type, {})
        # print(f"Card info: {card_info}")
        rewards = card_info.get("Rewards", {})
        # print(f"Card benefits: {rewards}")
        
        # Flatten rewards into a readable string
        benefits = "; ".join([f"{key}: {value}" for key, value in rewards.items()])
        # print(f"Card benefits: {benefits}")
        return benefits if benefits else "No rewards available"
    except Exception as e:
        print(f"Error fetching card benefits: {e}")
        return "No rewards available"


def get_best_card(transaction_details, user_id):
    """
    Determine the best credit card for a transaction using AI, focusing purely on cashback benefits.
    """
    # Fetch user-specific credit card data
    credit_cards = fetch_user_credit_cards(user_id)  # Fetch cards from the database
    # print(f"Credit cards: {credit_cards}")
    if not credit_cards:
        return "No credit cards available."
    
    source = transaction_details.get("source", None)

    # Prepare credit card details for AI
    cards_details = "Here are the cards and their cashback benefits: " + ", ".join(
        [f"{card.get('CardType', 'Unknown Type')}, benefits: {get_card_benefits(card.get('issuer'), card.get('CardType'))}" 
         for card in credit_cards]
    )
    print("card detiuals", cards_details)

    # Construct AI prompt
    ai_prompt = (
        f"Determine the best credit card for a purchase at {transaction_details.get('merchant', 'an unknown merchant')} "
        f"amounting to ${transaction_details['amount']}. Consider only cashback benefits when selecting the card. "
        f"Return the most suitable card(s) strictly by name, exactly as listed below: {cards_details}. "
        f"You must return a card. If only one card qualifies, return it."
    )


    try:
        # Call AI model for comparison
        completion = ai_client.chat.completions.create(
            model="gpt-4o-mini",  # Use an appropriate AI model
            messages=[
                {"role": "system", "content": cards_details},
                {"role": "user", "content": ai_prompt}
            ],
            max_tokens=500  # Enough for a concise response
        )
        
        # Extract and return AI response
        result = completion.choices[0].message.content.strip()
        if source != "playground":
            log_recommendation(user_id, transaction_details, result)
        return result
    
    except Exception as e:
        print(f"Failed to get recommendation: {e}")
        return "Error processing your request. Please try again."

@main.route('api/get_card_advice', methods=['POST'])
def card_advice():
    if not current_user.is_authenticated:
        return jsonify({"error": "User not authenticated"}), 401
    
    data = request.json
    print(data)
    user_id = current_user.id
    card_recommendation = get_best_card(data, user_id)  # Replace "transaction_details" with the actual transaction details
    print("card rec", card_recommendation)
    return jsonify({"recommended_card": card_recommendation})

def get_full_card_details_by_type(card_type, user_id):
    """
    Retrieve full card details by card type for the authenticated user.
    
    :param card_type: The type of card (e.g., "Chase Sapphire Preferred® Card").
    :param user_id: The ID of the current user.
    :return: A dictionary with full card details or an error message if not found.
    """
    try:
        # Query the database for the specific card
        card = CreditCard.query.filter_by(card_type=card_type, user_id=user_id).first()
        
        if card:
            return {
                "cardHolderName": card.card_holder_name,
                "cardNumber": safe_decrypt(card.card_number),
                "expiryDate": card.expiry_date,
                "cvv": card.cvv,
                "issuer": card.issuer,
                "cardType": card.card_type
            }
        else:
            return {"error": "No card found matching the provided type for this user."}
    
    except Exception as e:
        print(f"Error fetching full card details: {e}")
        return {"error": "Failed to retrieve card details. Please try again later."}

@main.route('/api/get_full_card_details', methods=['GET'])
@login_required
def get_full_card_details():
    """
    API endpoint to retrieve full credit card details by card type for the authenticated user.
    Query Parameter: cardType
    Example: /api/get_full_card_details?cardType=Chase%20Sapphire%20Preferred®%20Card
    """
    card_type = request.args.get('cardType')
    
    if not card_type:
        return jsonify({"error": "Card type parameter is required."}), 400
    
    user_id = current_user.id  # Get the current authenticated user ID
    
    # Fetch card details
    card_details = get_full_card_details_by_type(card_type, user_id)
    
    return jsonify(card_details)

@main.route('/api/recommendation-history', methods=['GET'])
@login_required
def get_recommendation_history():
    """Fetch recommendation history for the logged-in user."""
    start_date = request.args.get('start_date', None)
    end_date = request.args.get('end_date', None)

    query = RecommendationHistory.query.filter_by(user_id=current_user.id)

    if start_date and end_date:
        query = query.filter(RecommendationHistory.date.between(start_date, end_date))

    history = query.order_by(RecommendationHistory.date).all()

    return jsonify([
        {
            "date": record.date.strftime('%Y-%m-%d'),
            "amount": record.amount,
            "recommended_card": record.recommended_card
        } for record in history
    ])

def log_recommendation(user_id, transaction_details, recommended_card):
    print("this is transaction details", transaction_details)
    new_record = RecommendationHistory(
        user_id=user_id,
        date=dt.datetime.utcnow(),
        amount=transaction_details.get('amount'),
        recommended_card=recommended_card
    )
    db.session.add(new_record)
    db.session.commit()


def pretty_print_response(response):
    print(json.dumps(response, indent=2, sort_keys=True, default=str))


def format_error(e):
    response = json.loads(e.body)
    return {'error': {'status_code': e.status, 'display_message':
                      response.error_message, 'error_code': response.error_code, 'error_type': response.error_type}}


def encrypt_field(data: str) -> str:
    """Encrypt a string and return the encrypted token as a string."""
    return fernet.encrypt(data.encode()).decode()

def safe_decrypt(token: str) -> str:
    try:
        return decrypt_field(token)
    except Exception as e:
        print(f"Decryption error: {e}")
        # Fallback: return token as-is or a masked version
        return token  
def decrypt_field(token: str) -> str:
    """Decrypt an encrypted token back to a string."""
    return fernet.decrypt(token.encode()).decode()