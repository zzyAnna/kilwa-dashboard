"""
Kilwa Pipeline Dashboard Backend
FastAPI application for monitoring scraper and sentiment analysis performance
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging

from database import engine, get_db, test_connection, Base
from routes import scraper, sentiment

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Kilwa Pipeline Dashboard",
    description="Monitor and evaluate Kilwa's data processing pipeline",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scraper.router)
app.include_router(sentiment.router)


@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    logger.info("Starting Kilwa Dashboard Backend...")
    
    # Test database connection
    success, message = test_connection()
    if success:
        logger.info(f"✅ {message}")
    else:
        logger.error(f"❌ {message}")
        logger.warning("Database not available. Some features may not work.")


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "name": "Kilwa Pipeline Dashboard",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "scraper_health": "/api/scraper/health",
            "sentiment_analyze": "/api/sentiment/analyze",
            "model_comparison": "/api/sentiment/compare-models",
            "docs": "/docs"
        }
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    db_success, db_message = test_connection()
    
    return {
        "status": "healthy" if db_success else "degraded",
        "database": "connected" if db_success else "disconnected",
        "database_message": db_message
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
