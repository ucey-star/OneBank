from flask import Flask
from flask_migrate import Migrate
from sqlalchemy import inspect
from flask_cors import CORS  # Import CORS
from .models import User
from .extensions import db, login_manager
from dotenv import load_dotenv
from plaid import Environment
from plaid.api import plaid_api  # This is crucial if you're using components like PlaidApi
import plaid 
import openai
import os

load_dotenv()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def setup_openai():
    openai.api_key = os.getenv('OPENAI_API_KEY')

def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True)  # Enable CORS globally

    # Application Configuration
    app.config['SECRET_KEY'] = 'your_hardcoded_secret_key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///yourdatabase.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SESSION_PERMANENT'] = False
    app.config['SESSION_USE_SIGNER'] = True
    app.config['SESSION_COOKIE_SECURE'] = True  # Do not set this to True unless you're using HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['REMEMBER_COOKIE_SAMESITE'] = 'None'

    db.init_app(app)
    Migrate(app, db)
    login_manager.init_app(app)
    login_manager.login_view = 'login'
    setup_openai()

    # Plaid Configuration
    PLAID_CLIENT_ID = os.getenv('PLAID_CLIENT_ID')
    PLAID_SECRET = os.getenv('PLAID_SECRET')
    PLAID_ENV = os.getenv('PLAID_ENV', 'sandbox')
    configuration = plaid.Configuration(
        host=Environment.Sandbox if PLAID_ENV == 'sandbox' else Environment.Production,
        api_key={
            'clientId': PLAID_CLIENT_ID,
            'secret': PLAID_SECRET,
            'plaidVersion': '2020-09-14'
        }
    )
    api_client = plaid.ApiClient(configuration)
    plaid_client = plaid_api.PlaidApi(api_client)



    from .routes import main as main_routes
    app.register_blueprint(main_routes, url_prefix='/')

    with app.app_context():
        db.create_all()
        inspector = inspect(db.engine)
        print(inspector.get_table_names())

    return app
