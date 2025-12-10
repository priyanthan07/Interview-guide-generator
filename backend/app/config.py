import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory (parent of app directory)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Debug: print if .env was found
if env_path.exists():
    print(f"✓ Loaded .env from: {env_path}")
else:
    print(f"⚠ Warning: .env file not found at: {env_path}")

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # PostgreSQL connection - loaded from environment variables only
    PG_HOST: str = os.getenv("PG_HOST", "")
    PG_PORT: str = os.getenv("PG_PORT", "5432")
    PG_DBNAME: str = os.getenv("PG_DBNAME", "")
    PG_USERNAME: str = os.getenv("PG_USERNAME", "")
    PG_PASSWORD: str = os.getenv("PG_PASSWORD", "")
    
    def __init__(self):
        # Debug output
        if self.OPENAI_API_KEY:
            print(f"✓ OpenAI API Key loaded (starts with: {self.OPENAI_API_KEY[:10]}...)")
        else:
            print("⚠ Warning: OPENAI_API_KEY not set - will use mock data for interview generation")
        
        if self.PG_HOST:
            print(f"✓ Database configured: {self.PG_HOST[:10]}....")
        else:
            print("⚠ Warning: Database credentials not fully configured")
    
    @property
    def DATABASE_URL(self) -> str:
        if not all([self.PG_HOST, self.PG_DBNAME, self.PG_USERNAME, self.PG_PASSWORD]):
            raise ValueError("Database credentials not configured. Please set PG_HOST, PG_DBNAME, PG_USERNAME, PG_PASSWORD in .env file")
        return f"postgresql://{self.PG_USERNAME}:{self.PG_PASSWORD}@{self.PG_HOST}:{self.PG_PORT}/{self.PG_DBNAME}"

settings = Settings()
