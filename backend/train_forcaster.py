import pandas as pd
import joblib
import warnings
from statsmodels.tsa.statespace.sarimax import SARIMAX
from app.services.db import engine

warnings.filterwarnings('ignore')

def get_sales_data():
    """Fetches raw order data to create a sales time-series."""
    try:
        sql_query = """
            SELECT
                last_purchase_date,
                (unit_price * quantity) as order_amount
            FROM
                orders;
        """
        
        df = pd.read_sql(sql_query, engine)
        print("Success: Sales data loaded from database.")
        return df

    except Exception as e:
        print(f"Error: Could not fetch sales data. {e}")
        return None

def train_and_save_forecaster(df):
    """Prepares time-series data and trains and saves a SARIMAX model."""
    
    df['last_purchase_date'] = pd.to_datetime(df['last_purchase_date'], errors='coerce')
    df = df.dropna(subset=['last_purchase_date', 'order_amount'])
    
    sales_daily = df.groupby('last_purchase_date')['order_amount'].sum().asfreq('D').fillna(0)
    
    if len(sales_daily) < 14:
        print("Error: Not enough daily data to train the forecasting model.")
        return

    print("Training SARIMAX model... this may take a moment.")
    try:
        model = SARIMAX(sales_daily, order=(1, 1, 1), seasonal_order=(1, 1, 1, 7))
        results = model.fit(disp=False)
        
        joblib.dump(results, 'sales_forecaster.pkl')
        print("\nSuccess: Sales forecasting model trained and saved to 'sales_forecaster.pkl'")

    except Exception as e:
        print(f"Error during model training: {e}")

if __name__ == '__main__':
    sales_df = get_sales_data()
    
    if sales_df is not None:
        train_and_save_forecaster(sales_df)