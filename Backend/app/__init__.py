from flask import Flask
from flask_migrate import Migrate
from sqlalchemy import inspect
from flask_cors import CORS
from .models import User
from .extensions import db, login_manager
from dotenv import load_dotenv
import openai
import os

# Load environment variables
load_dotenv()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def setup_openai():
    openai.api_key = os.getenv('OPENAI_API_KEY')

def create_app():
    app = Flask(__name__, static_folder='static')
    
    # Production-ready configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback_secret_key')
    
    # Use environment variable for database URL, with SQLite as fallback
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL', 
        'sqlite:///production.db'
    )
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # CORS configuration for production
    CORS(app, resources={
        r"/*": {
            "origins": [
                "https://your-frontend-domain.com",
                "http://localhost:3000"  # For local development
            ]
        }
    }, supports_credentials=True)

    # Session and security configurations
    app.config['SESSION_PERMANENT'] = False
    app.config['SESSION_USE_SIGNER'] = True
    app.config['SESSION_COOKIE_SECURE'] = True  # Do not set this to True unless you're using HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['REMEMBER_COOKIE_SAMESITE'] = 'None'
    # Initialize extensions
    db.init_app(app)
    Migrate(app, db)
    login_manager.init_app(app)
    login_manager.login_view = 'main.login'

    # Setup services
    setup_openai()

    # Register routes
    from .routes import main as main_routes
    app.register_blueprint(main_routes, url_prefix='/')

    # Create database tables
    with app.app_context():
        db.create_all()
        inspector = inspect(db.engine)
        print(inspector.get_table_names())

    return app