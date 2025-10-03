from flask import Blueprint, jsonify, request
import pandas as pd
import psycopg2
from data_importer import insert_data_from_df
import os

utility_bp = Blueprint('utility_bp', __name__)

DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")
DB_HOST = os.getenv("DB_HOST")


@utility_bp.route('/upload_data', methods=['POST'])
def upload_data():
    """Receives an Excel file and uses the importer to add it to the database."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected for uploading"}), 400

    if file and (file.filename.endswith('.xls') or file.filename.endswith('.xlsx')):
        conn = None
        try:
            df = pd.read_excel(file)
            conn = psycopg2.connect(
                database=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
            )
            
            result = insert_data_from_df(conn, df)
            
            if result['success']:
                return jsonify({"message": f"Successfully processed {result['rows_processed']} rows."})
            else:
                return jsonify({"error": result['error']}), 500

        except Exception as e:
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500
        finally:
            if conn is not None:
                conn.close()
    else:
        return jsonify({"error": "Invalid file type. Please upload an Excel file."}), 400

