"""
VehicleCare Synthetic Data Generator
Generates realistic vehicle maintenance features and targets for training
the predictive maintenance regression models.
SRS: FR-35, FR-36, Section 2.6
"""

import os
import numpy as np
import pandas as pd

def generate_synthetic_data(num_samples=5000, random_seed=42):
    np.random.seed(random_seed)

    fuel_types = ['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID']
    fuel_probs = [0.45, 0.30, 0.10, 0.10, 0.05]

    data = []

    for _ in range(num_samples):
        fuel = np.random.choice(fuel_types, p=fuel_probs)
        vehicle_age = np.random.randint(0, 16)  # 0 to 15 years
        avg_km_per_month = int(np.random.normal(1200, 400))
        avg_km_per_month = max(300, min(avg_km_per_month, 3500))

        # Current odometer roughly proportional to age and monthly usage
        expected_km = int(vehicle_age * 12 * avg_km_per_month + np.random.normal(0, 3000))
        current_km = max(500, min(expected_km, 300000))

        repair_count = int(np.random.poisson(lam=max(0.5, vehicle_age * 0.8)))
        last_service_interval = int(np.random.normal(9000, 2500))
        last_service_interval = max(3000, min(last_service_interval, 20000))

        # Target 1: Oil change remaining km (0 for ELECTRIC vehicles)
        if fuel == 'ELECTRIC':
            oil_change_km = 0
        else:
            oil_cycle = 10000 if fuel != 'DIESEL' else 8500
            km_since_last_oil = (current_km % oil_cycle) + np.random.randint(-500, 500)
            oil_change_km = max(100, oil_cycle - km_since_last_oil)

        # Target 2: Brake inspection remaining km
        brake_cycle = 15000
        km_since_last_brakes = (current_km % brake_cycle) + np.random.randint(-1000, 1000)
        brake_inspection_km = max(200, brake_cycle - km_since_last_brakes)

        # Target 3: Estimated service cost (INR)
        base_cost = 3500.0
        if fuel == 'DIESEL':
            base_cost += 1500.0
        elif fuel == 'ELECTRIC':
            base_cost -= 800.0
        elif fuel == 'HYBRID':
            base_cost += 500.0

        # Cost scales with vehicle age, current mileage, and previous repairs
        age_factor = vehicle_age * 220.0
        mileage_factor = (current_km / 10000.0) * 180.0
        repair_factor = repair_count * 450.0
        noise = np.random.normal(0, 400.0)

        estimated_cost = round(max(1500.0, base_cost + age_factor + mileage_factor + repair_factor + noise), 2)

        data.append({
            'vehicle_age': vehicle_age,
            'current_km': current_km,
            'avg_km_per_month': avg_km_per_month,
            'last_service_interval': last_service_interval,
            'repair_count': repair_count,
            'fuel_type': fuel,
            'oil_change_km': int(oil_change_km),
            'brake_inspection_km': int(brake_inspection_km),
            'estimated_cost': estimated_cost,
        })

    df = pd.DataFrame(data)

    output_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, 'synthetic_vehicle_data.csv')
    df.to_csv(csv_path, index=False)
    print(f'[Synthetic Data] Successfully generated {len(df)} samples saved to: {csv_path}')
    return df

if __name__ == '__main__':
    generate_synthetic_data()
