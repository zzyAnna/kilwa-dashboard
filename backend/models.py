"""
SQLAlchemy Models for Kilwa Dashboard
Based on kilwa_db_dump_20251110_201028.sql structure
"""
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class Country(Base):
    """Country reference table"""
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    iso_code = Column(String(3), nullable=False)


class NewsArticle(Base):
    """News articles table - main data source for analysis"""
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    country_id = Column(Integer, nullable=False)
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    source = Column(String(100), nullable=False)
    author = Column(String(200), nullable=True)
    published_at = Column(DateTime, nullable=False)
    url = Column(String(500), nullable=True)
    
    # Sentiment fields
    sentiment_score = Column(Float, nullable=True)
    sentiment_label = Column(String(20), nullable=True)
    sentiment_confidence = Column(Float, nullable=True)
    
    # Metadata
    topics = Column(JSON, nullable=True)
    relevance_score = Column(Float, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    language = Column(String(10), nullable=True)
    word_count = Column(Integer, nullable=True)
    
    # Translation tracking
    language_confidence = Column(Float, nullable=True)
    was_translated = Column(Boolean, default=False)
    original_language = Column(String(10), nullable=True)
    translation_confidence = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=True)


class SentimentResult(Base):
    """Sentiment analysis results - for comparison between models"""
    __tablename__ = "sentiment_results"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, nullable=False)
    
    # Model identification
    model_name = Column(String(50), nullable=False)  # 'finbert', 'vader', 'textblob', 'hybrid'
    
    # Sentiment scores
    sentiment_score = Column(Float, nullable=False)
    sentiment_label = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=True)
    
    # Detailed scores (for multi-model comparison)
    positive_score = Column(Float, nullable=True)
    negative_score = Column(Float, nullable=True)
    neutral_score = Column(Float, nullable=True)
    
    # Processing metadata
    processing_time_ms = Column(Integer, nullable=True)
    was_translated = Column(Boolean, default=False)
    original_language = Column(String(10), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
