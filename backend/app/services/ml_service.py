import pandas as pd
import numpy as np
import datetime

def feature_engineering_for_prediction(df):
    """Applies the same feature engineering as the training script."""
    df['signup_date'] = pd.to_datetime(df['signup_date'], errors='coerce')
    df['last_purchase_date'] = pd.to_datetime(df['last_purchase_date'], errors='coerce')
    
    TODAY = datetime.datetime(2025, 9, 27)
    df['days_since_last_purchase'] = (TODAY - df['last_purchase_date']).dt.days.fillna(9999)
    df['tenure_days'] = (TODAY - df['signup_date']).dt.days.fillna(-1)
    df['avg_spend_per_order'] = df['total_spend'] / df['purchase_count'].replace(0, 1)
    df['purchases_per_year'] = (df['purchase_count'] * 365) / (df['tenure_days'] + 1)
    
    num_cols = df.select_dtypes(include=np.number).columns
    for c in num_cols:
        df[c] = df[c].fillna(df[c].median())
        
    return df

def get_churn_predictions(customer_df, model_package):
    """Prepares data and returns churn probabilities and predictions."""
    churn_model = model_package['model']
    scaler = model_package['scaler']
    numeric_columns = model_package['numeric_columns']
    model_columns = model_package['model_columns']

    # Apply feature engineering
    customer_df_featured = feature_engineering_for_prediction(customer_df)
    
    # Prepare for prediction
    df_predict = pd.get_dummies(customer_df_featured, columns=['gender', 'country'], drop_first=True)
    df_predict_aligned = df_predict.reindex(columns=model_columns, fill_value=0)
    df_predict_aligned[numeric_columns] = scaler.transform(df_predict_aligned[numeric_columns])
    
    # Predict
    probabilities = churn_model.predict_proba(df_predict_aligned[model_columns])[:, 1]
    predictions = churn_model.predict(df_predict_aligned[model_columns])
    
    return customer_df_featured, probabilities, predictions