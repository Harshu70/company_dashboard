import pandas as pd
import psycopg2
from psycopg2 import extras
from dotenv import load_dotenv
import os

load_dotenv()

DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS") 
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")


EXCEL_FILE_PATH = 'E-Commerce Customer Insights and Churn Dataset3938d09.xls'

def clean_data(df):
    """Cleans and preprocesses the DataFrame for database insertion."""
    df['signup_date'] = pd.to_datetime(df['signup_date'], errors='coerce')
    df['last_purchase_date'] = pd.to_datetime(df['last_purchase_date'], errors='coerce')
    numeric_cols = ['age', 'cancellations_count', 'unit_price', 'quantity', 'purchase_frequency', 'Ratings']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    print("Success: Data cleaning complete.")
    return df

def insert_data(conn, df):
    """Inserts data from the DataFrame into the PostgreSQL database tables."""
    cursor = conn.cursor()
    try:
        customers = df[['customer_id', 'age', 'gender', 'country', 'signup_date']].drop_duplicates(subset=['customer_id'])
        customer_tuples = [tuple(x) for x in customers.to_numpy()]
        extras.execute_values(cursor, 
            "INSERT INTO customers (customer_id, age, gender, country, signup_date) VALUES %s ON CONFLICT (customer_id) DO NOTHING", 
            customer_tuples)
        print("-> {} customers inserted.".format(cursor.rowcount))

        products = df[['product_id', 'product_name', 'category']].drop_duplicates(subset=['product_id'])
        product_tuples = [tuple(x) for x in products.to_numpy()]
        extras.execute_values(cursor, 
            "INSERT INTO products (product_id, product_name, category) VALUES %s ON CONFLICT (product_id) DO NOTHING", 
            product_tuples)
        print("-> {} products inserted.".format(cursor.rowcount))

        orders = df[['order_id', 'customer_id', 'product_id', 'last_purchase_date', 'cancellations_count', 'subscription_status', 'unit_price', 'quantity', 'purchase_frequency', 'Ratings']]
        order_tuples = [tuple(x) for x in orders.to_numpy()]
        extras.execute_values(cursor, 
            "INSERT INTO orders (order_id, customer_id, product_id, last_purchase_date, cancellations_count, subscription_status, unit_price, quantity, purchase_frequency, ratings) VALUES %s ON CONFLICT (order_id) DO NOTHING", 
            order_tuples)
        print("-> {} orders inserted.".format(cursor.rowcount))
        conn.commit()
    except Exception as e:
        print("Error: An error occurred during insertion: {}".format(e))
        conn.rollback()
    finally:
        cursor.close()

def main():
    """Main function to run the entire data import process."""
    try:
        df = pd.read_excel(EXCEL_FILE_PATH)
        df = clean_data(df)
        conn = psycopg2.connect(database=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
        print("Success: Database connection successful.")
        insert_data(conn, df)
        conn.close()
        print("\nData import complete and connection closed.")
    except IOError: 
        print("Error: The file was not found at '{}'".format(EXCEL_FILE_PATH))
    except psycopg2.OperationalError:
        print("Error: Database Connection Error. Check your DB_PASS and other connection details.")
    except Exception as e:
        print("Error: An unexpected error occurred: {}".format(e))

if __name__ == "__main__":
    main()