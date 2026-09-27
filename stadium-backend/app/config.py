from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Reads configuration from environment variables / a .env file.
    See .env.example for every value this expects.
    """

    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    paystack_secret_key: str
    paystack_public_key: str

    pending_order_expiry_minutes: int = 20

    frontend_origins: str = "http://localhost:5173"
    frontend_url: str = "http://localhost:5173"

    # The access token now travels as an httpOnly cookie instead of a
    # JSON field the frontend has to stash in localStorage (which is
    # readable by any injected script, i.e. a full account-takeover
    # vector if an XSS bug ever shows up anywhere in the app).
    #
    # cookie_secure MUST be true in production (cookie only sent over
    # HTTPS). It defaults to false so local dev over plain http still
    # works. cookie_samesite is "lax" by default, which covers same-site
    # setups (including different localhost ports/subdomains of the same
    # domain) — set it to "none" (and cookie_secure=true) only if the
    # frontend and backend genuinely live on different registrable
    # domains, e.g. app.example.com talking to api.some-other-host.com.
    access_token_cookie_name: str = "access_token"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    cookie_domain: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


settings = Settings()


