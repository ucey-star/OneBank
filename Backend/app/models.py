from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from flask_login import UserMixin
from .extensions import db

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    plaid_access_token = db.Column(db.String(200))  # Store Plaid access token
    # Relationships
    accounts = db.relationship('Account', backref='owner', lazy='dynamic')
    credit_cards = db.relationship('CreditCard', backref='owner', lazy='dynamic')


    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return '<User {}>'.format(self.email)

class CreditCard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    card_number = db.Column(db.String(20), unique=True, nullable=False)
    card_holder_name = db.Column(db.String(100), nullable=False)
    expiry_date = db.Column(db.String(10), nullable=False)  # Format: MM/YY
    cvv = db.Column(db.String(4), nullable=False)
    issuer = db.Column(db.String(50), nullable=False)  # e.g., Visa, MasterCard, Amex
    card_type = db.Column(db.String(50), nullable=False)  # e.g., Debit, Credit, Prepaid
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def __repr__(self):
        return f'<CreditCard {self.card_number} ({self.issuer} - {self.card_type})>'
