from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Create engine with pool_pre_ping to handle stale connections
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Enables connection health checks
    pool_recycle=300,    # Recycle connections every 5 minutes
    pool_size=5,         # Number of connections in pool
    max_overflow=10      # Max additional connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
