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

@main.route('/api/analyze_rewards', methods=['POST'])
@login_required
def analyze_rewards():
    """
    1. Parse input data (merchant, amount, user-chosen rewardType).
    2. Fetch user's credit cards.
    3. Compute a table of each card's {cardName, cashback, miles, points}.
    4. Send the entire table + user-chosen type to ChatGPT, asking it to decide best reward type & card.
    5. Return JSON with { analysisResults, explanation, recommendedCard, recommendedRewardType }.
    """

    # 1. Parse input
    data = request.get_json(force=True) or {}
    merchant = data.get("merchant", "Unknown Merchant")
    user_selected_type = data.get("rewardType", "cashback")
    source = data.get("source", None)

    raw_amount = data.get("amount", 0.0)
    try:
        amount = float(raw_amount)
    except (ValueError, TypeError):
        amount = 0.0

    user_id = current_user.id
    user_cards = fetch_user_credit_cards(user_id)
    if not user_cards:
        return jsonify({
            "analysisResults": [],
            "explanation": "No credit cards available for analysis.",
            "recommendedCard": None,
            "recommendedRewardType": None
        }), 200

    # 2. Build the table
    analysis_results = []
    for card in user_cards:
        issuer = card.get("issuer")
        card_type = card.get("CardType")
        card_data = credit_cards_db.get(issuer, {}).get(card_type, {})

        rewards_structure = card_data.get("rewards_structure", {})
        redemption_info = card_data.get("redemption", {})

        row = {
            "cardName": f"{issuer} {card_type}",
            "cashback": "N/A",
            "miles": "N/A",
            "points": "N/A"
        }

        # Calculate 'cashback'
        if "cashback" in rewards_structure:
            best_cat = get_best_category_for_merchant(
                merchant, "cashback", list(rewards_structure["cashback"].keys())
            )
            if best_cat not in rewards_structure["cashback"]:
                if "Everything else" in rewards_structure["cashback"]:
                    multiplier = rewards_structure["cashback"]["Everything else"]
                else:
                    multiplier = average_multiplier(rewards_structure["cashback"])
            else:
                multiplier = rewards_structure["cashback"][best_cat]

            row["cashback"] = multiplier * 100

        # Calculate 'miles'
        if "miles" in rewards_structure:
            best_cat = get_best_category_for_merchant(
                merchant, "miles", list(rewards_structure["miles"].keys())
            )
            if best_cat not in rewards_structure["miles"]:
                if "All other purchases" in rewards_structure["miles"]:
                    multiplier = rewards_structure["miles"]["All other purchases"]
                else:
                    multiplier = average_multiplier(rewards_structure["miles"])
            else:
                multiplier = rewards_structure["miles"][best_cat]

            miles_to_cash = redemption_info.get("miles_to_cash", 0.0)
            row["miles"] = multiplier * miles_to_cash * 100

        # Calculate 'points'
        if "points" in rewards_structure:
            best_cat = get_best_category_for_merchant(
                merchant, "points", list(rewards_structure["points"].keys())
            )
            if best_cat not in rewards_structure["points"]:
                if "Everything else" in rewards_structure["points"]:
                    multiplier = rewards_structure["points"]["Everything else"]
                else:
                    multiplier = average_multiplier(rewards_structure["points"])
            else:
                multiplier = rewards_structure["points"][best_cat]

            points_to_cash = redemption_info.get("points_to_cash", 0.0)
            row["points"] = multiplier * points_to_cash * 100

        analysis_results.append(row)

    # 3. Build a prompt
    prompt_lines = []
    prompt_lines.append(f"Merchant: {merchant}, transaction amount: ${amount:.2f}")
    prompt_lines.append(f"Your chosen reward type: {user_selected_type}")
    prompt_lines.append("Here is the reward table (columns: cashback, miles, points are in %):")

    for row in analysis_results:
        prompt_lines.append(
            f"- {row['cardName']}: cashback={row['cashback']}, "
            f"miles={row['miles']}, points={row['points']}"
        )

    prompt_lines.append("")
    prompt_lines.append(
        """
        Personalized Instructions:
        1. Speak directly to the user ("you", "your").
        2. If the merchant is obviously non-travel (e.g., Amazon), do NOT recommend miles as the best option
        unless the user explicitly wants to earn miles for future travel. But please when giving your analysis do not reference the fact that the company is not a travel-related company please
        3. Focus primarily on the user's chosen reward type, but if it seems clearly suboptimal for the merchant,
        politely explain why and offer a better alternative.
        4. Reference the percentages from the table (cashback, miles, points) and explain the rationale.
        5. Use a friendly, personal tone.
        6. Return ONLY valid JSON with these EXACT keys:
        {
        "recommendedRewardType": "...",
        "recommendedCard": "...",
        "explanation": "..."
        }
        No text outside this JSON.
        """
    )

    final_prompt = "\n".join(prompt_lines)

    # 4. Call ChatGPT
    try:
        response = ai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                # (B) Strengthen prompt for system
                {"role": "system", "content": (
                    "You are a helpful financial advisor. "
                    "Answer ONLY in valid JSON with the keys: "
                    "recommendedRewardType, recommendedCard, explanation."
                )},
                {"role": "user", "content": final_prompt}
            ],
            max_tokens=500
        )

        # Extract the raw text
        gpt_content = response.choices[0].message.content.strip()

        # (A) Print raw response for debugging

        # Attempt to parse the JSON
        gpt_json = json.loads(gpt_content)

        recommended_reward_type = gpt_json.get("recommendedRewardType", None)
        recommended_card = gpt_json.get("recommendedCard", None)
        explanation = gpt_json.get("explanation", "No explanation provided.")
        if source != "playground":
            log_recommendation(user_id, data, recommended_card)
    except Exception as e:
        print(f"ChatGPT error: {e}")
        # Fallback
        recommended_reward_type = None
        recommended_card = None
        explanation = (
            "Unable to generate AI-based analysis at this time. "
            "Here is the table of returns for your reference."
        )

    # 5. Return final JSON
    return jsonify({
        "analysisResults": analysis_results,
        "explanation": explanation,
        "recommendedCard": recommended_card,
        "recommendedRewardType": recommended_reward_type
    }), 200

# ----------------------------------------------------------------------
# Example: get_best_category_for_merchant
# ----------------------------------------------------------------------
def get_best_category_for_merchant(merchant: str, reward_type: str, categories: list) -> str:
    """
    Ask ChatGPT which subcategory best fits the merchant. 
    Return that subcategory or fallback is handled by caller if not found.
    """
    if not categories:
        return "Everything else"

    prompt = f"""
You are an expert in matching merchants to credit card reward categories.
Given the merchant "{merchant}", the reward type "{reward_type}",
and these possible categories {categories}, which single category best fits?
Return strictly JSON like {{"category":"Dining"}}. If nothing fits, {{"category":"Everything else"}}.
"""
    try:
        resp = ai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a concise assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100
        )
        content = resp.choices[0].message.content.strip()
        obj = json.loads(content)
        return obj.get("category", "Everything else")
    except Exception as e:
        print(f"get_best_category_for_merchant error: {e}")
        return "Everything else"


def average_multiplier(mdict: dict) -> float:
    """Compute average among the dict's values or return 0.0 if empty."""
    if not mdict:
        return 0.0
    vals = list(mdict.values())
    return sum(vals) / len(vals)


def is_suitable_reward_type(merchant_name: str, reward_type: str) -> bool:
    """
    Use the ChatGPT API to decide if a reward type is suitable for a given merchant.
    
    The function constructs a prompt for ChatGPT with the merchant name and reward type.
    For example, if the reward type is "miles", it should only be considered suitable
    if the merchant is travel-related (e.g., airline, hotel, travel agency, etc.).
    The ChatGPT API is instructed to return a JSON object like:
      {"suitable": true} or {"suitable": false}
    
    :param merchant_name: Name of the merchant (e.g., "Delta Airlines", "Amazon", etc.)
    :param reward_type: Reward type (e.g., "cashback", "points", or "miles")
    :return: True if the reward type is suitable for the merchant; otherwise, False.
    """
    prompt = f"""
You are an expert financial advisor specializing in credit card rewards.
Given the merchant name "{merchant_name}" and the reward type "{reward_type}", determine if the reward type is appropriate for this merchant.
For instance, if the reward type is "miles", it should only be considered suitable if the merchant is related to travel (such as airlines, hotels, or travel agencies).
Return your answer strictly as a JSON object with a single field "suitable" that is either true or false. Do not include any extra text.
"""
    try:
        response = ai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a concise financial advisor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=50
        )
        # Parse the response from ChatGPT.
        result = json.loads(response.choices[0].message.content.strip())
        return result.get("suitable", False)
    except Exception as e:
        print(f"Error in ChatGPT suitability check: {e}")
        # Fallback: if an error occurs, default to True.
        return True

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