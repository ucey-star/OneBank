from app import create_app, load_user
from app.extensions import login_manager

app = create_app()
login_manager.user_loader(load_user)

if __name__ == "__main__":
    app.run(debug=True)
