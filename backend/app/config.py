import os

try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        class BaseSettings:
            pass

class Settings(BaseSettings):
    PROJECT_NAME: str = "AVIGHNA - AI-Powered Smart Logistics & Accessibility Intelligence for NER"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "avighna_super_secret_jwt_key_ner_logistics_platform")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./avighna.db")
    
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    MAP_API_KEY: str = os.getenv("MAP_API_KEY", "")
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
