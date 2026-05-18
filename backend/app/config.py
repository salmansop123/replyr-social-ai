from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    dev_auth_enabled: bool = False
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

    knowledge_storage_dir: str = "data/knowledge"
    knowledge_max_upload_mb: int = 10

    @property
    def knowledge_max_upload_bytes(self) -> int:
        return self.knowledge_max_upload_mb * 1024 * 1024

    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_verify_token: str = ""
    webhook_base_url: str = ""
    # WhatsApp Business Cloud API (Graph): long-lived / system user access token
    meta_whatsapp_access_token: str = ""
    # WABA phone number ID (digits) — used in POST .../v18.0/{PHONE_NUMBER_ID}/messages
    meta_whatsapp_phone_number_id: str = ""
    # Facebook Pages OAuth callback (must match Meta app settings)
    meta_oauth_redirect_uri: str = ""

    tiktok_client_key: str = ""
    tiktok_client_secret: str = ""

    resend_api_key: str = ""
    from_email: str = "noreply@replyr.ai"

    sentry_dsn: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
