from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    # Import and register the 'inventory' Blueprint
    from .routes import bp as inventory_bp
    app.register_blueprint(inventory_bp, url_prefix='/inventory')

    return app
