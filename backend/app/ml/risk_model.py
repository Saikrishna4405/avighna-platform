import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "risk_model.joblib")

_model_cache = None

def get_risk_model():
    global _model_cache
    if _model_cache is None:
        abs_path = os.path.abspath(MODEL_PATH)
        if os.path.exists(abs_path):
            try:
                _model_cache = joblib.load(abs_path)
            except Exception as e:
                print(f"Error loading joblib model from {abs_path}: {e}")
                _model_cache = None
        else:
            # Fallback: train on the fly if needed
            try:
                from app.ml.train_model import train_and_save_model
                model_dir = os.path.dirname(abs_path)
                _model_cache = train_and_save_model(model_dir=model_dir)
            except Exception as e:
                print(f"Error training fallback model: {e}")
                _model_cache = None
    return _model_cache

def road_condition_to_num(condition: str) -> int:
    mapping = {"GOOD": 0, "FAIR": 1, "POOR": 2, "CRITICAL": 3}
    return mapping.get(str(condition).upper(), 1)
