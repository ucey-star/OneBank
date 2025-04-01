# app/routes/__init__.py
from flask import Blueprint

from .auth_routes import auth_bp
from .card_routes import card_bp
from .ai_routes import ai_bp
from .user_routes import user_bp
from .misc_routes import misc_bp
from dotenv import load_dotenv
import os

basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
load_dotenv(os.path.join(basedir, '.env'))

def register_blueprints(app):

    app.register_blueprint(auth_bp, url_prefix='/')
    app.register_blueprint(card_bp, url_prefix='/')
    app.register_blueprint(ai_bp,   url_prefix='/')
    app.register_blueprint(user_bp, url_prefix='/')
    app.register_blueprint(misc_bp, url_prefix='/')
