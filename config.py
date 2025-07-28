"""Configuration settings for the JSON Viewer application."""

import os
from typing import Optional
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Analytics Configuration
    ga_tracking_id: Optional[str] = None

    # Application Configuration
    app_env: str = "development"
    debug: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()
