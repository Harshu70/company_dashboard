from flask import Blueprint, jsonify, request, current_app
from app.services import db_service, ml_service
import pandas as pd
import os
from dotenv import load_dotenv
import psycopg2
import joblib
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from app.services.db import engine
from sqlalchemy import text

load_dotenv()
sales_bp = Blueprint('sales_bp', __name__)


customer_df = db_service.get_aggregated_data()
customer_df_featured = ml_service.feature_engineering_for_prediction(customer_df)

model_package = current_app.churn_model_package
churn_model = model_package['model']
scaler = model_package['scaler']
numeric_columns = model_package['numeric_columns']
model_columns = model_package['model_columns']

df_predict = pd.get_dummies(customer_df_featured, columns=['gender', 'country'], drop_first=True)
df_predict_aligned = df_predict.reindex(columns=model_columns, fill_value=0)
df_predict_aligned[numeric_columns] = scaler.transform(df_predict_aligned[numeric_columns])

sales_forecaster = current_app.sales_forecaster

@sales_bp.route('/sales_forecast', methods=['GET'])
def get_sales_forecast():
    """Generates a sales forecast for a specified number of future days."""
    
    if sales_forecaster is None:
        return jsonify({"error": "Sales forecasting model not loaded."}), 500
        
    try:
        days_to_forecast = request.args.get('days', default=30, type=int)

        forecast_results = sales_forecaster.get_forecast(steps=days_to_forecast)
        
        predicted_mean = forecast_results.predicted_mean
        
        confidence_interval = forecast_results.conf_int()

        forecast_data = {
            "dates": predicted_mean.index.strftime('%Y-%m-%d').tolist(),
            "predicted_sales": predicted_mean.values.tolist(),
            "confidence_lower": confidence_interval.iloc[:, 0].values.tolist(),
            "confidence_upper": confidence_interval.iloc[:, 1].values.tolist(),
        }
        
        return jsonify(forecast_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@sales_bp.route('/top_products', methods=['GET'])
def get_top_products():
    """Calculates the top 10 products with the highest historical sales."""
    try:
        sql_query = """
            SELECT
                p.product_name,
                p.category,
                SUM(o.unit_price * o.quantity) as total_sales
            FROM
                products p
            JOIN
                orders o ON p.product_id = o.product_id
            GROUP BY
                p.product_name, p.category
            ORDER BY
                total_sales DESC
            LIMIT 10;
        """
        
        with engine.connect() as connection:
            df = pd.read_sql(sql_query, connection)
        
        top_products_list = df.to_dict(orient='records')
        
        return jsonify(top_products_list)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@sales_bp.route('/full_sales_view', methods=['GET'])
def get_full_sales_view():
    """
    Provides the last 180 days of historical sales and a future forecast.
    """
    if sales_forecaster is None:
        return jsonify({"error": "Sales forecasting model not loaded."}), 500
        
    try:
        sql_query = """
            SELECT 
                last_purchase_date, 
                SUM(unit_price * quantity) as order_amount
            FROM 
                orders
            WHERE 
                last_purchase_date >= (SELECT MAX(last_purchase_date) - INTERVAL '180 days' FROM orders)
            GROUP BY
                last_purchase_date;
        """
        
        with engine.connect() as connection:
            df = pd.read_sql(sql_query, connection)


        df['last_purchase_date'] = pd.to_datetime(df['last_purchase_date'], errors='coerce')
        historical_sales = df.groupby('last_purchase_date')['order_amount'].sum().asfreq('D').fillna(0)

        # Part 2: Generate Forecast
        days_to_forecast = request.args.get('days', default=90, type=int)
        forecast_results = sales_forecaster.get_forecast(steps=days_to_forecast)
        predicted_mean = forecast_results.predicted_mean

        # Part 3: Combine and Format Data
        full_view_data = {
            "historical_dates": historical_sales.index.strftime('%Y-%m-%d').tolist(),
            "historical_sales": historical_sales.values.tolist(),
            "forecast_dates": predicted_mean.index.strftime('%Y-%m-%d').tolist(),
            "forecast_sales": predicted_mean.values.tolist(),
        }
        
        return jsonify(full_view_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sales_bp.route('/sales_kpis', methods=['GET'])
def get_sales_kpis():
    """Analyzes historical sales to find key performance indicators."""
    try:
        sql_query = """
            SELECT last_purchase_date, (unit_price * quantity) as order_amount
            FROM orders;
        """
        with engine.connect() as connection:
            df = pd.read_sql(sql_query, connection)


        df['last_purchase_date'] = pd.to_datetime(df['last_purchase_date'], errors='coerce')
        df = df.dropna(subset=['last_purchase_date', 'order_amount'])

        # Calculate KPIs
        total_revenue = df['order_amount'].sum()
        avg_daily_sales = df.groupby(df['last_purchase_date'].dt.date)['order_amount'].sum().mean()
        
        # Find best and worst sales month
        monthly_sales = df.set_index('last_purchase_date').resample('M')['order_amount'].sum()
        best_month = monthly_sales.idxmax()
        best_month_sales = monthly_sales.max()
        worst_month = monthly_sales.idxmin()
        worst_month_sales = monthly_sales.min()

        kpis = {
            "total_revenue": total_revenue,
            "average_daily_sales": avg_daily_sales,
            "best_month": best_month.strftime('%B %Y'),
            "best_month_sales": best_month_sales,
            "worst_month": worst_month.strftime('%B %Y'),
            "worst_month_sales": worst_month_sales,
        }
        return jsonify(kpis)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sales_bp.route('/product_demand_forecast', methods=['GET'])
def get_product_demand_forecast():
    """Forecasts demand for the top 5 selling products with a fallback for sparse data."""
    try:
        top_products_query = """
            SELECT product_id, SUM(quantity) as total_quantity
            FROM orders
            GROUP BY product_id
            ORDER BY total_quantity DESC
            LIMIT 5;
        """
        with engine.connect() as connection:
            top_products_df = pd.read_sql(top_products_query, connection)


        top_product_ids = top_products_df['product_id'].tolist()

        if not top_product_ids:
            return jsonify([])

        # Step 2: Fetch sales history (unchanged)
        sales_history_query = f"""
            SELECT o.last_purchase_date, o.product_id, o.quantity, p.product_name
            FROM orders o
            JOIN products p ON o.product_id = p.product_id
            WHERE o.product_id IN ({",".join(["'%s'" % pid for pid in top_product_ids])});
        """
        with engine.connect() as connection:
            sales_history_df = pd.read_sql(sales_history_query, connection)
        sales_history_df['last_purchase_date'] = pd.to_datetime(sales_history_df['last_purchase_date'])

        # Step 3: Forecast for each product
        all_forecasts = []
        for product_id in top_product_ids:
            product_sales = sales_history_df[sales_history_df['product_id'] == product_id]
            daily_demand = product_sales.groupby('last_purchase_date')['quantity'].sum().asfreq('D').fillna(0)
            product_name = product_sales['product_name'].iloc[0]
            
            forecasted_demand = 0
            if len(daily_demand[daily_demand > 0]) > 7:
                model = ExponentialSmoothing(daily_demand, trend='add', seasonal=None).fit(smoothing_level=0.2)
                forecast = model.forecast(30)
                forecasted_demand = abs(round(forecast.sum()))
            else:
                total_units = daily_demand.sum()
                days_with_sales = (daily_demand.index.max() - daily_demand.index.min()).days
                if days_with_sales > 0:
                    avg_daily_rate = total_units / days_with_sales
                    forecasted_demand = abs(round(avg_daily_rate * 30))
                else:
                    forecasted_demand = total_units
            
            all_forecasts.append({
                "product_id": product_id,
                "product_name": product_name,
                # --- CRITICAL FIX: Convert the number to a standard Python integer ---
                "forecasted_demand_30_days": int(forecasted_demand)
            })

        return jsonify(all_forecasts)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@sales_bp.route('/main_kpis', methods=['GET'])
def get_main_kpis():
    """Calculates the main dashboard KPIs: Revenue, Orders, AOV, and Churn Rate."""
    try:
        sales_query = """
            SELECT
                SUM(unit_price * quantity) as total_revenue,
                COUNT(DISTINCT order_id) as total_orders
            FROM orders;
        """
        with engine.connect() as connection:
            sales_df = pd.read_sql(sales_query, connection)
        total_revenue = sales_df['total_revenue'][0]
        total_orders = sales_df['total_orders'][0]
        average_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        predictions = churn_model.predict(df_predict_aligned[model_columns])
        churn_rate = (predictions.sum() / len(predictions)) * 100 if len(predictions) > 0 else 0

        kpis = {
            "total_revenue": float(total_revenue),
            "total_orders": int(total_orders),
            "average_order_value": float(average_order_value),
            "churn_rate": float(churn_rate),
        }
        
        return jsonify(kpis)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
@sales_bp.route('/sales_by_age', methods=['GET'])
def get_sales_by_age():
    """Calculates total sales revenue for predefined age groups."""
    try:
        sql_query = """
            SELECT
                CASE
                    WHEN c.age BETWEEN 18 AND 25 THEN '18-25'
                    WHEN c.age BETWEEN 26 AND 35 THEN '26-35'
                    WHEN c.age BETWEEN 36 AND 45 THEN '36-45'
                    WHEN c.age BETWEEN 46 AND 60 THEN '46-60'
                    -- Assuming anyone 61 or older is 60+
                    ELSE '60+' 
                END AS age_group,
                -- Sum the quantity from the orders table
                SUM(o.quantity) AS total_sales
            FROM customers c
            -- Join customers table with the orders table
            JOIN orders o ON c.customer_id = o.customer_id
            -- Group by the newly created age_group label
            GROUP BY age_group
            ORDER BY total_sales DESC;
        """
        
        with engine.connect() as connection:
            df = pd.read_sql(sql_query, connection)
        
        age_data = df.to_dict(orient='records')
        
        return jsonify(age_data)

    except Exception as e:
        print(f"Database Error in get_sales_by_age: {e}")
        return jsonify({"error": "Failed to fetch sales by age data."}), 500

@sales_bp.route('/monthly_sales', methods=['GET'])
def get_monthly_sales():
    """Fetches total quantity sold grouped by month."""
    try:
        sql_query = """
            SELECT last_purchase_date, quantity
            FROM orders;
        """
        with engine.connect() as connection:
            df = pd.read_sql(sql_query, connection)
        df['last_purchase_date'] = pd.to_datetime(df['last_purchase_date'], errors='coerce')
        df = df.dropna(subset=['last_purchase_date', 'quantity'])

        monthly_sales = (
            df.groupby(df['last_purchase_date'].dt.to_period("M"))['quantity']
              .sum()
              .reset_index()
        )
        monthly_sales['last_purchase_date'] = monthly_sales['last_purchase_date'].dt.strftime('%B %Y')

        data = [
            {"month": row['last_purchase_date'], "total_quantity": int(row['quantity'])}
            for _, row in monthly_sales.iterrows()
        ]

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sales_bp.route('/yearly_sales', methods=['GET'])
def get_yearly_sales():
    """Fetches total quantity sold grouped by year."""
    try:
        sql_query = """
            SELECT last_purchase_date, quantity
            FROM orders;
        """
        with engine.connect() as connection:
            df = pd.read_sql(sql_query, connection)
        df['last_purchase_date'] = pd.to_datetime(df['last_purchase_date'], errors='coerce')
        df = df.dropna(subset=['last_purchase_date', 'quantity'])

        yearly_sales = (
            df.groupby(df['last_purchase_date'].dt.year)['quantity']
              .sum()
              .reset_index()
        )
        yearly_sales.rename(columns={"last_purchase_date": "year", "quantity": "total_quantity"}, inplace=True)

        data = [
            {"year": int(row['year']), "total_quantity": int(row['total_quantity'])}
            for _, row in yearly_sales.iterrows()
        ]

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sales_bp.route('/db_stats', methods=['GET'])
def get_db_stats():
    """Returns total entries count and % of cancelled subscriptions."""
    try:
        with engine.connect() as conn:
            total_count = conn.execute(
                text("SELECT COUNT(*) FROM orders;")
            ).scalar()

            cancelled_count = conn.execute(
                text("SELECT COUNT(*) FROM orders WHERE subscription_status = 'cancelled';")
            ).scalar()

        cancelled_percentage = (
            (cancelled_count / total_count) * 100 if total_count > 0 else 0
        )

        return jsonify({
            "total_entries": total_count,
            "cancelled_count": cancelled_count,
            "cancelled_percentage": round(cancelled_percentage, 2)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
