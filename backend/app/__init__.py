import os
import joblib
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

def create_app():
    """Application Factory Function"""
    load_dotenv()
    app = Flask(__name__)
    CORS(app)

    # --- Load Models and other shared resources ---
    # This is the new home for your model loading logic.
    # We attach them to the 'app' object to make them accessible via 'current_app'.
    try:
        model_package = joblib.load('churn_model.pkl')
        app.churn_model_package = model_package
        print("Success: New Random Forest model package loaded.")
    except FileNotFoundError:
        print("Error: 'churn_model.pkl' not found. Please run the train_model.py script first.")
        exit()

    try:
        sales_forecaster = joblib.load('sales_forecaster.pkl')
        app.sales_forecaster = sales_forecaster
        print("Success: SARIMAX (Sales) model loaded.")
    except FileNotFoundError:
        print("Warning: 'sales_forecaster.pkl' not found. Sales forecasting will not work.")
        app.sales_forecaster = None

    # --- Register Blueprints ---
    with app.app_context():
        from .routes import churn_routes, sales_routes, utility_routes

        app.register_blueprint(churn_routes.churn_bp, url_prefix='/api')
        app.register_blueprint(sales_routes.sales_bp, url_prefix='/api')
        app.register_blueprint(utility_routes.utility_bp, url_prefix='/api')

    return app