import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AVIGHNA - Smart Logistics & Accessibility Intelligence Platform"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "avighna_super_secret_jwt_key_ner_logistics_platform")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./avighna.db")
    
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    MAP_API_KEY: str = os.getenv("MAP_API_KEY", "")
    DEBUG: bool = True

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
