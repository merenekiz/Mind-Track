from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: str = ""
    PUBMED_API_KEY: str = ""
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        env_file = ".env"


settings = Settings()
