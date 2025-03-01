from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from .extensions import db
from .models import User, PlaidAccessToken, CreditCard
import base64
import os
import datetime as dt
import json
import time
from datetime import date, timedelta

import plaid
from openai import OpenAI

ai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
from plaid.model.payment_amount import PaymentAmount
from plaid.model.payment_amount_currency import PaymentAmountCurrency
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.recipient_bacs_nullable import RecipientBACSNullable
from plaid.model.payment_initiation_address import PaymentInitiationAddress
from plaid.model.payment_initiation_recipient_create_request import (
    PaymentInitiationRecipientCreateRequest,
)
from plaid.model.payment_initiation_payment_create_request import (
    PaymentInitiationPaymentCreateRequest,
)
from plaid.model.payment_initiation_payment_get_request import (
    PaymentInitiationPaymentGetRequest,
)
from plaid.model.link_token_create_request_payment_initiation import (
    LinkTokenCreateRequestPaymentInitiation,
)
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.asset_report_create_request import AssetReportCreateRequest
from plaid.model.asset_report_create_request_options import (
    AssetReportCreateRequestOptions,
)
from plaid.model.asset_report_user import AssetReportUser
from plaid.model.asset_report_get_request import AssetReportGetRequest
from plaid.model.asset_report_pdf_get_request import AssetReportPDFGetRequest
from plaid.model.auth_get_request import AuthGetRequest
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.identity_get_request import IdentityGetRequest
from plaid.model.investments_transactions_get_request_options import (
    InvestmentsTransactionsGetRequestOptions,
)
from plaid.model.investments_transactions_get_request import (
    InvestmentsTransactionsGetRequest,
)
from plaid.model.accounts_balance_get_request import AccountsBalanceGetRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.investments_holdings_get_request import InvestmentsHoldingsGetRequest
from plaid.model.item_get_request import ItemGetRequest
from plaid.model.institutions_get_by_id_request import InstitutionsGetByIdRequest
from plaid.model.transfer_authorization_create_request import (
    TransferAuthorizationCreateRequest,
)
from plaid.model.transfer_create_request import TransferCreateRequest
from plaid.model.transfer_get_request import TransferGetRequest
from plaid.model.transfer_network import TransferNetwork
from plaid.model.transfer_type import TransferType
from plaid.model.transfer_authorization_user_in_request import (
    TransferAuthorizationUserInRequest,
)
from plaid.model.ach_class import ACHClass
from plaid.model.transfer_create_idempotency_key import TransferCreateIdempotencyKey
from plaid.model.transfer_user_address_in_request import TransferUserAddressInRequest
from plaid.model.signal_evaluate_request import SignalEvaluateRequest
from plaid.model.statements_list_request import StatementsListRequest
from plaid.model.link_token_create_request_statements import (
    LinkTokenCreateRequestStatements,
)
from plaid.model.statements_download_request import StatementsDownloadRequest
from plaid.api import plaid_api

load_dotenv()


PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET")
PLAID_ENV = os.getenv("PLAID_ENV", "sandbox")
PLAID_PRODUCTS = os.getenv("PLAID_PRODUCTS", "transactions").split(",")
PLAID_COUNTRY_CODES = os.getenv("PLAID_COUNTRY_CODES", "US").split(",")


def empty_to_none(field):
    value = os.getenv(field)
    if value is None or len(value) == 0:
        return None
    return value


host = plaid.Environment.Sandbox

if PLAID_ENV == "sandbox":
    host = plaid.Environment.Sandbox

if PLAID_ENV == "production":
    host = plaid.Environment.Production

# Parameters used for the OAuth redirect Link flow.
#
# Set PLAID_REDIRECT_URI to 'http://localhost:3000/'
# The OAuth redirect flow requires an endpoint on the developer's website
# that the bank website should redirect to. You will need to configure
# this redirect URI for your client ID through the Plaid developer dashboard
# at https://dashboard.plaid.com/team/api.
PLAID_REDIRECT_URI = empty_to_none("PLAID_REDIRECT_URI")

configuration = plaid.Configuration(
    host=host,
    api_key={
        "clientId": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "plaidVersion": "2020-09-14",
    },
)

api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

products = []
for product in PLAID_PRODUCTS:
    products.append(Products(product))


# We store the access_token in memory - in production, store it in a secure
# persistent data store.
access_token = None
# The payment_id is only relevant for the UK Payment Initiation product.
# We store the payment_id in memory - in production, store it in a secure
# persistent data store.
payment_id = None
# The transfer_id is only relevant for Transfer ACH product.
# We store the transfer_id in memory - in production, store it in a secure
# persistent data store.
transfer_id = None

item_id = None

main = Blueprint("main", __name__)


@main.route("/status")
def check_status():
    print(current_user.is_authenticated)
    if current_user.is_authenticated:
        return jsonify(isLoggedIn=True)
    else:
        return jsonify(isLoggedIn=False)


# Register a new user
@main.route("/signup", methods=["POST"])
def signup():
    print("Signup route")
    data = request.get_json()
    email = data.get("email")
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    password = data.get("password")

    print(data)

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

@main.route('/api/get_credit_cards', methods=['GET'])
@login_required
def get_credit_cards():
    credit_cards = CreditCard.query.filter_by(user_id=current_user.id).all()
    card_list = [{
        'cardNumber': card.card_number,
        'cardHolderName': card.card_holder_name,
        'expiryDate': card.expiry_date,
        'cvv': card.cvv,
        'benefits': card.benefits
    } for card in credit_cards]

    return jsonify({'cards': card_list}), 200


@main.route('/api/add-credit-card', methods=["POST"])
@login_required
def add_credit_card():
    print("Is authenticated?", current_user.is_authenticated)
    if not current_user.is_authenticated:
        return jsonify({'error': 'User not authenticated'}), 401
    if not request.json:
        return jsonify({'error': 'Request must be JSON'}), 400

    card_number = request.json.get('cardNumber')
    card_holder_name = request.json.get('cardHolderName')
    expiry_date = request.json.get('expiryDate')
    cvv = request.json.get('cvv')
    benefits = request.json.get('benefits')

    if not all([card_number, card_holder_name, expiry_date, cvv]):
        return jsonify({'error': 'Missing required credit card details'}), 400

    # Check if card already exists to avoid duplicates
    existing_card = CreditCard.query.filter_by(card_number=card_number,
                                               user_id=current_user.id).first()
    if existing_card:
        return jsonify({'error': 'Credit card already registered'}), 409

    # Create a new CreditCard instance
    new_card = CreditCard(
        card_number=card_number,
        card_holder_name=card_holder_name,
        expiry_date=expiry_date,
        cvv=cvv,
        benefits=benefits,
        user_id=current_user.id  # Link the card to the logged-in user
    )

    db.session.add(new_card)
    db.session.commit()

    # Return success message
    return jsonify({
        'message': 'Credit card added successfully',
        'card': {
            'cardNumber': card_number,
            'cardHolderName': card_holder_name,
            'expiryDate': expiry_date,
            'cvv': cvv,
            'benefits': benefits
        }
    }), 201

def fetch_user_credit_cards(user_id):
    try:
        credit_cards = CreditCard.query.filter_by(user_id=user_id).all()
        return [{
            'name': card.card_holder_name,
            'number': card.card_number,
            'cvv': card.cvv,
            'benefits': card.benefits
        } for card in credit_cards]
    except Exception as e:
        print(f"Error fetching credit cards: {e}")
        return []

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
            print(f"Response from GPT: {response_content}")
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



def get_best_card(transaction_details, user_id):

    # Fetch user-specific credit card data
    credit_cards = fetch_user_credit_cards(user_id)  # Implement this function to fetch data from your database
    if not credit_cards:
        return "No credit cards available."
    
    # Construct the system message with user's credit card details
    cards_details = "Here are the cards and their benefits: " + ", ".join(
        [f"{card['name']}, {card['number']}  with benefits {card['benefits']}" for card in credit_cards]
    )

    try:
        completion = ai_client.chat.completions.create(
            model="gpt-4o-mini",  # Adjust model as needed for your use case
            messages=[
                {"role": "system", "content": cards_details},
                {"role": "user", "content": f"Identify the best credit card to use for a {transaction_details['category']} purchase of ${transaction_details['amount']}. Return only the card number and name and nothing else (very strict about this), if there are more than one than fit the transaction, pick one and return."}
            ],
            max_tokens=100  # You might need more tokens to handle the complexity
        )
        return completion.choices[0].message.content  # Adjust based on the actual response structure
    except Exception as e:
        print(f"Failed to get recommendation: {e}")
        return None
    
@main.route('api/get_card_advice', methods=['POST'])
def card_advice():
    if not current_user.is_authenticated:
        return jsonify({"error": "User not authenticated"}), 401
    
    data = request.json
    print(data)
    user_id = current_user.id
    card_recommendation = get_best_card(data, user_id)  # Replace "transaction_details" with the actual transaction details
    print(card_recommendation)
    return jsonify({"recommended_card": card_recommendation})

def pretty_print_response(response):
    print(json.dumps(response, indent=2, sort_keys=True, default=str))


def format_error(e):
    response = json.loads(e.body)
    return {'error': {'status_code': e.status, 'display_message':
                      response.error_message, 'error_code': response.error_code, 'error_type': response.error_type}}


# PLaid API routes


@main.route("/api/info", methods=["POST"])
def info():
    global access_token
    global item_id
    return jsonify(
        {"item_id": item_id, "access_token": access_token, "products": PLAID_PRODUCTS}
    )

@main.route('/api/create_link_token', methods=['POST'])
def create_link_token():
    try:
        request = LinkTokenCreateRequest(
            products=products,
            client_name="Plaid Quickstart",
            country_codes=list(map(lambda x: CountryCode(x), PLAID_COUNTRY_CODES)),
            language='en',
            user=LinkTokenCreateRequestUser(
                client_user_id=str(time.time())
            )
        )
        print("request", request)
        if PLAID_REDIRECT_URI is not None:
            request['redirect_uri'] = PLAID_REDIRECT_URI
        if Products('statements') in products:
            statements = LinkTokenCreateRequestStatements(
                end_date=date.today(),
                start_date=date.today()-timedelta(days=30)
            )
            request['statements']=statements

    # create link token
        response = client.link_token_create(request)
        print("response", response)
        return jsonify(response.to_dict())
    except plaid.ApiException as e:
        print(e)
        return json.loads(e.body)


@main.route("/api/create_link_token_for_payment", methods=["POST"])
def create_link_token_for_payment():
    global payment_id
    try:
        request = PaymentInitiationRecipientCreateRequest(
            name="John Doe",
            bacs=RecipientBACSNullable(account="26207729", sort_code="560029"),
            address=PaymentInitiationAddress(
                street=["street name 999"],
                city="city",
                postal_code="99999",
                country="GB",
            ),
        )
        response = client.payment_initiation_recipient_create(request)
        recipient_id = response.recipient_id

        request = PaymentInitiationPaymentCreateRequest(
            recipient_id=recipient_id,
            reference="TestPayment",
            amount=PaymentAmount(PaymentAmountCurrency("GBP"), value=100.00),
        )
        response = client.payment_initiation_payment_create(request)
        pretty_print_response(response.to_dict())

        # We store the payment_id in memory for demo purposes - in production, store it in a secure
        # persistent data store along with the Payment metadata, such as userId.
        payment_id = response.payment_id

        linkRequest = LinkTokenCreateRequest(
            # The 'payment_initiation' product has to be the only element in the 'products' list.
            products=[Products("payment_initiation")],
            client_name="Plaid Test",
            # Institutions from all listed countries will be shown.
            country_codes=list(map(lambda x: CountryCode(x), PLAID_COUNTRY_CODES)),
            language="en",
            user=LinkTokenCreateRequestUser(
                # This should correspond to a unique id for the current user.
                # Typically, this will be a user ID number from your application.
                # Personally identifiable information, such as an email address or phone number, should not be used here.
                client_user_id=str(time.time())
            ),
            payment_initiation=LinkTokenCreateRequestPaymentInitiation(
                payment_id=payment_id
            ),
        )

        if PLAID_REDIRECT_URI is not None:
            linkRequest["redirect_uri"] = PLAID_REDIRECT_URI
        linkResponse = client.link_token_create(linkRequest)
        pretty_print_response(linkResponse.to_dict())
        return jsonify(linkResponse.to_dict())
    except plaid.ApiException as e:
        return json.loads(e.body)

@main.route('/api/set_access_token', methods=['POST'])
def get_access_token():
    if not current_user.is_authenticated:
        return jsonify({'error': 'User not authenticated'}), 401

    data = request.get_json()
    public_token = data.get('public_token')
    if not public_token:
        return jsonify({'error': 'Public token is required'}), 400

    try:
        exchange_request = ItemPublicTokenExchangeRequest(public_token=public_token)
        exchange_response = client.item_public_token_exchange(exchange_request)
        access_token = exchange_response['access_token']
        item_id = exchange_response['item_id']

        # Save or update the access token in the database
        existing_token = PlaidAccessToken.query.filter_by(user_id=current_user.id).first()
        if existing_token:
            existing_token.access_token = access_token
            existing_token.item_id = item_id
        else:
            new_token = PlaidAccessToken(access_token=access_token, item_id=item_id, user_id=current_user.id)
            db.session.add(new_token)
        db.session.commit()
        return jsonify({'access_token': access_token, 'item_id': item_id}), 200
    except plaid.ApiException as e:
        return jsonify(format_error(e)), 400


@main.route('/api/check_access_tokens', methods=['GET'])
def check_access_tokens():
    print(current_user)
    if current_user.is_authenticated:
        access_tokens = PlaidAccessToken.query.filter_by(user_id=current_user.id).all()
    else:
        # Handle the case where there is no user logged in
        access_tokens = []
    if access_tokens:
        tokens_info = [{'access_token': token.access_token, 'item_id': token.item_id} for token in access_tokens]
        return jsonify(tokens_info), 200
    else:
        return jsonify({'message': 'No access tokens found for the user.'}), 404


# Data retrieval routes

# Retrieve Transactions for an Item
# https://plaid.com/docs/#transactions


@main.route('/api/transactions', methods=['GET'])
def get_transactions():
    # Set cursor to empty to receive all historical updates
    cursor = ''

    # New transaction updates since "cursor"
    added = []
    modified = []
    removed = [] # Removed transaction ids
    has_more = True
    try:
        # Iterate through each page of new transaction updates for item
        while has_more:
            request = TransactionsSyncRequest(
                access_token=access_token,
                cursor=cursor,
            )
            response = client.transactions_sync(request).to_dict()
            # Add this page of results
            added.extend(response.added)
            modified.extend(response.modified)
            removed.extend(response.removed)
            has_more = response.has_more
            # Update cursor to the next cursor
            cursor = response.next_cursor
            pretty_print_response(response)

        # Return the 8 most recent transactions
        latest_transactions = sorted(added, key=lambda t: t['date'])[-8:]
        return jsonify({
            'latest_transactions': latest_transactions})

    except plaid.ApiException as e:
        error_response = format_error(e)
        return jsonify(error_response)

# Retrieve Identity data for an Item
# https://plaid.com/docs/#identity


@main.route('/api/identity', methods=['GET'])
def get_identity():
    try:
        request = IdentityGetRequest(
            access_token=access_token
        )
        response = client.identity_get(request)
        pretty_print_response(response.to_dict())
        return jsonify(
            {'error': None, 'identity': response.to_dict().accounts})
    except plaid.ApiException as e:
        error_response = format_error(e)
        return jsonify(error_response)


# Retrieve real-time balance data for each of an Item's accounts
# https://plaid.com/docs/#balance


@main.route('/api/balance', methods=['GET'])
def get_balance():
    access_token_entry = PlaidAccessToken.query.filter_by(user_id=current_user.id).first()
    if not access_token_entry or not access_token_entry.access_token:
        return jsonify({'error': 'Access token not found.'}), 404

    try:
        balance_request = AccountsBalanceGetRequest(
            access_token=access_token_entry.access_token
        )
        response = client.accounts_balance_get(balance_request)
        return jsonify(response.to_dict())
    except plaid.ApiException as e:
        error_response = format_error(e)
        return jsonify(error_response), e.status

# Retrieve an Item's accounts
# https://plaid.com/docs/#accounts


@main.route('/api/accounts', methods=['GET'])
def get_accounts():
    access_token_entry = PlaidAccessToken.query.filter_by(user_id=current_user.id).first()
    if not access_token_entry or not access_token_entry.access_token:
        return jsonify({'error': 'Access token not found.'}), 404

    try:
        account_request = AccountsGetRequest(
            access_token=access_token_entry.access_token
        )
        response = client.accounts_get(account_request)
        return jsonify(response.to_dict())
    except plaid.ApiException as e:
        error_response = format_error(e)
        return jsonify(error_response), e.status

# Retrieve high-level information about an Item
# https://plaid.com/docs/#retrieve-item


@main.route('/api/item', methods=['GET'])
def item():
    try:
        request = ItemGetRequest(access_token=access_token)
        response = client.item_get(request)
        request = InstitutionsGetByIdRequest(
            institution_id=response.item.institution_id,
            country_codes=list(map(lambda x: CountryCode(x), PLAID_COUNTRY_CODES))
        )
        institution_response = client.institutions_get_by_id(request)
        pretty_print_response(response.to_dict())
        pretty_print_response(institution_response.to_dict())
        return jsonify({'error': None, 'item': response.to_dict().item, 'institution': institution_response.to_dict()['institution']})
    except plaid.ApiException as e:
        error_response = format_error(e)
        return jsonify(error_response)


@main.route('/api/statements', methods=['GET'])
def statements():
    try:
        request = StatementsListRequest(access_token=access_token)
        response = client.statements_list(request)
        pretty_print_response(response.to_dict())
    except plaid.ApiException as e:
        error_response = format_error(e)
        return jsonify(error_response)
    try:
        request = StatementsDownloadRequest(
            access_token=access_token,
            statement_id=response.accounts[0].statements[0].statement_id
        )
        pdf = client.statements_download(request)
        return jsonify({
            'error': None,
            'json': response.to_dict(),
            'pdf': base64.b64encode(pdf.read()).decode('utf-8'),
        })
    except plaid.ApiException as e:
        error_response = format_error(e)
        return jsonify(error_response)

# Ensure to import these functions in your main application where you initialize your Flask app
