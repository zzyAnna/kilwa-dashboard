"""
Sentiment Analysis API Routes
Provides model comparison and testing endpoints with FinBERT support
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
import json
import logging
import time
import asyncio

from database import get_db
from models import NewsArticle
from sentiment_analyzer import analyzer

router = APIRouter(prefix="/api/sentiment", tags=["Sentiment Analysis"])
logger = logging.getLogger(__name__)


# ============ Request/Response Models ============

class TextAnalysisRequest(BaseModel):
    text: str
    models: List[str] = ["vader", "textblob", "finbert"]


class BatchAnalysisRequest(BaseModel):
    limit: int = 50
    include_finbert: bool = True


# ============ Core Endpoints ============

@router.post("/analyze")
def analyze_text(request: TextAnalysisRequest):
    """
    Analyze sentiment of custom text using specified models
    """
    results = {}
    text = request.text

    # VADER
    if "vader" in request.models:
        vader_result = analyzer.analyze_text(text, "vader")
        results["vader"] = vader_result

    # TextBlob
    if "textblob" in request.models:
        tb_result = analyzer.analyze_text(text, "textblob")
        results["textblob"] = tb_result

    # FinBERT
    if "finbert" in request.models:
        fb_result = analyzer.analyze_text(text, "finbert")
        results["finbert"] = fb_result

    return {
        "text_preview": text[:100] + "..." if len(text) > 100 else text,
        "results": results
    }


@router.post("/compare")
def compare_all_models(request: TextAnalysisRequest):
    """
    Compare VADER, TextBlob, and FinBERT on same text
    Returns detailed comparison with score differences
    """
    comparison = analyzer.compare_models(request.text)
    return comparison


# ============ Efficiency Metrics ============

@router.get("/efficiency")
def get_efficiency_metrics(
    batch_size: int = 20,
    db: Session = Depends(get_db)
):
    """
    **Efficiency Logs** - Processing time for each model
    
    Returns processing time for VADER, TextBlob, and FinBERT
    on a batch of articles.
    """
    articles = db.query(NewsArticle).limit(batch_size).all()
    
    if not articles:
        return {"error": "No articles found"}
    
    texts = []
    for a in articles:
        text = f"{a.title}. {a.content}" if a.content else a.title
        texts.append(text)
    
    results = {
        "batch_size": len(texts),
        "models": {}
    }
    
    # Test VADER efficiency
    start = time.time()
    for text in texts:
        analyzer.analyze_text(text, "vader")
    vader_time = time.time() - start
    results["models"]["vader"] = {
        "total_time_seconds": round(vader_time, 3),
        "avg_time_ms": round((vader_time / len(texts)) * 1000, 2),
        "articles_per_second": round(len(texts) / vader_time, 2) if vader_time > 0 else 0
    }
    
    # Test TextBlob efficiency
    start = time.time()
    for text in texts:
        analyzer.analyze_text(text, "textblob")
    textblob_time = time.time() - start
    results["models"]["textblob"] = {
        "total_time_seconds": round(textblob_time, 3),
        "avg_time_ms": round((textblob_time / len(texts)) * 1000, 2),
        "articles_per_second": round(len(texts) / textblob_time, 2) if textblob_time > 0 else 0
    }
    
    # Test FinBERT efficiency (if available)
    if analyzer.finbert and analyzer.finbert.available:
        start = time.time()
        finbert_times = []
        for text in texts:
            fb_result = analyzer.analyze_text(text, "finbert")
            finbert_times.append(fb_result.get("processing_time_ms", 0))
        finbert_time = time.time() - start
        
        results["models"]["finbert"] = {
            "total_time_seconds": round(finbert_time, 3),
            "avg_time_ms": round(sum(finbert_times) / len(finbert_times), 2),
            "articles_per_second": round(len(texts) / finbert_time, 2) if finbert_time > 0 else 0,
            "available": True
        }
    else:
        results["models"]["finbert"] = {
            "available": False,
            "message": "FinBERT not loaded. Install transformers and torch."
        }
    
    # Summary
    results["summary"] = {
        "fastest_model": min(
            ["vader", "textblob"],
            key=lambda m: results["models"].get(m, {}).get("total_time_seconds", float("inf"))
        ),
        "vader_vs_finbert_ratio": round(
            vader_time / results["models"]["finbert"]["total_time_seconds"], 2
        ) if results["models"].get("finbert", {}).get("available") else None
    }
    
    return results


# ============ Model Accuracy Comparison ============

@router.get("/model-accuracy")
def get_model_accuracy_comparison(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    **Alternate Model Accuracy** - Compare FinBERT vs VADER+TextBlob
    
    Analyzes average difference and deviation between models.
    """
    articles = db.query(NewsArticle).limit(limit).all()
    
    comparisons = []
    finbert_scores = []
    traditional_scores = []
    differences = []
    
    finbert_available = analyzer.finbert and analyzer.finbert.available
    
    for article in articles:
        text = f"{article.title}. {article.content}" if article.content else article.title
        
        # Traditional (average of VADER + TextBlob)
        vader = analyzer.analyze_text(text, "vader")
        textblob = analyzer.analyze_text(text, "textblob")
        traditional_score = (vader["sentiment_score"] + textblob["sentiment_score"]) / 2
        
        comparison = {
            "article_id": article.id,
            "title": article.title[:60] + "..." if len(article.title) > 60 else article.title,
            "traditional_score": round(traditional_score, 4),
            "vader_score": round(vader["sentiment_score"], 4),
            "textblob_score": round(textblob["sentiment_score"], 4),
            "stored_score": article.sentiment_score
        }
        
        # FinBERT if available
        if finbert_available:
            finbert = analyzer.analyze_text(text, "finbert")
            finbert_score = finbert["sentiment_score"]
            comparison["finbert_score"] = round(finbert_score, 4)
            comparison["finbert_vs_traditional"] = round(finbert_score - traditional_score, 4)
            
            finbert_scores.append(finbert_score)
            traditional_scores.append(traditional_score)
            differences.append(abs(finbert_score - traditional_score))
        
        comparisons.append(comparison)
    
    # Calculate metrics
    result = {
        "total_analyzed": len(comparisons),
        "comparisons": comparisons,  # Return all comparisons
    }
    
    if finbert_available and finbert_scores:
        avg_diff = sum(differences) / len(differences)
        avg_finbert = sum(finbert_scores) / len(finbert_scores)
        avg_traditional = sum(traditional_scores) / len(traditional_scores)
        
        # Bias: positive means FinBERT tends to score higher
        bias = avg_finbert - avg_traditional
        
        # Standard deviation
        import statistics
        std_dev = statistics.stdev(differences) if len(differences) > 1 else 0
        
        result["metrics"] = {
            "finbert_available": True,
            "average_difference": round(avg_diff, 4),
            "average_finbert_score": round(avg_finbert, 4),
            "average_traditional_score": round(avg_traditional, 4),
            "finbert_bias": round(bias, 4),  # positive = FinBERT overscores
            "standard_deviation": round(std_dev, 4),
            "interpretation": (
                f"FinBERT scores {'higher' if bias > 0 else 'lower'} than the traditional model "
                f"by an average of {abs(bias):.3f}"
            )
        }
    else:
        result["metrics"] = {
            "finbert_available": False,
            "message": "FinBERT not available. Install transformers and torch."
        }
    
    return result


# ============ Translation Accuracy ============

@router.get("/translation-accuracy")
def get_translation_accuracy(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    **Language Sentiment Distribution** - Sentiment distribution by language
    """
    # Get language distribution
    language_stats = db.query(
        NewsArticle.language,
        NewsArticle.was_translated,
        func.count(NewsArticle.id).label("count"),
        func.avg(NewsArticle.sentiment_score).label("avg_sentiment")
    ).filter(
        NewsArticle.language != None
    ).group_by(
        NewsArticle.language, NewsArticle.was_translated
    ).all()
    
    # Organize by language
    languages = {}
    for row in language_stats:
        lang = row.language or "unknown"
        if lang not in languages:
            languages[lang] = {
                "code": lang,
                "translated": {"count": 0, "avg_sentiment": None},
                "original": {"count": 0, "avg_sentiment": None}
            }
        
        key = "translated" if row.was_translated else "original"
        languages[lang][key] = {
            "count": row.count,
            "avg_sentiment": round(row.avg_sentiment, 4) if row.avg_sentiment else None
        }
    
    # Get sentiment label distribution BY LANGUAGE
    lang_label_dist = db.query(
        NewsArticle.language,
        NewsArticle.sentiment_label,
        func.count(NewsArticle.id).label("count")
    ).filter(
        NewsArticle.language != None,
        NewsArticle.sentiment_label != None
    ).group_by(
        NewsArticle.language, NewsArticle.sentiment_label
    ).all()
    
    # Organize sentiment by language
    language_sentiment = {}
    for row in lang_label_dist:
        lang = row.language or "unknown"
        label = row.sentiment_label or "unknown"
        if lang not in language_sentiment:
            language_sentiment[lang] = {"positive": 0, "negative": 0, "neutral": 0, "irrelevant": 0}
        language_sentiment[lang][label] = row.count
    
    # Get translated vs original counts
    translated_count = db.query(NewsArticle).filter(NewsArticle.was_translated == True).count()
    original_count = db.query(NewsArticle).filter(
        (NewsArticle.was_translated == False) | (NewsArticle.was_translated == None)
    ).count()
    
    # Get overall sentiment label distribution
    label_dist = db.query(
        NewsArticle.sentiment_label,
        func.count(NewsArticle.id).label("count")
    ).filter(
        NewsArticle.sentiment_label != None
    ).group_by(
        NewsArticle.sentiment_label
    ).all()
    
    label_distribution = {"translated": {}, "original": {}}
    for row in label_dist:
        label = row.sentiment_label or "unknown"
        label_distribution["original"][label] = row.count
    
    return {
        "summary": {
            "translated_count": translated_count,
            "original_count": original_count,
            "languages_count": len(languages)
        },
        "languages": list(languages.values()),
        "language_sentiment": language_sentiment,
        "label_distribution": label_distribution
    }


# ============ Manual Upload Test ============

@router.post("/upload-test")
async def upload_and_test(
    file: UploadFile = File(...),
    models: str = "all"
):
    """
    **Manual Article Upload** - Test custom article with all models
    
    Upload a text file or JSON to test FinBERT vs traditional model.
    """
    content = await file.read()
    
    # Parse input
    try:
        data = json.loads(content)
        if isinstance(data, list):
            texts = data
        elif isinstance(data, dict):
            if "text" in data:
                texts = [data["text"]]
            elif "texts" in data:
                texts = data["texts"]
            elif "articles" in data:
                texts = data["articles"]
            else:
                texts = [str(data)]
        else:
            texts = [str(data)]
    except json.JSONDecodeError:
        # Plain text - split by double newline or use whole content
        text_content = content.decode("utf-8")
        if "\n\n" in text_content:
            texts = text_content.split("\n\n")
        else:
            texts = [text_content]
    
    # Analyze each text
    results = []
    for text in texts:
        if isinstance(text, dict):
            text = text.get("text", text.get("content", str(text)))
        
        comparison = analyzer.compare_models(text)
        results.append({
            "text_preview": text[:150] + "..." if len(text) > 150 else text,
            "analysis": comparison
        })
    
    # Summary statistics
    all_scores = {
        "vader": [],
        "textblob": [],
        "finbert": []
    }
    
    for r in results:
        for model in all_scores:
            score = r["analysis"].get("models", {}).get(model, {}).get("score")
            if score is not None:
                all_scores[model].append(score)
    
    summary = {}
    for model, scores in all_scores.items():
        if scores:
            summary[model] = {
                "avg_score": round(sum(scores) / len(scores), 4),
                "min": round(min(scores), 4),
                "max": round(max(scores), 4),
                "count": len(scores)
            }
    
    return {
        "filename": file.filename,
        "items_analyzed": len(results),
        "results": results,
        "summary": summary
    }


# ============ Article Analysis ============

@router.get("/article/{article_id}")
def analyze_single_article(article_id: int, db: Session = Depends(get_db)):
    """Analyze a specific article from the database"""
    article = db.query(NewsArticle).filter(NewsArticle.id == article_id).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    text = f"{article.title}. {article.content}" if article.content else article.title
    comparison = analyzer.compare_models(text)
    
    return {
        "article_id": article_id,
        "title": article.title,
        "source": article.source,
        "language": article.language,
        "was_translated": article.was_translated,
        "stored_sentiment": {
            "score": article.sentiment_score,
            "label": article.sentiment_label,
            "confidence": article.sentiment_confidence
        },
        "current_analysis": comparison
    }


# ============ Sentiment Trend by Date ============

@router.get("/sentiment-trend")
def get_sentiment_trend(
    language: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    **Sentiment Trend by Date** - Sentiment label frequencies over time
    Optional language filter
    """
    from sqlalchemy import cast, Date
    
    # Get counts by date and sentiment label
    query = db.query(
        cast(NewsArticle.published_at, Date).label("date"),
        NewsArticle.sentiment_label,
        func.count(NewsArticle.id).label("count")
    ).filter(
        NewsArticle.published_at != None,
        NewsArticle.sentiment_label != None
    )
    
    if language:
        query = query.filter(NewsArticle.language == language)
    
    results = query.group_by(
        cast(NewsArticle.published_at, Date),
        NewsArticle.sentiment_label
    ).order_by(
        cast(NewsArticle.published_at, Date)
    ).all()
    
    # Aggregate by date
    date_data: dict = {}
    for row in results:
        date_str = row.date.isoformat() if row.date else None
        if date_str not in date_data:
            date_data[date_str] = {"date": date_str, "positive": 0, "negative": 0, "neutral": 0}
        
        label = (row.sentiment_label or "").lower()
        if label in ["positive", "negative", "neutral"]:
            date_data[date_str][label] = row.count
    
    trend_data = list(date_data.values())
    
    # Get available languages for selector
    languages = db.query(
        NewsArticle.language
    ).filter(
        NewsArticle.language != None
    ).distinct().all()
    
    available_languages = [lang[0] for lang in languages if lang[0]]
    
    return {
        "trend": trend_data,
        "available_languages": available_languages,
        "filtered_language": language
    }
