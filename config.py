class Config:
    SECRET_KEY = 'your_very_secret_key'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///workshop_inventory.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = 'static/img/item_images'  # Ensure this directory exists in your project
