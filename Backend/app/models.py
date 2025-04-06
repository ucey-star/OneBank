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
    password_hash = db.Column(db.String(1024))
    default_reward_type = db.Column(db.String(20), default="cashback")
     # Add a new column for storing a profile picture URL or file path
    profile_pic = db.Column(db.LargeBinary, nullable=True)
    # Relationships
    credit_cards = db.relationship('CreditCard', backref='owner', lazy='dynamic')


    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return '<User {}>'.format(self.email)

class CreditCard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # Set these to nullable=True so they can be omitted when adding a card.
    card_number = db.Column(db.String(20), unique=True, nullable=True) 
    card_holder_name = db.Column(db.String(100), nullable=False) 
    expiry_date = db.Column(db.String(10), nullable=True)  # Format: MM/YY
    cvv = db.Column(db.String(4), nullable=True) 
    issuer = db.Column(db.String(50), nullable=False)  # e.g., Visa, MasterCard, Amex
    card_type = db.Column(db.String(100), nullable=False)  # e.g., Debit, Credit, Prepaid
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    socialized_benefits = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<CreditCard {self.card_holder_name} ({self.issuer} - {self.card_type})>'

class RecommendationHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    recommended_card = db.Column(db.String(255), nullable=False)

    user = db.relationship('User', backref=db.backref('recommendation_history', lazy=True))

    def __repr__(self):
        return f"<RecommendationHistory {self.date} - {self.recommended_card}>"
