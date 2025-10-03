import pandas as pd
import psycopg2
from psycopg2 import extras

def insert_data_from_df(conn, df):
    """
    Cleans and inserts data from a DataFrame into the database.
    Returns a dictionary with the result.
    """
    cursor = conn.cursor()
    try:
        # 1. Clean the data
        df['signup_date'] = pd.to_datetime(df['signup_date'], errors='coerce')
        df['last_purchase_date'] = pd.to_datetime(df['last_purchase_date'], errors='coerce')
        numeric_cols = ['age', 'cancellations_count', 'unit_price', 'quantity', 'purchase_frequency', 'Ratings']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        # 2. Insert Customers
        customers = df[['customer_id', 'age', 'gender', 'country', 'signup_date']].drop_duplicates(subset=['customer_id'])
        customer_tuples = [tuple(x) for x in customers.to_numpy()]
        extras.execute_values(cursor,
            "INSERT INTO customers (customer_id, age, gender, country, signup_date) VALUES %s ON CONFLICT (customer_id) DO NOTHING",
            customer_tuples)
        
        # 3. Insert Products
        products = df[['product_id', 'product_name', 'category']].drop_duplicates(subset=['product_id'])
        product_tuples = [tuple(x) for x in products.to_numpy()]
        extras.execute_values(cursor,
            "INSERT INTO products (product_id, product_name, category) VALUES %s ON CONFLICT (product_id) DO NOTHING",
            product_tuples)

        # 4. Insert Orders
        orders = df[['order_id', 'customer_id', 'product_id', 'last_purchase_date', 'cancellations_count', 'subscription_status', 'unit_price', 'quantity', 'purchase_frequency', 'Ratings']]
        order_tuples = [tuple(x) for x in orders.to_numpy()]
        extras.execute_values(cursor,
            "INSERT INTO orders (order_id, customer_id, product_id, last_purchase_date, cancellations_count, subscription_status, unit_price, quantity, purchase_frequency, ratings) VALUES %s ON CONFLICT (order_id) DO NOTHING",
            order_tuples)
        
        conn.commit()
        return {"success": True, "rows_processed": len(df)}
    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        cursor.close()