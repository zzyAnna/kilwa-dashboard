## Pulse Dashboard Features

### 1. Dashboard Home

**URL:** http://localhost:3000

**Functions:**
- Display high-level takeaways
- Display system overview statistics
- Quick navigation to feature modules
- Display backend service status

**Statistics Cards:**
| Card | Description |
|------|-------------|
| Total Articles | Total number of articles in database |
| Fields Monitored | Number of monitored fields |
| Sentiment Models | Number of available sentiment analysis models |
| Backend Status | API service status |

---

### 2. Scraper Monitor (Data Quality Monitoring)

**URL:** http://localhost:3000/scraper

**Functions:** Monitor the quality and completeness of data scraped by Web Scraper

#### 2.1 DQS

| Bucket | Description |
|--------|-------------|
| Completeness | Measures presence of data in core fields: content, sentiment_score, sentiment_label, sentiment_confidence |
| Accuracy | Derived from model confidence levels. Uses mean sentiment_confidence as a proxy for accuracy |
| Consistency | Checks if sentiment label follows expected categories: Positive, Negative, Neutral, Irrelevant |
| Relevance | Determines if data is useful for analysis. Penalized due to missing relevance_score and word_count metadata |

Overal DQS = 0.30xCompleteness + 0.40xAccuracy + 0.15xConsistency + 0.15xRelevance

#### 2.2 Statistics Cards

| Metric | Description |
|--------|-------------|
| Total Articles | Total number of articles in database |
| Fields Monitored | Number of fields being monitored |
| Healthy Fields | Number of fields with completeness > 90% |
| Critical Fields | Number of fields with completeness < 50% |

#### 2.3 Metadata Field Completeness Table

Shows for each field:
- **Total** - Total number of records
- **Filled** - Number of non-null records
- **Empty** - Number of null values and percentage
- **Status** - Health status (Healthy/Warning/Critical)

**Status Criteria:**
| Status | Condition | Color |
|--------|-----------|-------|
| Healthy | Completeness ≥ 90% | 🟢 Green |
| Warning | Completeness 50-90% | 🟡 Yellow |
| Critical | Completeness < 50% | 🔴 Red |

#### 2.4 Charts

- **Metadata Field Completeness Stacked Bar Chart** - Shows filled/empty ratio for each field
- **Metadata Field Health Distribution Pie Chart** - Shows Healthy/Warning/Critical field distribution
- **Metadata Field Health Summary Card** - Shows average completeness

---

### 3. Sentiment Analysis

**URL:** http://localhost:3000/sentiment

**Functions:** Compare performance and results of three sentiment analysis models

#### 3.1 Model Accuracy

**Purpose:** Compare score differences between FinBERT and traditional models (VADER + TextBlob)

**Statistical Metrics:**

| Metric | Description |
|--------|-------------|
| Articles Analyzed | Number of articles in sentiment analysis sample |
| Avg Difference | Average score difference between FinBERT and traditional models |
| FinBERT Bias | FinBERT's tendency (positive = tends to give higher scores) |
| Std Deviation | Standard deviation of differences (higher = more unstable) |

**Scatter Plot:**
- X-axis: Traditional Score (VADER + TextBlob average)
- Y-axis: FinBERT Score
- Color coding:
  - 🟢 Green: Difference < 0.1 (models agree)
  - 🟡 Yellow: Difference 0.1-0.3 (moderate difference)
  - 🔴 Red: Difference > 0.3 (large difference)

#### 3.2 Efficiency Logs

**Purpose:** Compare processing speed of three models

**Metrics:**

| Metric | Description |
|--------|-------------|
| Total Time | Total time to process a batch of articles |
| Avg per Article | Average processing time per article |
| Articles/sec | Number of articles processed per second |

**Operation:**
- Test runs automatically when page loads
- Click **Re-run Test** to test again

#### 3.3 Translation

**Purpose:** Compare sentiment analysis differences between original and translated articles

| Card | Description |
|--------|-------------|
| Total articles | Number of articles |
| Languages | Total number of languages represented |
| Most Common Language | Most common language represented |

##### 3.3.1 Charts

- **Language Distribution Pie Chart** - Shows distribution of language frequencies
- **Sentiment Trend Over Time** - Shows trend of positive, neutral, and negative sentiment over time, with filters by language


##### 3.3.2 Sentiment Statistics by Language

| Column | Description |
|--------|-------------|
| Article Count | Number of articles in a particular language |
| Percentage | Percentage of articles in a particular language |
| Avg. Sentiment Score | Average sentiment score of articles in a particular language |

#### 3.4 Manual Test

**Purpose:** Input any text to compare sentiment analysis results from three models in real-time

##### 3.4.1 Text Input

**How to Use:**
1. Enter or paste article content in the text box
2. Click the **Analyze** button
3. View comparison results from three models

**Result Explanation:**

| Field | Description |
|-------|-------------|
| Score | Sentiment score (-1 to +1, negative = negative sentiment, positive = positive sentiment) |
| Label | Sentiment label (positive/negative/neutral) |
| Confidence | Model confidence (0-1) |

##### 3.4.1 File Upload

**Purpose:** Batch test multiple articles

**Supported File Formats:**

**TXT file:**
```
Article content 1

Article content 2

Article content 3
```
(Separate each article with a blank line)

**JSON file:**
```json
{
  "texts": [
    "Article content 1",
    "Article content 2",
    "Article content 3"
  ]
}
```

Or simple array:
```json
["Article 1", "Article 2", "Article 3"]
```

**How to Use:**
1. Click the upload area or drag and drop a file
2. The system automatically analyzes and displays results
3. View summary statistics and detailed results for each article