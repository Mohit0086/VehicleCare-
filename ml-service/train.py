"""
VehicleCare Model Training Script
Trains scikit-learn MultiOutput regression models for:
1. Oil change remaining km
2. Brake inspection remaining km
3. Estimated service cost (INR)
Evaluates using Mean Absolute Error (MAE) per SRS 1.3.
"""

import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error

from generate_data import generate_synthetic_data

def train_and_save_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, 'data', 'synthetic_vehicle_data.csv')

    if not os.path.exists(data_path):
        print('[Train] Dataset not found on disk. Generating synthetic data...')
        df = generate_synthetic_data()
    else:
        df = pd.read_csv(data_path)

    # Feature definitions (FR-36)
    num_features = ['vehicle_age', 'current_km', 'avg_km_per_month', 'last_service_interval', 'repair_count']
    cat_features = ['fuel_type']
    target_cols = ['oil_change_km', 'brake_inspection_km', 'estimated_cost']

    X = df[num_features + cat_features]
    y = df[target_cols]

    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), cat_features),
        ]
    )

    # Full regression pipeline with MultiOutputRegressor
    model_pipeline = Pipeline(
        steps=[
            ('preprocessor', preprocessor),
            ('regressor', MultiOutputRegressor(RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1))),
        ]
    )

    print('[Train] Training multi-target regression model on dataset...')
    model_pipeline.fit(X_train, y_train)

    # Model Evaluation (MAE)
    y_pred = model_pipeline.predict(X_test)
    y_pred_df = pd.DataFrame(y_pred, columns=target_cols)

    print('=== Model Evaluation (Test Set MAE) ===')
    for col in target_cols:
        mae = mean_absolute_error(y_test[col], y_pred_df[col])
        print(f' - {col} MAE: {mae:.2f}')

    # Save trained model artifact
    model_path = os.path.join(current_dir, 'model.joblib')
    joblib.dump(model_pipeline, model_path)
    print(f'[Train] Model artifact successfully saved to: {model_path}')

    return model_pipeline

if __name__ == '__main__':
    train_and_save_model()
