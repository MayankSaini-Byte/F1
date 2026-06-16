import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from data.data import load_raw_data
from data_preprocessing import engineer_features, build_preprocessor
from model_evaluation import evaluate_predictions

def run_training_pipeline():
    df = load_raw_data()
    
    df_engineered = engineer_features(df)
    
    target = 'PitNextLap'
    X = df_engineered.drop(columns=['id', target])
    y = df_engineered[target]
    
    num_col = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    cat_col = X.select_dtypes(include=['object']).columns.tolist()
    
    preprocessor = build_preprocessor(num_col, cat_col)
    
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    
    X_train_trans = preprocessor.fit_transform(X_train)
    X_val_trans = preprocessor.transform(X_val)
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_features='sqrt',
        max_depth=None,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train_trans, y_train)
    
    y_pred = model.predict(X_val_trans)
    y_prob = model.predict_proba(X_val_trans)[:, 1]
    
    metrics = evaluate_predictions(y_val, y_pred, y_prob)
    
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models'))
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, 'predict_pit_stop.pkl')
    scaler_path = os.path.join(models_dir, 'scaler.pkl')
    
    joblib.dump(model, model_path)
    joblib.dump(preprocessor, scaler_path)

if __name__ == '__main__':
    run_training_pipeline()
