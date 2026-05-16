from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(alias="DATABASE_URL")
    bot_token: str = Field(alias="BOT_TOKEN")
    jwt_secret: str = Field(alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    mini_app_url: str = Field(default="http://localhost:5173", alias="MINI_APP_URL")
    backend_cors_origins: str = Field(default="http://localhost:5173", alias="BACKEND_CORS_ORIGINS")
    jwt_expires_minutes: int = Field(default=60 * 24 * 30, alias="JWT_EXPIRES_MINUTES")
    webhook_base_url: str | None = Field(default=None, alias="WEBHOOK_BASE_URL")
    enable_integrated_scheduler: bool = Field(default=False, alias="ENABLE_INTEGRATED_SCHEDULER")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
