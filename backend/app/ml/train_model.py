import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor

def generate_synthetic_ner_data(num_samples: int = 1500):
    np.random.seed(42)
    
    # Feature ranges representative of NER topography
    rainfall = np.random.uniform(0, 250, num_samples) # mm
    slope = np.random.uniform(2, 55, num_samples) # degrees
    elevation = np.random.uniform(100, 2800, num_samples) # meters
    historical_incidents = np.random.randint(0, 10, num_samples)
    nearby_incidents = np.random.randint(0, 5, num_samples)
    
    # Encode road_condition: GOOD=0, FAIR=1, POOR=2, CRITICAL=3
    road_condition_num = np.random.choice([0, 1, 2, 3], size=num_samples, p=[0.3, 0.4, 0.2, 0.1])
    
    # Synthetic risk formula combining physics & historical vulnerability
    # High rainfall + steep slope + poor road condition + historical incidents drive high risk
    risk = (
        0.35 * (rainfall / 2.5) +               # max ~35
        0.25 * (slope / 55.0 * 100) +           # max ~25
        0.15 * (road_condition_num / 3.0 * 100) + # max ~15
        0.15 * (historical_incidents / 10.0 * 100) + # max ~15
        0.10 * (nearby_incidents / 5.0 * 100)     # max ~10
    )
    
    # Add minor noise
    noise = np.random.normal(0, 3, num_samples)
    risk_score = np.clip(risk + noise, 0, 100)
    
    df = pd.DataFrame({
        'rainfall': rainfall,
        'slope': slope,
        'elevation': elevation,
        'road_condition_num': road_condition_num,
        'historical_incidents': historical_incidents,
        'nearby_incidents': nearby_incidents,
        'risk_score': risk_score
    })
    return df

def train_and_save_model(model_dir: str = "../ml_models"):
    print("Generating synthetic NER terrain risk dataset...")
    df = generate_synthetic_ner_data()
    
    X = df[['rainfall', 'slope', 'elevation', 'road_condition_num', 'historical_incidents', 'nearby_incidents']]
    y = df['risk_score']
    
    print("Training RandomForestRegressor ML model...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "risk_model.joblib")
    joblib.dump(model, model_path)
    print(f"Model successfully saved to {os.path.abspath(model_path)}")
    return model

if __name__ == "__main__":
    train_and_save_model()
