# app/routes/misc_routes.py
from flask import Blueprint, send_from_directory, jsonify
import os

misc_bp = Blueprint("misc_bp", __name__)

@misc_bp.route('/download-extension')
def download_extension():
    """Serve the extension ZIP file from the static folder."""
    static_folder = os.path.join(os.getcwd(), 'static')
    return send_from_directory(static_folder, 'extension.zip', as_attachment=True)
