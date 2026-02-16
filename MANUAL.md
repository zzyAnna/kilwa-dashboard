# Kilwa Pipeline Dashboard - User Manual

## 目录

1. [项目概述](#项目概述)
2. [安装指南](#安装指南)
3. [配置说明](#配置说明)
4. [启动服务](#启动服务)
5. [功能说明](#功能说明)
6. [API 参考](#api-参考)
7. [常见问题](#常见问题)

---

## 项目概述

Kilwa Pipeline Dashboard 是一个用于监控和评估 Kilwa 数据处理/分析管道性能的 Web 应用。

### 核心功能

1. **Web Scraper 健康监控** - 监控数据抓取质量
2. **Sentiment Analysis 引擎对比** - 比较 FinBERT、VADER、TextBlob 三种情感分析模型

### 技术栈

| 层级 | 技术 |
|------|------|
| Backend | Python FastAPI |
| Database | PostgreSQL |
| Frontend | Next.js 14 + React + Tailwind CSS |
| Charts | Recharts |
| ML Models | FinBERT, VADER, TextBlob |

---

## 安装指南

### 系统要求

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 1. 克隆项目

```bash
cd ~/.openclaw/workspace
# 项目位于 kilwa-dashboard/ 目录
```

### 2. 安装 Backend 依赖

```bash
cd kilwa-dashboard/backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

**requirements.txt 内容：**
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

### 3. 安装 Frontend 依赖

```bash
cd kilwa-dashboard/frontend

# 安装依赖
npm install
```

### 4. 设置数据库

```bash
# 创建数据库
sudo -u postgres createdb kilwa_dashboard

# 创建用户（可选）
sudo -u postgres psql -c "CREATE USER kilwa_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kilwa_dashboard TO kilwa_user;"

# 导入数据
sudo -u postgres psql -d kilwa_dashboard -f ../data/kilwa_db_dump.sql
```

---

## 配置说明

### Backend 配置

配置文件：`backend/database.py`

```python
# 默认配置（本地开发）
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/kilwa_dashboard"

# 或使用环境变量
import os
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/kilwa_dashboard")
```

### Frontend 配置

配置文件：`frontend/.env.local`（如需修改 API 地址）

```bash
# 默认指向本地 Backend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://localhost/kilwa_dashboard` |
| `NEXT_PUBLIC_API_URL` | Backend API 地址 | `http://localhost:8000` |

---

## 启动服务

### 启动 Backend

```bash
cd kilwa-dashboard/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

访问 http://localhost:8000/docs 查看 API 文档

### 启动 Frontend

```bash
cd kilwa-dashboard/frontend
npm run dev
```

访问 http://localhost:3000 查看 Dashboard

### 同时启动（推荐使用 tmux）

```bash
# 终端 1 - Backend
cd kilwa-dashboard/backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000

# 终端 2 - Frontend  
cd kilwa-dashboard/frontend && npm run dev
```

---

## 功能说明

### 1. Dashboard 首页

**访问地址：** http://localhost:3000

**功能：**
- 显示系统概览统计
- 快速导航到各功能模块
- 显示后端服务状态

**统计卡片：**
| 卡片 | 说明 |
|------|------|
| Total Articles | 数据库中的文章总数 |
| Fields Monitored | 监控的字段数量 |
| Sentiment Models | 可用的情感分析模型数量 |
| Backend Status | API 服务状态 |

---

### 2. Scraper Monitor（数据质量监控）

**访问地址：** http://localhost:3000/scraper

**功能：** 监控 Web Scraper 抓取数据的质量和完整性

#### 2.1 统计卡片

| 指标 | 说明 |
|------|------|
| Total Articles | 数据库中的文章总数 |
| Fields Monitored | 正在监控的字段数量 |
| Healthy Fields (>90%) | 完整度超过 90% 的字段数 |
| Critical Fields | 完整度低于 50% 的字段数 |

#### 2.2 字段完整性表格

显示每个字段的：
- **Total** - 总记录数
- **Filled** - 非空记录数
- **Empty** - 空值数量和百分比
- **Status** - 健康状态（Healthy/Warning/Critical）

**状态判定标准：**
| 状态 | 条件 | 颜色 |
|------|------|------|
| Healthy | 完整度 ≥ 90% | 🟢 绿色 |
| Warning | 完整度 50-90% | 🟡 黄色 |
| Critical | 完整度 < 50% | 🔴 红色 |

#### 2.3 图表

- **堆叠条形图** - 显示每个字段的填充/空值比例
- **饼图** - 显示 Healthy/Warning/Critical 字段分布
- **摘要卡片** - 显示平均完整度

---

### 3. Sentiment Analysis（情感分析）

**访问地址：** http://localhost:3000/sentiment

**功能：** 比较三种情感分析模型的性能和结果

#### 3.1 Manual Test（手动测试）

**用途：** 输入任意文本，实时比较三种模型的情感分析结果

**使用方法：**
1. 在文本框中输入或粘贴文章内容
2. 点击 **Analyze** 按钮
3. 查看三个模型的对比结果

**结果说明：**

| 字段 | 说明 |
|------|------|
| Score | 情感分数（-1 到 +1，负数=负面，正数=正面） |
| Label | 情感标签（positive/negative/neutral） |
| Confidence | 模型置信度（0-1） |

**模型特点：**
| 模型 | 特点 | 速度 |
|------|------|------|
| VADER | 基于词典，擅长社交媒体文本 | 最快 (~0.1ms) |
| TextBlob | 基于朴素贝叶斯，简单快速 | 快 (~0.2ms) |
| FinBERT | 金融领域微调的 BERT，最准确 | 较慢 (~36ms) |

#### 3.2 File Upload（文件上传）

**用途：** 批量测试多篇文章

**支持的文件格式：**

**TXT 文件：**
```
文章内容1

文章内容2

文章内容3
```
（每篇文章用空行分隔）

**JSON 文件：**
```json
{
  "texts": [
    "文章内容1",
    "文章内容2",
    "文章内容3"
  ]
}
```

或简单数组：
```json
["文章1", "文章2", "文章3"]
```

**使用方法：**
1. 点击上传区域或拖拽文件
2. 系统自动分析并显示结果
3. 查看汇总统计和每篇文章的详细结果

#### 3.3 Efficiency Logs（效率日志）

**用途：** 对比三种模型的处理速度

**指标说明：**

| 指标 | 说明 |
|------|------|
| Total Time | 处理一批文章的总时间 |
| Avg per Article | 平均每篇文章的处理时间 |
| Articles/sec | 每秒能处理的文章数量 |

**操作：**
- 页面加载时自动运行一次测试
- 点击 **Re-run Test** 重新测试

#### 3.4 Model Accuracy（模型准确性）

**用途：** 对比 FinBERT 与传统模型（VADER + TextBlob）的分数差异

**统计指标：**

| 指标 | 说明 |
|------|------|
| Avg Difference | FinBERT 与传统模型的平均分数差异 |
| FinBERT Bias | FinBERT 的偏向性（正数=倾向于给更高分） |
| Std Deviation | 差异的标准差（越大表示越不稳定） |

**散点图：**
- X 轴：Traditional Score（VADER + TextBlob 平均）
- Y 轴：FinBERT Score
- 颜色编码：
  - 🟢 绿色：差异 < 0.1（模型一致）
  - 🟡 黄色：差异 0.1-0.3（中等差异）
  - 🔴 红色：差异 > 0.3（差异较大）

#### 3.5 Translation（翻译准确性）

**用途：** 比较原文与翻译后文章的情感分析差异

**要求：** 数据库中需要有 `was_translated = true` 的文章

---

## API 参考

### 基础端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/` | GET | API 信息 |
| `/health` | GET | 健康检查 |
| `/docs` | GET | Swagger API 文档 |

### Scraper API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/scraper/health` | GET | 获取数据质量统计 |

**响应示例：**
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

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sentiment/analyze` | POST | 分析单条文本 |
| `/api/sentiment/compare` | POST | 对比所有模型 |
| `/api/sentiment/efficiency` | GET | 获取效率指标 |
| `/api/sentiment/model-accuracy` | GET | 获取模型准确性对比 |
| `/api/sentiment/translation-accuracy` | GET | 获取翻译影响分析 |
| `/api/sentiment/upload-test` | POST | 上传文件批量测试 |
| `/api/sentiment/article/{id}` | GET | 分析指定文章 |

**示例请求 - 对比模型：**
```bash
curl -X POST http://localhost:8000/api/sentiment/compare \
  -H "Content-Type: application/json" \
  -d '{"text": "The stock market rallied today!", "models": ["vader", "textblob", "finbert"]}'
```

**示例响应：**
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

## 常见问题

### Q: Backend 启动失败，提示数据库连接错误

**A:** 检查以下几点：
1. PostgreSQL 服务是否运行：`sudo systemctl status postgresql`
2. 数据库是否存在：`sudo -u postgres psql -l | grep kilwa_dashboard`
3. 连接字符串是否正确

### Q: FinBERT 加载失败

**A:** FinBERT 首次加载需要下载模型（约 500MB），确保：
1. 网络连接正常
2. 有足够的磁盘空间
3. `transformers` 和 `torch` 已正确安装

如果 FinBERT 不可用，VADER 和 TextBlob 仍然可以正常工作。

### Q: Frontend 无法连接 Backend

**A:** 检查：
1. Backend 是否在 8000 端口运行
2. CORS 配置是否正确（默认允许 localhost:3000）
3. 浏览器控制台是否有错误信息

### Q: 如何重置数据库

**A:**
```bash
# 删除并重建数据库
sudo -u postgres dropdb kilwa_dashboard
sudo -u postgres createdb kilwa_dashboard
sudo -u postgres psql -d kilwa_dashboard -f data/kilwa_db_dump.sql
```

### Q: 如何更新依赖

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

## 项目结构

```
kilwa-dashboard/
├── PROJECT.md          # 项目进度文档
├── MANUAL.md           # 本手册
├── backend/
│   ├── main.py         # FastAPI 入口
│   ├── database.py     # 数据库连接
│   ├── models.py       # SQLAlchemy 模型
│   ├── sentiment_analyzer.py   # 情感分析器
│   ├── finbert_analyzer.py     # FinBERT 分析器
│   ├── requirements.txt
│   ├── venv/           # Python 虚拟环境
│   └── routes/
│       ├── scraper.py  # Scraper API
│       └── sentiment.py # Sentiment API
├── frontend/
│   ├── src/
│   │   ├── app/        # Next.js App Router
│   │   │   ├── page.tsx        # 首页
│   │   │   ├── scraper/        # Scraper 页面
│   │   │   └── sentiment/      # Sentiment 页面
│   │   ├── components/ # React 组件
│   │   └── lib/        # 工具函数
│   ├── package.json
│   └── node_modules/
└── data/
    └── kilwa_db_dump.sql  # 数据库备份
```

---

## 联系方式

如有问题，请联系项目负责人。

---

*最后更新：2026-02-16*
