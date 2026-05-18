from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import analytics, auth, billing, contact, conversations, knowledge, organizations, social
from app.routers.webhooks import meta as meta_webhook

try:
    import sentry_sdk
except ImportError:
    sentry_sdk = None


def create_app() -> FastAPI:
    if sentry_sdk and settings.sentry_dsn:
        sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.1)

    app = FastAPI(title="Replyr AI — WhatsApp & Facebook", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url, "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register before /health and /api so Meta can verify /webhooks/meta reliably.
    app.include_router(meta_webhook.router, prefix="/webhooks")

    @app.get("/")
    def root() -> dict:
        return {
            "service": "replyr-ai-api",
            "health": "/health",
            "docs": "/docs",
            "api": "/api/v1",
        }

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    api = "/api/v1"
    app.include_router(auth.router, prefix=api)
    app.include_router(organizations.router, prefix=api)
    app.include_router(conversations.router, prefix=api)
    app.include_router(analytics.router, prefix=api)
    app.include_router(social.router, prefix=api)
    app.include_router(billing.router, prefix=api)
    app.include_router(contact.router, prefix=api)
    app.include_router(knowledge.router, prefix=api)

    return app


app = create_app()
