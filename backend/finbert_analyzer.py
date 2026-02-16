"""
FinBERT Sentiment Analyzer for Kilwa Dashboard
Financial sentiment analysis using FinBERT model
"""
import logging
import time
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Check availability
TRANSFORMERS_AVAILABLE = False
try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
    logger.info("Transformers available for FinBERT")
except ImportError:
    logger.warning("Transformers not available. Install with: pip install transformers torch")


class FinBERTAnalyzer:
    """FinBERT-based sentiment analyzer for financial news"""

    def __init__(self, model_name: str = "ProsusAI/finbert"):
        self.model_name = model_name
        self.pipeline = None
        self.available = False

        if TRANSFORMERS_AVAILABLE:
            try:
                self.pipeline = pipeline(
                    "sentiment-analysis",
                    model=model_name,
                    tokenizer=model_name,
                    top_k=None  # Return all scores
                )
                self.available = True
                logger.info(f"FinBERT loaded: {model_name}")
            except Exception as e:
                logger.error(f"Failed to load FinBERT: {e}")

        # Label mapping (FinBERT uses LABEL_0, LABEL_1, LABEL_2)
        self.label_mapping = {
            'LABEL_0': 'negative',
            'LABEL_1': 'neutral',
            'LABEL_2': 'positive',
            'positive': 'positive',
            'negative': 'negative',
            'neutral': 'neutral'
        }

    def analyze_text(self, text: str, max_length: int = 512) -> Dict[str, Any]:
        """Analyze sentiment of text using FinBERT"""
        if not self.available:
            return self._unavailable_result()

        if not text or not text.strip():
            return self._default_result("Empty text")

        start_time = time.time()

        try:
            # Truncate if too long
            if len(text) > max_length * 4:
                text = text[:max_length * 4]

            results = self.pipeline(text, truncation=True, max_length=max_length)

            if not results or len(results) == 0:
                return self._default_result("No results")

            # Process results
            predictions = results[0] if isinstance(results[0], list) else results
            all_scores = {}
            max_score = 0
            predicted_label = 'neutral'

            for pred in predictions:
                label = self.label_mapping.get(pred['label'], pred['label'].lower())
                score = pred['score']
                all_scores[label] = float(score)

                if score > max_score:
                    max_score = score
                    predicted_label = label

            # Calculate sentiment score (-1 to +1)
            sentiment_score = (
                all_scores.get('positive', 0) * 1.0 +
                all_scores.get('negative', 0) * -1.0 +
                all_scores.get('neutral', 0) * 0.0
            )

            processing_time = int((time.time() - start_time) * 1000)

            return {
                "model": "finbert",
                "sentiment_score": round(sentiment_score, 4),
                "sentiment_label": predicted_label,
                "confidence": round(max_score, 4),
                "processing_time_ms": processing_time,
                "all_scores": all_scores
            }

        except Exception as e:
            logger.error(f"FinBERT analysis error: {e}")
            return self._default_result(str(e))

    def _default_result(self, error: str = None) -> Dict[str, Any]:
        """Return default result"""
        return {
            "model": "finbert",
            "sentiment_score": 0.0,
            "sentiment_label": "neutral",
            "confidence": 0.0,
            "processing_time_ms": 0,
            "all_scores": {"positive": 0.0, "negative": 0.0, "neutral": 1.0},
            "error": error
        }

    def _unavailable_result(self) -> Dict[str, Any]:
        """Return result when FinBERT unavailable"""
        return {
            "model": "finbert",
            "sentiment_score": 0.0,
            "sentiment_label": "neutral",
            "confidence": 0.0,
            "processing_time_ms": 0,
            "all_scores": {},
            "error": "FinBERT not available. Install transformers and torch."
        }


# Global instance (lazy load)
_finbert_instance = None

def get_finbert_analyzer() -> FinBERTAnalyzer:
    """Get or create FinBERT analyzer instance"""
    global _finbert_instance
    if _finbert_instance is None:
        _finbert_instance = FinBERTAnalyzer()
    return _finbert_instance
