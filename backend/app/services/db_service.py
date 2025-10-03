import pandas as pd
from decimal import Decimal
import datetime
from app.services.db import engine


def get_aggregated_data():
    """Fetches and returns aggregated customer data."""
    sql_query = """
        SELECT
            c.customer_id, c.age, c.gender, c.country,
            MIN(c.signup_date) as signup_date,
            MAX(o.last_purchase_date) as last_purchase_date,
            COUNT(o.order_id) as purchase_count,
            SUM(o.quantity) as total_items_purchased,
            SUM(o.unit_price * o.quantity) as total_spend,
            AVG(o.ratings) as avg_rating,
            SUM(o.cancellations_count) as total_cancellations,
            MAX(o.subscription_status) as subscription_status
        FROM customers c JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.age, c.gender, c.country;
    """
    df = pd.read_sql(sql_query, engine)
    return df


def json_converter(obj):
    if isinstance(obj, Decimal): return float(obj)
    if isinstance(obj, (datetime.datetime, datetime.date)): return obj.isoformat()
    raise TypeError ("Type %s not serializable" % type(obj))