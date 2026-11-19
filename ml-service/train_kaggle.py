"""Train a VehicleCare maintenance-need benchmark from Kaggle Vehicle Maintenance Data.

Source: https://www.kaggle.com/datasets/chavindudulaj/vehicle-maintenance-data
Version 1 (MIT), synthetic. This classifier is separate from the app regressor.
"""

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, balanced_accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def train(dataset_path, output_path):
    column_map = {
        'Vehicle_Age': 'vehicle_age',
        'Odometer_Reading': 'odometer_reading',
        'Fuel_Type': 'fuel_type',
    }
    target = 'Need_Maintenance'
    rows = pd.read_csv(dataset_path, usecols=[*column_map, target]).rename(columns=column_map)
    rows = rows.dropna(subset=[*column_map.values(), target])
    rows['fuel_type'] = rows['fuel_type'].str.strip().str.upper()
    if set(rows[target]) != {0, 1}:
        raise ValueError('Expected both binary Need_Maintenance labels, 0 and 1.')

    x = rows[list(column_map.values())]
    y = rows[target]
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42, stratify=y
    )

    preprocess = ColumnTransformer([
        ('number', StandardScaler(), ['vehicle_age', 'odometer_reading']),
        ('category', OneHotEncoder(handle_unknown='ignore'), ['fuel_type']),
    ])
    model = make_pipeline(preprocess, LogisticRegression(class_weight='balanced'))
    baseline = DummyClassifier(strategy='most_frequent')
    print(f'{len(rows):,} samples | {len(x_train):,} train | {len(x_test):,} test')
    print(f'Positive labels in the test set: {y_test.mean():.1%}')

    for name, estimator in [('Majority baseline', baseline), ('Logistic regression', model)]:
        estimator.fit(x_train, y_train)
        predictions = estimator.predict(x_test)
        scores = estimator.predict_proba(x_test)[:, 1]
        print(
            f'{name}: accuracy={accuracy_score(y_test, predictions):.3%}, '
            f'balanced_accuracy={balanced_accuracy_score(y_test, predictions):.3%}, '
            f'ROC_AUC={roc_auc_score(y_test, scores):.4f}'
        )

    joblib.dump(model, output_path)
    print(f'Saved experimental classifier to {output_path}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('dataset', type=Path, help='Downloaded Kaggle CSV or single-CSV ZIP')
    parser.add_argument(
        '--output', type=Path, default=Path(__file__).with_name('maintenance_need_kaggle.joblib')
    )
    args = parser.parse_args()
    train(args.dataset, args.output)
