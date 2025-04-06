# app/routes/auth_routes.py
from flask import Blueprint, request, jsonify, redirect, url_for, session
from flask_login import login_user, logout_user, login_required, current_user
from urllib.parse import urlencode
import os
import re

from app.extensions import db, oauth
from app.models import User

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/status")
def check_status():
    """Check if the current user is authenticated."""
    print("user is authenticated:", current_user.is_authenticated)

    if current_user.is_authenticated:
        return jsonify({
            "isLoggedIn": True,
            "firstName": current_user.first_name
        })
    else:
        return jsonify({
            "isLoggedIn": False,
            "firstName": None
        })

def is_strong_password(password):
    # Match: at least 8 chars, one lowercase, one uppercase, one number, one special char
    return bool(re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$', password))

@auth_bp.route("/signup", methods=["POST"])
def signup():
    """Register a new user."""
    data = request.get_json()
    email = data.get("email")
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    password = data.get("password")

    if not is_strong_password(password):
        return jsonify({"error": "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    new_user = User(email=email, first_name=first_name, last_name=last_name)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    login_user(new_user, remember=True)
    return jsonify({
        "message": "Signup successful",
        "user": {
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
        }
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    """Log in an existing user."""
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        login_user(user, remember=True)
        return jsonify({
            "message": "Login successful",
            "user": {
                "email": email,
                "first_name": user.first_name,
                "default_reward_type": user.default_reward_type
            }
        }), 200

    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route("/login/google")
def google_login():
    """Initiate Google OAuth login."""
    nonce = os.urandom(24).hex()
    session['nonce'] = nonce

    # Detect the client type
    if request.args.get("ext") == "1":
        session['from_extension'] = True
        session['from_react'] = False
    elif request.args.get("react") == "1":
        session['from_extension'] = False
        session['from_react'] = True
    else:
        session['from_extension'] = False
        session['from_react'] = False

    redirect_uri = url_for('auth_bp.google_auth', _external=True)
    return oauth.google.authorize_redirect(redirect_uri, nonce=nonce)

@auth_bp.route("/auth/google")
def google_auth():
    """Google OAuth callback."""
    token = oauth.google.authorize_access_token()
    nonce = session.get('nonce')
    user_info = oauth.google.parse_id_token(token=token, nonce=nonce)

    email = user_info.get('email')
    first_name = user_info.get('given_name')
    last_name = user_info.get('family_name')

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, first_name=first_name, last_name=last_name)
        db.session.add(user)
        db.session.commit()

    login_user(user, remember=True)

    if session.get('from_extension'):
        params = {
            "success": "true",
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "message": "Google login successful",
            "default_reward_type": user.default_reward_type
        }
        ext_redirect = (
            "https://cdhglamelhenopjpflmgljbemggcabjh.chromiumapp.org/?"
            + urlencode(params)
        )
        return redirect(ext_redirect)

    elif session.get('from_react'):
        # Return an HTML page that is hidden from view, posts the result, then closes.
        return f"""
        <html>
          <head><style>body {{ display: none; }}</style></head>
          <body>
            <script>
              window.opener.postMessage({{
                success: true,
                user: {{
                  email: "{email}",
                  first_name: "{first_name}",
                  last_name: "{last_name}"
                }},
                message: "Google login successful"
              }}, "*");
              window.close();
            </script>
          </body>
        </html>
        """

    else:
        # Default: return JSON (for non-popup clients)
        return jsonify({
            "success": True,
            "user": {
                "email": email,
                "first_name": first_name,
                "last_name": last_name
            },
            "message": "Google login successful"
        }), 200

@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    """Log out the current user."""
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200
