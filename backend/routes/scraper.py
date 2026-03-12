"""
Scraper Metrics API Routes
Provides metadata health checks for news articles
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Dict, Any
from pydantic import BaseModel

from database import get_db
from models import NewsArticle, Country

router = APIRouter(prefix="/api/scraper", tags=["Scraper Metrics"])


class FieldStats(BaseModel):
    field_name: str
    total_count: int
    null_count: int
    null_percentage: float
    non_null_percentage: float


class SourceStats(BaseModel):
    source: str
    count: int
    content_null_pct: float
    summary_null_pct: float


class ScraperHealth(BaseModel):
    total_articles: int
    field_stats: List[FieldStats]
    source_breakdown: List[SourceStats]
    language_distribution: Dict[str, int]
    articles_by_country: List[Dict[str, Any]]


@router.get("/health", response_model=ScraperHealth)
def get_scraper_health(
    source: str = Query(None, description="Filter by source"),
    language: str = Query(None, description="Filter by language"),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive scraper health metrics
    Shows metadata completeness and data quality
    Optional filters: source, language
    """
    # Build base query with filters
    base_query = db.query(NewsArticle)
    if source:
        base_query = base_query.filter(NewsArticle.source == source)
    if language:
        base_query = base_query.filter(NewsArticle.language == language)
    
    # Total articles (with filters)
    total = base_query.count()
    
    # Field statistics - check all relevant metadata fields
    fields_to_check = [
        "country_id", "title", "source",
        "content", "summary", "author", "url", 
        "sentiment_score", "sentiment_label", "sentiment_confidence",
        "topics", "relevance_score",
        "language", "word_count", 
        "original_language", "language_confidence",
        "was_translated", "translation_confidence",
        "published_at", "processed_at",
        "created_at", "updated_at"
    ]
    
    field_stats = []
    for field in fields_to_check:
        column = getattr(NewsArticle, field)
        null_count = base_query.filter(column == None).count()
        
        null_pct = (null_count / total * 100) if total > 0 else 0
        
        field_stats.append(FieldStats(
            field_name=field,
            total_count=total,
            null_count=null_count,
            null_percentage=round(null_pct, 2),
            non_null_percentage=round(100 - null_pct, 2)
        ))
    
    # Source breakdown (with language filter if provided)
    source_query = db.query(
        NewsArticle.source,
        func.count(NewsArticle.id).label("count"),
        func.sum(case((NewsArticle.content == None, 1), else_=0)).label("content_null"),
        func.sum(case((NewsArticle.summary == None, 1), else_=0)).label("summary_null")
    )
    if language:
        source_query = source_query.filter(NewsArticle.language == language)
    source_query = source_query.group_by(NewsArticle.source).all()
    
    source_stats = []
    for row in source_query:
        content_null_pct = (row.content_null / row.count * 100) if row.count > 0 else 0
        summary_null_pct = (row.summary_null / row.count * 100) if row.count > 0 else 0
        
        source_stats.append(SourceStats(
            source=row.source,
            count=row.count,
            content_null_pct=round(content_null_pct, 2),
            summary_null_pct=round(summary_null_pct, 2)
        ))
    
    # Language distribution (with source filter if provided)
    lang_query = db.query(
        NewsArticle.language,
        func.count(NewsArticle.id).label("count")
    ).filter(NewsArticle.language != None)
    if source:
        lang_query = lang_query.filter(NewsArticle.source == source)
    lang_query = lang_query.group_by(NewsArticle.language).all()
    
    language_dist = {row.language: row.count for row in lang_query}
    
    # Articles by country (with filters if provided)
    country_query = db.query(
        Country.name,
        Country.iso_code,
        func.count(NewsArticle.id).label("article_count")
    ).join(NewsArticle, NewsArticle.country_id == Country.id)
    if source:
        country_query = country_query.filter(NewsArticle.source == source)
    if language:
        country_query = country_query.filter(NewsArticle.language == language)
    country_query = country_query.group_by(Country.id, Country.name, Country.iso_code).all()
    
    country_stats = [
        {"country": row.name, "iso_code": row.iso_code, "count": row.article_count}
        for row in country_query
    ]
    
    return ScraperHealth(
        total_articles=total,
        field_stats=field_stats,
        source_breakdown=source_stats,
        language_distribution=language_dist,
        articles_by_country=country_stats
    )


@router.get("/sources")
def get_sources(db: Session = Depends(get_db)):
    """Get list of all sources with article counts"""
    sources = db.query(
        NewsArticle.source,
        func.count(NewsArticle.id).label("count")
    ).group_by(NewsArticle.source).order_by(func.count(NewsArticle.id).desc()).all()
    
    return [{"source": s.source, "count": s.count} for s in sources]


@router.get("/languages")
def get_languages(db: Session = Depends(get_db)):
    """Get list of all languages with article counts"""
    langs = db.query(
        NewsArticle.language,
        func.count(NewsArticle.id).label("count")
    ).filter(NewsArticle.language != None).group_by(NewsArticle.language).all()
    
    return [{"language": l.language, "count": l.count} for l in langs]


@router.get("/field-stats")
def get_field_stats(
    source: str = Query(None, description="Filter by source"),
    db: Session = Depends(get_db)
):
    """Get field statistics, optionally filtered by source"""
    query = db.query(NewsArticle)
    
    if source:
        query = query.filter(NewsArticle.source == source)
    
    total = query.count()
    
    fields = ["content", "summary", "author", "url", "sentiment_score", "topics"]
    stats = []
    
    for field in fields:
        column = getattr(NewsArticle, field)
        null_count = query.filter(column == None).count()
        
        stats.append({
            "field": field,
            "total": total,
            "null_count": null_count,
            "null_pct": round((null_count / total * 100) if total > 0 else 0, 2)
        })
    
    return {"source_filter": source, "stats": stats}


@router.get("/sources")
def get_sources(db: Session = Depends(get_db)):
    """Get list of all sources with article counts"""
    sources = db.query(
        NewsArticle.source,
        func.count(NewsArticle.id).label("count")
    ).group_by(NewsArticle.source).order_by(func.count(NewsArticle.id).desc()).all()
    
    return [{"source": s.source, "count": s.count} for s in sources]


@router.get("/languages")
def get_languages(db: Session = Depends(get_db)):
    """Get list of all languages with article counts"""
    langs = db.query(
        NewsArticle.language,
        func.count(NewsArticle.id).label("count")
    ).filter(NewsArticle.language != None).group_by(NewsArticle.language).all()
    
    return [{"language": l.language, "count": l.count} for l in langs]


@router.get("/dqs")
def get_dqs(
    source: str = Query(None, description="Filter by source"),
    language: str = Query(None, description="Filter by language"),
    db: Session = Depends(get_db)
):
    """
    Calculate Data Quality Score (DQS) based on 4 dimensions
    Returns: Completeness, Accuracy, Consistency, Relevance, Final DQS
    """
    # Build base query with filters
    base_query = db.query(NewsArticle)
    if source:
        base_query = base_query.filter(NewsArticle.source == source)
    if language:
        base_query = base_query.filter(NewsArticle.language == language)
    
    total = base_query.count()
    if total == 0:
        return {
            "completeness": 0,
            "accuracy": 0,
            "consistency": 0,
            "relevance": 0,
            "final_dqs": 0,
            "total_articles": 0
        }
    
    # 1. Completeness (C)
    critical_cols = ['content', 'sentiment_score', 'sentiment_label', 'sentiment_confidence']
    completeness_scores = []
    for col in critical_cols:
        column = getattr(NewsArticle, col)
        not_null_count = base_query.filter(column != None).count()
        completeness_scores.append(not_null_count / total)
    C = sum(completeness_scores) / len(completeness_scores)
    
    # 2. Accuracy (A)
    A = base_query.filter(NewsArticle.sentiment_confidence != None).with_entities(
        func.avg(NewsArticle.sentiment_confidence)
    ).scalar() or 0
    
    # 3. Consistency (S)
    valid_labels = {'positive', 'negative', 'neutral'}
    consistent_count = base_query.filter(
        NewsArticle.sentiment_label.in_(valid_labels)
    ).count()
    S = consistent_count / total
    
    # 4. Relevance (R)
    # Check if content has actual text (length > 0)
    relevant_count = base_query.filter(
        func.length(NewsArticle.content) > 0
    ).count()
    R = (relevant_count / total) * 0.5  # Weighted down
    
    # Weights
    w1, w2, w3, w4 = 0.30, 0.40, 0.15, 0.15
    
    # Final DQS
    dqs = (w1 * C) + (w2 * A) + (w3 * S) + (w4 * R)
    
    return {
        "completeness": round(C, 4),
        "accuracy": round(A, 4),
        "consistency": round(S, 4),
        "relevance": round(R, 4),
        "final_dqs": round(dqs, 4),
        "total_articles": total
    }
