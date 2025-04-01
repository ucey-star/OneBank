# app/routes/ai_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
import json
import os
import datetime as dt

from openai import OpenAI
from app.extensions import db
from app.models import RecommendationHistory
from app.routes.card_routes import fetch_user_credit_cards
from app.card_benefits_db import credit_cards_db
from functools import lru_cache

@lru_cache()
def get_ai_client():
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ai_bp = Blueprint("ai_bp", __name__)

# -----------------------------------------------------------
#   /api/check_reward_type
# -----------------------------------------------------------
@ai_bp.route('/api/check_reward_type', methods=['POST'])
@login_required
def check_reward_type():
    """
    Step-by-step approach:
      1) Figure out if the merchant is travel-related. If not, miles = 0% effectively.
      2) For each of the user's cards, find the best earn rate for each reward type (cashback, miles, points).
      3) Keep track of the maximum possible earn rate (in % form) for each reward type across all the user's cards.
      4) Hand these max rates to GPT, along with the user's chosen reward type and merchant name.
      5) GPT returns a strict JSON object: 
          {
            "isSuitable": bool,
            "suggestedRewardType": "cashback" | "miles" | "points"
          }
    """

    data = request.get_json() or {}
    merchant = data.get('merchant', 'Unknown Merchant')
    amount = data.get('amount', 0.0)
    chosen_type = data.get('rewardType', 'cashback').lower().strip()

    user_id = current_user.id
    user_cards = fetch_user_credit_cards(user_id)
    if not user_cards:
        # If user has no cards, fallback
        return jsonify({
            "isSuitable": False,
            "suggestedRewardType": "cashback"
        }), 200

    # 1) Is merchant travel-related?
    travel_keywords = ["airline", "hotel", "travel", "vacation", "rentacar", "rental car"]
    merchant_lower = merchant.lower()
    is_travel_merchant = any(keyword in merchant_lower for keyword in travel_keywords)

    # 2) Find best rates for each reward type across the user's entire collection
    best_rates = {
        "cashback": 0.0,
        "miles": 0.0,
        "points": 0.0
    }

    for c in user_cards:
        issuer = c.get("issuer")
        card_type = c.get("CardType")
        card_data = credit_cards_db.get(issuer, {}).get(card_type, {})
        rewards_structure = card_data.get("rewards_structure", {})
        redemption_info = card_data.get("redemption", {})

        # --- Check for "cashback"
        if "cashback" in rewards_structure:
            best_cat = get_best_category_for_merchant(
                merchant, 
                "cashback", 
                list(rewards_structure["cashback"].keys())
            )
            if best_cat not in rewards_structure["cashback"]:
                if "Everything else" in rewards_structure["cashback"]:
                    multiplier = rewards_structure["cashback"]["Everything else"]
                else:
                    multiplier = average_multiplier(rewards_structure["cashback"])
            else:
                multiplier = rewards_structure["cashback"][best_cat]
            effective_percent = multiplier * 100.0
            if effective_percent > best_rates["cashback"]:
                best_rates["cashback"] = effective_percent

        # --- Check for "miles"
        if "miles" in rewards_structure:
            if is_travel_merchant:
                best_cat = get_best_category_for_merchant(
                    merchant, 
                    "miles", 
                    list(rewards_structure["miles"].keys())
                )
                if best_cat not in rewards_structure["miles"]:
                    if "All other purchases" in rewards_structure["miles"]:
                        multiplier = rewards_structure["miles"]["All other purchases"]
                    else:
                        multiplier = average_multiplier(rewards_structure["miles"])
                else:
                    multiplier = rewards_structure["miles"][best_cat]
                miles_to_cash = redemption_info.get("miles_to_cash", 0.0)
                effective_percent = multiplier * miles_to_cash * 100.0
                if effective_percent > best_rates["miles"]:
                    best_rates["miles"] = effective_percent
            else:
                # If merchant isn't travel, miles is effectively 0
                pass

        # --- Check for "points"
        if "points" in rewards_structure:
            best_cat = get_best_category_for_merchant(
                merchant, 
                "points", 
                list(rewards_structure["points"].keys())
            )
            if best_cat not in rewards_structure["points"]:
                if "Everything else" in rewards_structure["points"]:
                    multiplier = rewards_structure["points"]["Everything else"]
                else:
                    multiplier = average_multiplier(rewards_structure["points"])
            else:
                multiplier = rewards_structure["points"][best_cat]
            points_to_cash = redemption_info.get("points_to_cash", 0.0)
            effective_percent = multiplier * points_to_cash * 100.0
            if effective_percent > best_rates["points"]:
                best_rates["points"] = effective_percent

    # Now we have something like best_rates = {"cashback": 5.0, "miles": 2.0, "points": 4.5}

    # 3) Build a short prompt for GPT with user-chosen type, best rates, and merchant name
    #    GPT will decide if chosen_type is indeed best or if something else is better.
    #    For example:
    #    "cashback: 5.0%  miles: 2.0%  points: 4.5%"

    rates_str = "\n".join([f"• {r_type}: {rate:.2f}%" for r_type, rate in best_rates.items()])
    # Example:
    #   cashback: 5.00%
    #   miles: 2.00%
    #   points: 4.50%

    prompt = f"""
You are an expert at deciding the best reward type among 'cashback', 'miles', or 'points'
for a merchant named '{merchant}' with a purchase amount of ${amount}.

Here are the user's best possible earn rates (as a percentage back) for each reward type:
{rates_str}

The user chose '{chosen_type}'.

- If that type yields the highest effective rate, say it's suitable.
- If another type is higher, suggest that type.
- If there's a tie, it's fine to consider the chosen type suitable if it's among the tied highest.

You MUST return valid JSON with EXACTLY these two fields:
1) "isSuitable": a boolean (true or false)
2) "suggestedRewardType": a string from ['cashback', 'miles', 'points'] only

Return no extra text—only JSON.
"""

    try:
        completion = get_ai_client().chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system", 
                    "content": (
                        "You are an objective financial AI. Respond ONLY with a strict JSON object."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=300
        )

        response_content = completion.choices[0].message.content.strip()

        try:
            gpt_result = json.loads(response_content)
        except json.JSONDecodeError:
            return jsonify({
                "error": "Invalid JSON response from GPT",
                "response": response_content
            }), 500

        # Validate GPT's result
        if "isSuitable" not in gpt_result or "suggestedRewardType" not in gpt_result:
            return jsonify({
                "error": "Missing required fields in GPT's response",
                "response": gpt_result
            }), 500

        # Clean up final output
        is_suitable = gpt_result["isSuitable"]
        suggested = gpt_result["suggestedRewardType"]
        if suggested not in ["cashback", "miles", "points"]:
            suggested = "cashback"  # fallback

        return jsonify({
            "isSuitable": bool(is_suitable),
            "suggestedRewardType": suggested
        }), 200

    except Exception as e:
        print(f"Failed to check reward type with GPT: {e}")
        return jsonify({"error": str(e)}), 500

# -----------------------------------------------------------
#   /api/analyze_dom
# -----------------------------------------------------------
@ai_bp.route('/api/analyze_dom', methods=['POST'])
def analyze_dom():
    """Analyze HTML DOM content with GPT to extract the merchant name."""
    try:
        data = request.json
        dom_content = data.get("html")
        if not dom_content:
            return jsonify({"error": "No DOM content provided"}), 400

        completion = get_ai_client().chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI model trained to extract key info from HTML content. "
                        "If the merchant name cannot be found, respond with JSON {\"merchant_name\":\"Unknown\"}."
                    )
                },
                {
                    "role": "user",
                    "content": f"Analyze the following HTML content:\n{dom_content}\nExtract the merchant name in JSON."
                }
            ],
            max_tokens=150
        )
        response_content = completion.choices[0].message.content.strip()
        try:
            extracted_data = json.loads(response_content)
            return jsonify(extracted_data)
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid response from GPT", "response": response_content}), 500

    except Exception as e:
        print(f"Unexpected error in analyze_dom: {e}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

# -----------------------------------------------------------
#   /api/analyze_rewards
# -----------------------------------------------------------
@ai_bp.route('/api/analyze_rewards', methods=['POST'])
@login_required
def analyze_rewards():
    """Use GPT to analyze the best reward type for a given transaction and user cards."""
    data = request.get_json(force=True) or {}
    merchant = data.get("merchant", "Unknown Merchant")
    user_selected_type = data.get("rewardType", "cashback")
    source = data.get("source", None)

    print(user_selected_type)

    raw_amount = data.get("amount", 0.0)
    try:
        amount = float(raw_amount)
    except (ValueError, TypeError):
        amount = 0.0

    # Get current date information for seasonal and quarterly benefits
    current_date = dt.datetime.now()
    current_quarter = f"Q{(current_date.month - 1) // 3 + 1} {current_date.year}"
    
    user_id = current_user.id
    user_cards = fetch_user_credit_cards(user_id)
    if not user_cards:
        return jsonify({
            "analysisResults": [],
            "explanation": "No credit cards available for analysis.",
            "recommendedCard": None,
            "recommendedRewardType": None
        }), 200

    # Build a reward table
    analysis_results, extra_benefits_info = [], []
    for card in user_cards:
        issuer = card.get("issuer")
        card_type = card.get("CardType")
        card_data = credit_cards_db.get(issuer, {}).get(card_type, {})
        rewards_structure = card_data.get("rewards_structure", {})
        redemption_info = card_data.get("redemption", {})
        quarterly_categories = card_data.get("quarterly_categories", {})

        row = {
            "cardName": f"{card_type}",
            "cashback": "N/A",
            "miles": "N/A",
            "points": "N/A"
        }

        # Check for active quarterly categories
        active_quarterly_categories = []
        for quarter_key, quarter_info in quarterly_categories.items():
            # Check if this quarter is active now
            if is_timeframe_active(quarter_info.get("Timeframe", ""), current_date):
                categories = quarter_info.get("Categories", [])
                if isinstance(categories, list):
                    active_quarterly_categories.extend(categories)
                elif isinstance(categories, str) and categories != "To be announced":
                    active_quarterly_categories.append(categories)

        # Evaluate 'cashback' with quarterly categories
        if "cashback" in rewards_structure:
            # Add quarterly categories to the list of potential categories if available
            all_categories = list(rewards_structure["cashback"].keys())
            
            # If there are active quarterly categories and the card supports them
            if active_quarterly_categories and "Quarterly bonus categories" in rewards_structure["cashback"]:
                # Let GPT decide if the merchant fits into any of the quarterly categories
                if active_quarterly_categories:
                    quarterly_match = check_if_merchant_matches_categories(merchant, active_quarterly_categories)
                    if quarterly_match:
                        multiplier = rewards_structure["cashback"]["Quarterly bonus categories"]
                        row["cashback"] = multiplier * 100
                        # Add note about quarterly category match
                        if "Current Quarterly Categories" not in row:
                            row["Current Quarterly Categories"] = ", ".join(active_quarterly_categories)
                        continue  # Skip the regular category matching
            
            # Regular category matching
            best_cat = get_best_category_for_merchant(merchant, "cashback", all_categories)
            if best_cat not in rewards_structure["cashback"]:
                if "Everything else" in rewards_structure["cashback"]:
                    multiplier = rewards_structure["cashback"]["Everything else"]
                else:
                    multiplier = average_multiplier(rewards_structure["cashback"])
            else:
                multiplier = rewards_structure["cashback"][best_cat]
            
            row["cashback"] = multiplier * 100

        # Evaluate 'miles'
        if "miles" in rewards_structure:
            best_cat = get_best_category_for_merchant(merchant, "miles", list(rewards_structure["miles"].keys()))
            if best_cat not in rewards_structure["miles"]:
                if "All other purchases" in rewards_structure["miles"]:
                    multiplier = rewards_structure["miles"]["All other purchases"]
                else:
                    multiplier = average_multiplier(rewards_structure["miles"])
            else:
                multiplier = rewards_structure["miles"][best_cat]

            miles_to_cash = redemption_info.get("miles_to_cash", 0.0)
            row["miles"] = multiplier * miles_to_cash * 100

        # Evaluate 'points'
        if "points" in rewards_structure:
            best_cat = get_best_category_for_merchant(merchant, "points", list(rewards_structure["points"].keys()))
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

        # Process additional benefits including active seasonal benefits
        seasonal = card_data.get("seasonal_benefits", {})
        additional = card_data.get("additional_benefits", {})
        db_socialized = card_data.get("socialized_benefits", {})

        # Filter seasonal benefits to only include active ones
        active_seasonal = {}
        for benefit_name, benefit_info in seasonal.items():
            if isinstance(benefit_info, dict) and "timeframe" in benefit_info:
                if is_timeframe_active(benefit_info["timeframe"], current_date):
                    active_seasonal[benefit_name] = benefit_info
        
        # Combine active seasonal benefits with other benefits
        all_extras = {**active_seasonal, **additional, **db_socialized}
        
        # Add quarterly category information if relevant
        if active_quarterly_categories:
            all_extras["Current Quarterly Categories"] = ", ".join(active_quarterly_categories)
            
        relevant_extras = []
        for label, detail in all_extras.items():
            benefit_str = detail if isinstance(detail, str) else json.dumps(detail)
            if is_benefit_relevant_to_merchant(benefit_str, merchant):
                relevant_extras.append(f"{label}: {benefit_str}")

        if relevant_extras:
            extra_benefits_info.append(f"{card_type}: " + "; ".join(relevant_extras))

    # Build GPT prompt
    prompt_lines = [
        f"Merchant: {merchant}, transaction amount: ${amount:.2f}",
        f"Your chosen reward type: {user_selected_type}",
        f"Current date: {current_date.strftime('%B %d, %Y')} (Q{(current_date.month - 1) // 3 + 1} {current_date.year})",
        "Here is the reward table (columns: cashback, miles, points are in %):"
    ]
    for row in analysis_results:
        prompt_lines.append(
            f"- {row['cardName']}: cashback={row['cashback']}, miles={row['miles']}, points={row['points']}"
        )
    if extra_benefits_info:
        prompt_lines.append("\nSome cards also have relevant extra benefits:")
        for line in extra_benefits_info:
            prompt_lines.append(f"- {line}")

    prompt_lines.append("""
Personalized Instructions:
1. Speak directly to the user ("you", "your").
2. Only recommend extra benefits (like subscriptions or bonus categories) if relevant to the merchant.
3. Focus on the user's chosen reward type, but if it's suboptimal, explain why and offer a better choice.
4. Reference the reward % and extra perks where appropriate.
5. If seasonal or quarterly benefits apply, highlight them specifically.
6. Return strictly JSON with keys: recommendedRewardType, recommendedCard, explanation.
""")

    final_prompt = "\n".join(prompt_lines)
    try:
        response = get_ai_client().chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful financial advisor. Answer ONLY in valid JSON."},
                {"role": "user", "content": final_prompt}
            ],
            max_tokens=500
        )
        gpt_content = response.choices[0].message.content.strip()
        gpt_json = json.loads(gpt_content)

        recommended_reward_type = gpt_json.get("recommendedRewardType", None)
        recommended_card = gpt_json.get("recommendedCard", None)
        explanation = gpt_json.get("explanation", "No explanation provided.")
        if source != "playground":
            log_recommendation(user_id, data, recommended_card)
    except Exception as e:
        print(f"ChatGPT error: {e}")
        recommended_reward_type = None
        recommended_card = None
        explanation = "Unable to generate AI-based analysis. Here's the rewards table."

    return jsonify({
        "analysisResults": analysis_results,
        "explanation": explanation,
        "recommendedCard": recommended_card,
        "recommendedRewardType": recommended_reward_type
    }), 200

# Helper function to check if a timeframe is currently active
def is_timeframe_active(timeframe_str, current_date):
    """Determine if a timeframe string is currently active."""
    try:
        # Handle common patterns like "Through March 2025", "January 1 – March 31, 2025"
        timeframe_lower = timeframe_str.lower()
        
        # Case 1: "Through [Month] [Year]" or "Until [Month] [Year]"
        if "through" in timeframe_lower or "until" in timeframe_lower:
            # Extract month and year
            parts = timeframe_lower.replace("through", "").replace("until", "").strip().split()
            if len(parts) >= 2:
                month_name = parts[0].capitalize()
                year = int(parts[-1])
                # Convert month name to number
                month_num = {"January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
                             "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12}.get(month_name, 12)
                
                end_date = dt.datetime(year, month_num, 28)  # Use 28th as a safe day
                return current_date <= end_date
        
        # Case 2: "January 1 – March 31, 2025" format
        elif "–" in timeframe_str or "-" in timeframe_str:
            delimiter = "–" if "–" in timeframe_str else "-"
            parts = timeframe_str.split(delimiter)
            if len(parts) == 2:
                start_part = parts[0].strip()
                end_part = parts[1].strip()
                
                # Parse end date which has the year
                end_parts = end_part.replace(",", "").split()
                if len(end_parts) >= 2:
                    end_month = {"January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
                                 "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12}.get(end_parts[0], 1)
                    end_day = int(''.join(filter(str.isdigit, end_parts[1])))
                    end_year = int(end_parts[-1])
                    
                    # Parse start date
                    start_parts = start_part.split()
                    start_month = {"January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
                                   "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12}.get(start_parts[0], 1)
                    start_day = int(''.join(filter(str.isdigit, start_parts[1])))
                    start_year = end_year  # Assume same year unless specified
                    
                    start_date = dt.datetime(start_year, start_month, start_day)
                    end_date = dt.datetime(end_year, end_month, end_day)
                    
                    return start_date <= current_date <= end_date
        
        # Case 3: "Activate by [Date]" - assume active if current date is before activation deadline
        elif "activate by" in timeframe_lower:
            parts = timeframe_lower.replace("activate by", "").strip().split()
            if len(parts) >= 2:
                month_name = parts[0].capitalize()
                day = int(''.join(filter(str.isdigit, parts[1])))
                year = int(parts[-1])
                
                month_num = {"January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
                             "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12}.get(month_name, 12)
                
                deadline = dt.datetime(year, month_num, day)
                return current_date <= deadline
    
    except Exception as e:
        print(f"Error parsing timeframe '{timeframe_str}': {e}")
    
    # Default to not active if we can't parse the timeframe
    return False

# Use GPT to check if a merchant matches any of the active quarterly categories
def check_if_merchant_matches_categories(merchant, categories):
    """Use GPT to determine if a merchant fits into any of the provided categories."""
    categories_str = ", ".join(categories)
    prompt = f"""
You are an expert in categorizing merchants.
Merchant name: "{merchant}"
Potential categories: {categories_str}

Does this merchant belong to any of these categories? Consider typical purchases at this merchant.
Return strictly JSON: {{"matches": true}} or {{"matches": false}}. No explanation needed.
"""
    try:
        resp = get_ai_client().chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You answer strictly in JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=50
        )
        content = resp.choices[0].message.content.strip()
        result = json.loads(content)
        return result.get("matches", False)
    except Exception as e:
        print(f"Error checking if merchant matches categories: {e}")
        return False

# -----------------------------------------------------------
#   /api/get_card_advice
# -----------------------------------------------------------
@ai_bp.route('/api/get_card_advice', methods=['POST'])
def card_advice():
    """Use GPT to recommend the best card for a given transaction."""
    if not current_user.is_authenticated:
        return jsonify({"error": "User not authenticated"}), 401

    data = request.json
    user_id = current_user.id
    card_recommendation = get_best_card(data, user_id)
    return jsonify({"recommended_card": card_recommendation})

# -----------------------------------------------------------
#   Helper: Logging and AI Utilities
# -----------------------------------------------------------
def log_recommendation(user_id, transaction_details, recommended_card):
    """Record the AI's recommendation in the DB."""
    new_record = RecommendationHistory(
        user_id=user_id,
        date=dt.datetime.utcnow(),
        amount=transaction_details.get('amount'),
        recommended_card=recommended_card
    )
    db.session.add(new_record)
    db.session.commit()

def is_benefit_relevant_to_merchant(benefit_description, merchant_name):
    """Ask GPT if a given benefit is relevant to a given merchant."""
    prompt = f"""
You're an expert in matching credit card benefits to merchants.
Given the benefit description: \"{benefit_description}\"
and the merchant name \"{merchant_name}\",
is this benefit relevant to the merchant?
Return JSON: {{"relevant": true}} or {{"relevant": false}} only.
"""
    try:
        resp = get_ai_client().chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You answer strictly in JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100
        )
        content = resp.choices[0].message.content.strip()
        return json.loads(content).get("relevant", False)
    except Exception as e:
        print(f"is_benefit_relevant_to_merchant error: {e}")
        return False

def get_best_card(transaction_details, user_id):
    """Find the best card for a transaction (cashback-focused)."""
    from app.routes.card_routes import fetch_user_credit_cards
    cards = fetch_user_credit_cards(user_id)
    if not cards:
        return "No credit cards available."

    source = transaction_details.get("source", None)
    merchant = transaction_details.get('merchant', 'Unknown Merchant')
    amount = transaction_details.get('amount', 0.0)

    # Build string describing user's cards
    cards_details = "Here are the cards and their cashback benefits: " + ", ".join(
        [f"{c.get('CardType', 'Unknown')}, benefits: ???" for c in cards]
    )

    ai_prompt = (
        f"Determine the best credit card for a purchase at {merchant} "
        f"amounting to ${amount}. Consider only cashback benefits. "
        f"Return the most suitable card strictly by name, exactly as listed below: {cards_details}."
    )

    try:
        completion = get_ai_client().chat.completions.create(
            model="gpt-4o-mini",  # Example model name
            messages=[
                {"role": "system", "content": cards_details},
                {"role": "user", "content": ai_prompt}
            ],
            max_tokens=500
        )
        result = completion.choices[0].message.content.strip()
        if source != "playground":
            log_recommendation(user_id, transaction_details, result)
        return result
    except Exception as e:
        print(f"Failed to get recommendation: {e}")
        return "Error processing your request."

def get_best_category_for_merchant(merchant: str, reward_type: str, categories: list) -> str:
    """Use GPT to identify the best category for a given merchant."""
    if not categories:
        return "Everything else"
    prompt = f"""
You are an expert in matching merchants to credit card reward categories.
Given the merchant "{merchant}", the reward type "{reward_type}",
and these possible categories {categories}, which single category best fits?
Return strictly JSON like {{"category":"Dining"}}. If nothing fits, {{"category":"Everything else"}}.
"""
    try:
        resp = get_ai_client().chat.completions.create(
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
    """Compute average of a dict's numeric values."""
    if not mdict:
        return 0.0
    vals = list(mdict.values())
    return sum(vals) / len(vals)
