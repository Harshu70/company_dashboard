from flask import Blueprint, jsonify, request, current_app
from app.services import db_service, ml_service
import pandas as pd
from app.services.db import engine

churn_bp = Blueprint('churn_bp', __name__)

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

@churn_bp.route('/predict_churn', methods=['GET'])
def predict_churn():
    """Predicts the top N customers likely to churn with additional details."""
    try:
        count = request.args.get('count', default=10, type=int)
        churn_probabilities = churn_model.predict_proba(df_predict_aligned[model_columns])[:, 1]
        
        results_df = customer_df_featured[[
            'customer_id', 
            'last_purchase_date', 
            'total_cancellations', 
            'subscription_status'
        ]].copy()
        results_df['churn_probability'] = churn_probabilities
        
        top_n_churners = results_df.sort_values(by='churn_probability', ascending=False).head(count)
        
        top_n_churners['last_purchase_date'] = top_n_churners['last_purchase_date'].dt.strftime('%Y-%m-%d')
        
        return jsonify(top_n_churners.to_dict(orient='records'))

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@churn_bp.route('/churn_trends', methods=['GET'])
def get_churn_trends():
    try:
        customer_df_featured['predicted_churn'] = churn_model.predict(df_predict_aligned[model_columns])
        df_time = customer_df_featured.set_index('last_purchase_date')
        monthly_churn = df_time['predicted_churn'].resample('M').sum()
        trend_data = {
            "months": monthly_churn.index.strftime('%Y-%m').tolist(),
            "churn_counts": monthly_churn.values.tolist()
        }
        return jsonify(trend_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@churn_bp.route('/churn_segmentation', methods=['GET'])
def get_churn_segmentation():
    try:
        churn_probabilities = churn_model.predict_proba(df_predict_aligned[model_columns])[:, 1]
        def assign_segment(prob):
            if prob < 0.3: return 'Low Risk'
            elif prob < 0.7: return 'Medium Risk'
            else: return 'High Risk'
        segments = pd.Series(churn_probabilities).apply(assign_segment)
        segment_counts = segments.value_counts().to_dict()
        return jsonify(segment_counts)
    except Exception as e:
        return jsonify({"error": str(e)}), 500\
        


@churn_bp.route('/user_distribution', methods=['GET'])
def get_user_distribution():
    """Calculates the number of users per country."""
    try:
        sql_query = """
            SELECT country, COUNT(customer_id) as user_count
            FROM customers
            GROUP BY country
            ORDER BY user_count DESC;
        """
        df = pd.read_sql(sql_query, engine)
        
        country_data = df.to_dict(orient='records')
        return jsonify(country_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500