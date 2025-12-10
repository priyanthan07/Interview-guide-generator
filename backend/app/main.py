from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import evaluations

app = FastAPI(
    title="Interview Guide Generator",
    description="AI-powered interview question generator based on Skillfully simulation results",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(evaluations.router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Interview Guide Generator API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
