# Workout Tracker

> [English](./README.md) | 中文

一枚蜜橘橙色的每日健身记录应用。记录每一次组数、每一次重量、每一滴汗水。

基于 [exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) 构建 —— 1,324 个健身动作，带 GIF 动画和 10 种语言教学。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript + TailwindCSS |
| 后端 | FastAPI + SQLAlchemy ORM |
| 数据库 | SQLite（零配置，单文件） |
| 图标 | Lucide React |
| 数据 | exercises-dataset（1,324 动作） |

---

## 功能

- **今日训练** — 创建训练组、记录组数 × 次数 × 重量、行内编辑、一键删除
- **动作库** — 浏览和搜索 1,324 个动作，GIF 动画预览，按身体部位和器械筛选
- **训练模板** — 保存常用训练套路（如"推胸日""练腿日"），一键开始
- **日历历史** — 月份日历视图，训练日标记点，点击查看当日详情
- **训练心得** — 每次训练写日记式心得，支持自动保存 / 手动保存切换，关键字搜索回顾
- **统计分析** — 周/月/季度概览、身体部位分布、常用动作排行、个人记录
- **响应式布局** — 手机端底部导航栏，桌面端左侧导航栏
- **暗色模式** — 随时切换

---

## 快速开始

### 前置条件

- Python 3.11+（含 venv）
- Node.js 20+
- 本项目与 [exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) 克隆到同级目录

### 预期目录结构

```
D:\Data\Study\Project\
├── workout-tracker\      ← 本项目
└── exercises-dataset\    ← 数据源
```

### 一键启动

```bash
# Windows
start.bat
```

### 手动启动

```bash
# 终端 1 — 后端
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 终端 2 — 前端
cd frontend
npm install
npx vite --host 0.0.0.0
```

浏览器打开 **http://localhost:5173**。

---

## API 接口

Base: `/api/v1`

| 模块 | 端点 |
|------|------|
| **动作** | `GET /exercises`（分页+筛选）、`GET /exercises/{id}`、`GET /exercises/filters` |
| **训练** | `GET /workouts`（日期范围+关键词搜索）、`POST /workouts`、`GET /workouts/today`、`PUT /workouts/{id}`、`DELETE /workouts/{id}` |
| **训练记录** | `POST /workouts/{id}/logs`、`PUT /workouts/logs/{id}`、`DELETE /workouts/logs/{id}` |
| **模板** | `GET /templates`、`POST /templates`、`GET /templates/{id}`、`PUT /templates/{id}`、`DELETE /templates/{id}`、`POST /templates/{id}/start` |
| **统计** | `GET /stats/overview`、`GET /stats/volume-trend`、`GET /stats/body-parts`、`GET /stats/personal-records`、`GET /stats/top-exercises` |
| **媒体** | `/media/images/*`、`/media/videos/*`（静态文件托管） |

---

## 项目结构

```
workout-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── database.py          # SQLAlchemy 引擎 + 会话
│   │   ├── models.py            # 5 个 ORM 模型
│   │   ├── schemas.py           # Pydantic 请求/响应 schema
│   │   ├── seed.py              # 首次启动自动导入 exercises.json
│   │   └── routers/
│   │       ├── exercises.py     # 动作浏览与筛选
│   │       ├── workouts.py      # 训练组与记录 CRUD
│   │       ├── templates.py     # 模板管理
│   │       └── stats.py         # 统计计算
│   ├── data/                    # workout.db（运行时生成，gitignore）
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # 路由 + 响应式布局
│   │   ├── api/client.ts        # Axios 实例
│   │   ├── pages/               # 5 个页面组件
│   │   ├── components/          # ExerciseCard、FilterBar、DetailDrawer
│   │   └── index.css            # 蜜橘橙主题样式
│   ├── public/icon.svg          # 应用图标
│   ├── vite.config.ts           # 代理 /api → 后端
│   └── tailwind.config.js       # 品牌色板与字体
├── start.bat                    # 一键启动脚本
├── README.md                    # English README
└── README.zh.md                 # 中文 README（本文件）
```

## 设计

- **主题**：蜜橘橙 — 温暖、甜美、亲和力
- **主色**：`#FF8C42` | 背景：`#FFFAF5` | 文字：`#3D2C1E`
- **字体**：Quicksand + Nunito（圆润亲和）+ JetBrains Mono（数字）
- **圆角**：全局 16px — 柔软糖果感
- **响应式**：手机（底部导航，max-w-md） → 桌面（侧边栏，max-w-4xl）

## 开源协议

MIT
