"""
VehicleCare Flask Machine Learning Microservice
Exposes REST endpoint POST /predict for maintenance prediction.
SRS: Section 2.1, FR-35, FR-36, FR-37, FR-38
"""

import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify

app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model.joblib')
model = None

def get_model():
    global model
    if model is None and os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            print(f'[ML Microservice] Model loaded successfully from {MODEL_PATH}')
        except Exception as e:
            print(f'[ML Microservice Error] Failed to load model: {e}')
    return model

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'service': 'VehicleCare ML Microservice',
        'model_loaded': get_model() is not None,
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Missing JSON request payload.'}), 400

    # 1. Input Validation (FR-37)
    required_fields = ['vehicle_age', 'current_km', 'avg_km_per_month', 'last_service_interval', 'repair_count', 'fuel_type']
    missing_fields = [f for f in required_fields if f not in data or data[f] is None]

    if missing_fields:
        return jsonify({'error': f"Missing required fields: {', '.join(missing_fields)}"}), 400

    # 2. Build feature DataFrame
    try:
        fuel = str(data['fuel_type']).upper().strip()
        input_df = pd.DataFrame([{
            'vehicle_age': float(data['vehicle_age']),
            'current_km': float(data['current_km']),
            'avg_km_per_month': float(data['avg_km_per_month']),
            'last_service_interval': float(data['last_service_interval']),
            'repair_count': int(data['repair_count']),
            'fuel_type': fuel,
        }])
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid input format or type: {str(e)}'}), 400

    # 3. Model Inference (FR-35, FR-38)
    pipeline = get_model()

    if pipeline is not None:
        try:
            predictions = pipeline.predict(input_df)[0]
            oil_km = int(max(0, round(predictions[0])))
            if fuel == 'ELECTRIC':
                oil_km = 0
            brake_km = int(max(0, round(predictions[1])))
            est_cost = float(round(max(500.0, predictions[2]), 2))

            return jsonify({
                'oil_change_km': oil_km,
                'brake_inspection_km': brake_km,
                'estimated_cost': est_cost,
                'model_version': '1.0-rf',
            }), 200
        except Exception as e:
            print(f'[Inference Error] Pipeline execution failed: {e}')

    # Heuristic fallback if model binary is not yet trained on disk
    current_km = float(data['current_km'])
    oil_km = 0 if fuel == 'ELECTRIC' else int(max(500, 10000 - (current_km % 10000)))
    brake_km = int(max(1000, 15000 - (current_km % 15000)))
    base_cost = 4500.0
    if fuel == 'DIESEL': base_cost += 1200.0
    elif fuel == 'ELECTRIC': base_cost -= 800.0
    base_cost += float(data['vehicle_age']) * 200.0 + int(data['repair_count']) * 400.0

    return jsonify({
        'oil_change_km': oil_km,
        'brake_inspection_km': brake_km,
        'estimated_cost': round(base_cost, 2),
        'model_version': 'heuristic-fallback',
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 6000))
    print(f'[ML Microservice] Starting VehicleCare ML Service on http://0.0.0.0:{port}')
    app.run(host='0.0.0.0', port=port, debug=False)
