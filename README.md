# Pulse - User Manual

## Table of Contents

1. [Project Overview](#project-overview)
2. [Installation Guide](#installation-guide)
3. [Configuration](#configuration)
4. [Starting the Services](#starting-the-services)
5. [Features](#features)
6. [API Reference](#api-reference)
7. [FAQ](#faq)

---

## Project Overview

Pulse is a web application for monitoring and evaluating the performance of Kilwa's data processing and analysis pipelines.

### Core Features

1. **Web Scraper Health Monitoring** - Monitor data scraping quality
2. **Sentiment Analysis Engine Evaluation** - Compare FinBERT, VADER, and TextBlob sentiment analysis models

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python FastAPI |
| Database | PostgreSQL |
| Frontend | Next.js 14 + React + Tailwind CSS |
| Charts | Recharts |
| ML Models | FinBERT, VADER, TextBlob |

### Models

| Model | Features | Speed |
|-------|----------|-------|
| VADER | Lexicon-based, good at social media text | Fastest (~0.1ms) |
| TextBlob | Naive Bayes-based, simple and fast | Fast (~0.2ms) |
| FinBERT | Financial domain fine-tuned BERT, most accurate | Slower (~36ms) |

---

## Installation Guide

### System Requirements

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the Project

```bash
cd ~/workspace
# Project is located in the kilwa-dashboard/ directory
```

### 2. Install Backend Dependencies

```bash
cd kilwa-dashboard/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**requirements.txt contents:**
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-multipart==0.0.6
textblob==0.17.1
vaderSentiment==3.3.2
langdetect==1.0.9
transformers>=4.30.0
torch>=2.0.0
pandas==2.0.3
numpy==1.26.4
loguru==0.7.2
```

### 3. Install Frontend Dependencies

```bash
cd kilwa-dashboard/frontend

# Install dependencies
npm install
```

### 4. Setup Database

```bash
# Create database
sudo -u postgres createdb kilwa_dashboard

# Create user (optional)
sudo -u postgres psql -c "CREATE USER kilwa_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kilwa_dashboard TO kilwa_user;"

# Import data
sudo -u postgres psql -d kilwa_dashboard -f ../data/kilwa_db_dump.sql
```

---

## Configuration

### Backend Configuration

Configuration file: `backend/database.py`

Create .env within the backend folder with the following variable:
```bash
DATABASE_URL="postgresql+psycopg2://{your_username}@localhost:5432/kilwa_db"
```

To find out what your_username is, type whoami in your terminal.

### Frontend Configuration

Configuration file: `frontend/.env.local` (to modify API address if needed)

```bash
# Default points to local Backend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://localhost/kilwa_dashboard` |
| `NEXT_PUBLIC_API_URL` | Backend API address | `http://localhost:8000` |

---

## Starting the Services

### Start Backend

```bash
cd kilwa-dashboard/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

Visit http://localhost:8000/docs to view API documentation

### Start Frontend

```bash
cd kilwa-dashboard/frontend
npm run dev
```

Visit http://localhost:3000 to view the Dashboard

### Start Both (Recommended: use tmux)

```bash
# Terminal 1 - Backend
cd kilwa-dashboard/backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend  
cd kilwa-dashboard/frontend && npm run dev
```

---

## API Reference

### Basic Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/health` | GET | Health check |
| `/docs` | GET | Swagger API documentation |

### Scraper API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scraper/health` | GET | Get data quality statistics |

**Response Example:**
```json
{
  "total_articles": 844,
  "field_stats": [
    {
      "field_name": "content",
      "total_count": 844,
      "null_count": 95,
      "null_percentage": 11.26,
      "non_null_percentage": 88.74
    }
  ]
}
```

### Sentiment API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sentiment/analyze` | POST | Analyze single text |
| `/api/sentiment/compare` | POST | Compare all models |
| `/api/sentiment/efficiency` | GET | Get efficiency metrics |
| `/api/sentiment/model-accuracy` | GET | Get model accuracy comparison |
| `/api/sentiment/translation-accuracy` | GET | Get translation impact analysis |
| `/api/sentiment/upload-test` | POST | Upload file for batch testing |
| `/api/sentiment/article/{id}` | GET | Analyze specific article |

**Example Request - Compare Models:**
```bash
curl -X POST http://localhost:8000/api/sentiment/compare \
  -H "Content-Type: application/json" \
  -d '{"text": "The stock market rallied today!", "models": ["vader", "textblob", "finbert"]}'
```

**Example Response:**
```json
{
  "text_preview": "The stock market rallied today!",
  "models": {
    "vader": {
      "score": 0.765,
      "label": "positive",
      "confidence": 0.602
    },
    "textblob": {
      "score": 0.433,
      "label": "positive",
      "confidence": 0.267
    },
    "finbert": {
      "score": 0.929,
      "label": "positive",
      "confidence": 0.95
    }
  },
  "label_agreement": true,
  "score_range": 0.496
}
```

---

## FAQ

### Q: Backend fails to start with database connection error

**A:** Check the following:
1. Is PostgreSQL service running: `sudo systemctl status postgresql`
2. Does database exist: `sudo -u postgres psql -l | grep kilwa_dashboard`
3. Is the connection string correct

### Q: FinBERT fails to load

**A:** FinBERT needs to download the model on first load (~500MB), ensure:
1. Network connection is working
2. Enough disk space available
3. `transformers` and `torch` are correctly installed

If FinBERT is unavailable, VADER and TextBlob will still work normally.

### Q: Frontend cannot connect to Backend

**A:** Check:
1. Is Backend running on port 8000
2. Is CORS configuration correct (default allows localhost:3000)
3. Check browser console for error messages

### Q: How to reset the database

**A:**
```bash
# Drop and recreate database
sudo -u postgres dropdb kilwa_dashboard
sudo -u postgres createdb kilwa_dashboard
sudo -u postgres psql -d kilwa_dashboard -f data/kilwa_db_dump.sql
```

### Q: How to update dependencies

**A:**
```bash
# Backend
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt

# Frontend
cd frontend
npm update
```

---

## Project Structure

```
kilwa-dashboard/
├── PROJECT.md          # Project progress documentation
├── MANUAL.md           # User manual (Chinese)
├── MANUAL_ENG.md       # User manual (English)
├── backend/
│   ├── main.py         # FastAPI entry point
│   ├── database.py     # Database connection
│   ├── models.py       # SQLAlchemy models
│   ├── sentiment_analyzer.py   # Sentiment analyzer
│   ├── finbert_analyzer.py     # FinBERT analyzer
│   ├── requirements.txt
│   ├── venv/           # Python virtual environment
│   └── routes/
│       ├── scraper.py  # Scraper API
│       └── sentiment.py # Sentiment API
├── frontend/
│   ├── src/
│   │   ├── app/        # Next.js App Router
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── scraper/        # Scraper page
│   │   │   └── sentiment/      # Sentiment page
│   │   ├── components/ # React components
│   │   └── lib/        # Utility functions
│   ├── package.json
│   └── node_modules/
└── data/
    └── kilwa_db_dump.sql  # Database backup
```

---

## Contact

For questions, please contact the project lead.

---

*Last updated: 2026-02-16*
