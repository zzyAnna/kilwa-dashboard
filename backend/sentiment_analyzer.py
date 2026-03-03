"""
Sentiment Analyzer for Kilwa Dashboard
Combines VADER, TextBlob, and FinBERT for sentiment analysis
"""
import time
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

# TextBlob
try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False
    logger.warning("TextBlob not available")

# VADER
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    VADER_AVAILABLE = True
except ImportError:
    VADER_AVAILABLE = False
    logger.warning("VADER not available")


class SentimentAnalyzer:
    """Analyze sentiment using VADER, TextBlob, and optionally FinBERT"""

    def __init__(self, enable_finbert: bool = True):
        self.vader = SentimentIntensityAnalyzer() if VADER_AVAILABLE else None
        self._finbert = None
        self._enable_finbert = enable_finbert

        logger.info(f"SentimentAnalyzer initialized. VADER: {VADER_AVAILABLE}, TextBlob: {TEXTBLOB_AVAILABLE}")

    @property
    def finbert(self):
        """Lazy load FinBERT"""
        if self._finbert is None and self._enable_finbert:
            try:
                from finbert_analyzer import get_finbert_analyzer
                self._finbert = get_finbert_analyzer()
            except Exception as e:
                logger.warning(f"FinBERT not available: {e}")
                self._enable_finbert = False
        return self._finbert

    def analyze_text(self, text: str, model: str = "combined") -> Dict[str, Any]:
        """
        Analyze sentiment of text
        
        Args:
            text: Text to analyze
            model: 'vader', 'textblob', 'finbert', or 'combined'
        
        Returns:
            Dictionary with sentiment results
        """
        if not text or not text.strip():
            return self._default_result("Empty text")

        start_time = time.time()
        results = {}

        # VADER
        if model in ["vader", "combined"] and self.vader:
            results["vader"] = self._analyze_vader(text)

        # TextBlob
        if model in ["textblob", "combined"] and TEXTBLOB_AVAILABLE:
            results["textblob"] = self._analyze_textblob(text)

        # FinBERT
        if model in ["finbert", "combined"] and self.finbert and self.finbert.available:
            results["finbert"] = self.finbert.analyze_text(text)

        # Combine or return single result
        if model == "combined" and len(results) > 1:
            combined = self._combine_results(results)
        elif results:
            combined = list(results.values())[0]
        else:
            combined = self._default_result("No analyzers available")

        processing_time = int((time.time() - start_time) * 1000)
        combined["processing_time_ms"] = processing_time
        combined["detailed_scores"] = results

        return combined

    def _analyze_vader(self, text: str) -> Dict[str, Any]:
        """Analyze using VADER"""
        scores = self.vader.polarity_scores(text)

        label = "neutral"
        if scores["compound"] >= 0.05:
            label = "positive"
        elif scores["compound"] <= -0.05:
            label = "negative"

        return {
            "model": "vader",
            "sentiment_score": scores["compound"],
            "sentiment_label": label,
            "confidence": max(scores["pos"], scores["neg"], scores["neu"]),
            "positive_score": scores["pos"],
            "negative_score": scores["neg"],
            "neutral_score": scores["neu"]
        }

    def _analyze_textblob(self, text: str) -> Dict[str, Any]:
        """Analyze using TextBlob"""
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity

        label = "neutral"
        if polarity > 0.1:
            label = "positive"
        elif polarity < -0.1:
            label = "negative"

        return {
            "model": "textblob",
            "sentiment_score": polarity,
            "sentiment_label": label,
            "confidence": 1.0 - subjectivity,
            "subjectivity": subjectivity
        }

    def _combine_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Combine multiple analyzer results"""
        scores = [r["sentiment_score"] for r in results.values() if "sentiment_score" in r]
        confidences = [r["confidence"] for r in results.values() if "confidence" in r]

        if not scores:
            return self._default_result("No valid scores")

        # Weighted average by confidence
        if confidences and sum(confidences) > 0:
            combined_score = sum(s * c for s, c in zip(scores, confidences)) / sum(confidences)
            combined_conf = sum(confidences) / len(confidences)
        else:
            combined_score = sum(scores) / len(scores)
            combined_conf = 0.5

        label = "neutral"
        if combined_score > 0.1:
            label = "positive"
        elif combined_score < -0.1:
            label = "negative"

        return {
            "model": "combined",
            "sentiment_score": round(combined_score, 4),
            "sentiment_label": label,
            "confidence": round(combined_conf, 4)
        }

    def _default_result(self, error: str = None) -> Dict[str, Any]:
        """Return default result for error cases"""
        return {
            "model": "none",
            "sentiment_score": 0.0,
            "sentiment_label": "neutral",
            "confidence": 0.0,
            "error": error
        }

    def compare_models(self, text: str) -> Dict[str, Any]:
        """
        Compare all models on same text
        Returns individual results and comparison metrics
        """
        results = {
            "text_preview": text[:100] + "..." if len(text) > 100 else text,
            "models": {}
        }

        # VADER
        if self.vader:
            vader = self._analyze_vader(text)
            results["models"]["vader"] = {
                "score": vader["sentiment_score"],
                "label": vader["sentiment_label"],
                "confidence": vader["confidence"],
                "positive": vader["positive_score"],
                "negative": vader["negative_score"],
                "neutral": vader["neutral_score"]
            }

        # TextBlob
        if TEXTBLOB_AVAILABLE:
            tb = self._analyze_textblob(text)
            results["models"]["textblob"] = {
                "score": tb["sentiment_score"],
                "label": tb["sentiment_label"],
                "confidence": tb["confidence"],
                "subjectivity": tb["subjectivity"]
            }

        # FinBERT
        if self.finbert and self.finbert.available:
            fb = self.finbert.analyze_text(text)
            results["models"]["finbert"] = {
                "score": fb["sentiment_score"],
                "label": fb["sentiment_label"],
                "confidence": fb["confidence"],
                "processing_time_ms": fb.get("processing_time_ms", 0)
            }

        # Calculate differences
        scores = [m["score"] for m in results["models"].values()]
        if len(scores) >= 2:
            results["score_range"] = max(scores) - min(scores)
            results["average_score"] = sum(scores) / len(scores)

        # Check label agreement
        labels = [m["label"] for m in results["models"].values()]
        results["label_agreement"] = len(set(labels)) == 1
        results["labels"] = labels

        return results


# Global instance
analyzer = SentimentAnalyzer()
