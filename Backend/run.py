from app import create_app, load_user
from app.extensions import login_manager
import os
from dotenv import load_dotenv

# Load environment variables
basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
load_dotenv(os.path.join(basedir, '.env'))

# Create the app
app = create_app()
login_manager.user_loader(load_user)

# Adjust run configuration for production
if __name__ == "__main__":
    # Use environment variable to determine debug mode
    debug_mode = os.getenv('FLASK_DEBUG', 'False') == 'True'
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=debug_mode)