from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    secret_key: str
    frontend_url: str = "http://localhost:3000"
    encryption_key: str

    database_url: str
    redis_url: str = "redis://localhost:6379/0"

    clerk_domain: str
    clerk_secret_key: str = ""
    clerk_webhook_secret: str = ""

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_starter: str = ""
    stripe_price_professional: str = ""
    stripe_price_enterprise: str = ""

    openrouter_api_key: str = ""
    openrouter_default_model: str = "anthropic/claude-3-haiku"

    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_verify_token: str = ""

    tiktok_client_key: str = ""
    tiktok_client_secret: str = ""

    resend_api_key: str = ""
    from_email: str = "noreply@replyr.ai"

    sentry_dsn: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
