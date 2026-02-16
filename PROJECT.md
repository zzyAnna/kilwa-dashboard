# Kilwa Pipeline Dashboard

## 项目目标
创建一个 Dashboard，用于监控和评估 Kilwa 数据处理/分析管道的性能，让利益相关者无需手动运行代码即可查看指标。

## 核心功能

### 1. Web Scraper 健康监控
- **Metadata 完整性检查**：每个字段的空值/非空百分比
- **数据过滤**：按来源类型过滤（本地新闻 vs 研究报告等）
- **健康摘要**：AI 生成的 scraper 性能摘要（可选，时间允许再做）

### 2. Sentiment Analysis 引擎对比
- **效率指标**：FinBERT 处理每批文章的耗时
- **模型对比**：FinBERT vs VADER+TextBlob 的分数差异
- **语言翻译准确性**：原文 vs 翻译版的情感分数对比
- **手动上传测试**：用户上传自定义文章测试不同模型输出

## 技术栈

### Backend
- Python FastAPI
- PostgreSQL（基于 SQL dump）
- SQLAlchemy ORM
- FinBERT + VADER + TextBlob

### Frontend
- Next.js 14
- React
- Tailwind CSS
- Chart.js / Recharts（图表）

## 项目结构

```
kilwa-dashboard/
├── PROJECT.md              # 本文件：需求与进度记录
├── backend/                # FastAPI 后端
│   ├── main.py            # API 入口
│   ├── database.py        # 数据库连接
│   ├── models.py          # SQLAlchemy 模型
│   ├── requirements.txt   # Python 依赖
│   └── routes/
│       ├── scraper.py     # Scraper 相关 API
│       ├── sentiment.py   # Sentiment 相关 API
│       └── upload.py      # 文件上传 API
├── frontend/              # Next.js 前端
│   ├── app/               # App Router
│   ├── components/        # React 组件
│   ├── lib/               # 工具函数
│   └── package.json
└── data/                  # 数据文件
    └── kilwa_db_dump.sql  # 原始 SQL dump
```

## 开发进度

---

> ✅ **项目已完成**: Kilwa Pipeline Dashboard
>
> 所有 Phase 均已完成，服务运行于：
> - Backend: http://localhost:8000
> - Frontend: http://localhost:3000
>
> ---

### Phase 1: 数据分析 & 设计 ✅
- [x] 分析 SQL dump 结构
- [x] 设计数据库 schema
- [x] 确认文章表字段和 sentiment 表结构

### Phase 2: Backend 开发 ✅
- [x] 创建 FastAPI 项目骨架
- [x] 配置 PostgreSQL 数据库连接
- [x] 实现 SQLAlchemy models
- [x] 实现 Scraper metrics API
- [x] 实现 Sentiment analysis API
- [x] 实现文件上传 API
- [x] 集成 VADER / TextBlob
- [x] 集成 FinBERT
- [x] 设置数据库并导入数据
- [x] 测试 API（服务运行于 http://localhost:8000）

### Phase 3: Frontend 开发 ✅ 完成
- [x] 创建 Next.js 项目
- [x] 实现 Dashboard 布局
- [x] 实现 Scraper 监控页面
  - [x] 字段完整性表格
  - [x] 堆叠条形图
  - [x] 饼图（Health Distribution） ← **新增**
  - [x] 数据质量摘要卡片 ← **新增**
- [x] 实现 Sentiment 对比页面
  - [x] Manual Test Tab - 手动输入测试
  - [x] Upload Test - 文件上传批量测试 ← **新增**
  - [x] Efficiency Logs Tab - 处理时间对比
  - [x] Model Accuracy Tab - FinBERT vs 传统模型
    - [x] 散点图可视化 ← **新增**
  - [x] Translation Tab - 翻译准确性

### Phase 4: 测试 & 部署 ✅ 完成
- [x] 端到端 API 测试
  - Backend Health ✅
  - Scraper Health API ✅
  - Sentiment Compare API ✅
  - Efficiency API ✅
- [x] 前端页面测试
  - Dashboard 首页 ✅
  - Scraper 监控页 ✅
  - Sentiment 分析页 ✅
- [x] 本地部署验证 ✅

## 关键问题记录

### 已解决
- 项目位置：`workspace/kilwa-dashboard`
- 数据源：`kilwa_db_dump_20251110_201028.sql`
- 认证：不需要
- 数据库：基于 SQL dump 创建独立数据库
- SQL dump 中的表结构：已分析
- 现有 sentiment 代码的位置和接口：已分析

## 数据库结构

### news_articles 表
```sql
- id: integer (主键)
- country_id: integer (外键)
- title: text (标题)
- content: text (内容，可为NULL)
- summary: text (摘要，可为NULL)
- source: varchar(100) (来源)
- author: varchar(200) (作者，可为NULL)
- published_at: timestamp (发布时间)
- url: varchar(500) (链接，可为NULL)
- sentiment_score: double precision (情感分数)
- sentiment_label: varchar(20) (情感标签)
- sentiment_confidence: double precision (置信度)
- topics: json (主题)
- relevance_score: double precision (相关性)
- processed_at: timestamp (处理时间)
- language: varchar(10) (语言)
- word_count: integer (字数)
- created_at: timestamp
- updated_at: timestamp
- language_confidence: double precision
- was_translated: boolean (是否翻译过)
- original_language: varchar(10)
- translation_confidence: double precision
```

### countries 表
- id, name, iso_code

## 现有代码分析

### SentimentAnalyzer (VADER + TextBlob)
- 位置：`kilwa-backend-main/etl/transform/sentiment_analyzer.py`
- 功能：多语言情感分析，支持翻译
- 接口：`analyze_article(title, content)` → 返回 sentiment_score, sentiment_label, sentiment_confidence

### FinBERTAnalyzer
- 位置：`kilwa-backend-main/etl/transform/finbert_analyzer.py`
- 功能：基于 FinBERT 的金融情感分析
- 接口：`analyze_text(text)` → 返回 sentiment_score, sentiment_label, confidence

### HybridSentimentAnalyzer
- 结合 FinBERT 和传统方法
- 支持模式：hybrid, finbert_only, keywords_only

## 待确认
- 无

## 用户账号
- 大号: @outtadesworld (7976817486)
- 小号: @outtadesworld1 (8292628332)
- 进度更新同时发送到两个账号

## 错误日志

（开发过程中遇到的问题和解决方案会记录在这里）
