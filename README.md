# Workout Tracker

A sweet, orange-themed daily workout logging app. Track every rep, every set, every drop of sweat.

Built on [exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) — 1,324 exercises with GIF animations & instructions in 10 languages.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS |
| Backend | FastAPI + SQLAlchemy ORM |
| Database | SQLite (zero-config, single-file) |
| Icons | Lucide React |
| Data | exercises-dataset (1,324 exercises) |

---

## Features

- **Today's Workout** — Create sessions, log sets × reps × weight, edit inline, one-tap delete
- **Exercise Library** — Browse & search 1,324 exercises with GIF animations, filter by body part & equipment
- **Training Templates** — Save reusable routines (e.g. "Push Day", "Leg Day"), start with one click
- **Calendar History** — Month view with training day dots, tap any day to review
- **Statistics Dashboard** — Weekly/monthly/quarterly overviews, body part distribution, top exercises, personal records
- **Responsive Design** — Mobile-first with bottom nav, desktop sidebar layout
- **Dark Mode** — Class-based toggle, theme-ready

---

## Quick Start

### Prerequisites

- Python 3.11+ (with venv)
- Node.js 20+
- This repo + [exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) cloned side-by-side

### Expected directory layout

```
D:\Data\Study\Project\
├── workout-tracker\      ← this repo
└── exercises-dataset\    ← data source
```

### One-click launch

```bash
# Windows
start.bat
```

### Manual launch

```bash
# Terminal 1 — Backend
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend
npm install
npx vite --host 0.0.0.0
```

Open **http://localhost:5173** in your browser.

---

## API Endpoints

Base: `/api/v1`

| Module | Endpoints |
|--------|-----------|
| **exercises** | `GET /exercises` (paginated+filtered), `GET /exercises/{id}`, `GET /exercises/filters` |
| **workouts** | `GET /workouts` (by date range), `POST /workouts`, `GET /workouts/today`, `PUT /workouts/{id}`, `DELETE /workouts/{id}` |
| **workout logs** | `POST /workouts/{id}/logs`, `PUT /workouts/logs/{id}`, `DELETE /workouts/logs/{id}` |
| **templates** | `GET /templates`, `POST /templates`, `GET /templates/{id}`, `PUT /templates/{id}`, `DELETE /templates/{id}`, `POST /templates/{id}/start` |
| **stats** | `GET /stats/overview`, `GET /stats/volume-trend`, `GET /stats/body-parts`, `GET /stats/personal-records`, `GET /stats/top-exercises` |
| **media** | `/media/images/*`, `/media/videos/*` (static serve from exercises-dataset) |

---

## Project Structure

```
workout-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models.py            # 5 ORM models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── seed.py              # Auto-import exercises.json on first run
│   │   └── routers/
│   │       ├── exercises.py     # Exercise browsing/filtering
│   │       ├── workouts.py      # Session + log CRUD
│   │       ├── templates.py     # Template management
│   │       └── stats.py         # Computed statistics
│   ├── data/                    # workout.db (runtime, gitignored)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Router + responsive layout
│   │   ├── api/client.ts        # Axios instance
│   │   ├── pages/               # 5 page components
│   │   ├── components/          # ExerciseCard, FilterBar, DetailDrawer
│   │   └── index.css            # Orange dessert theme
│   ├── public/icon.svg          # App icon
│   ├── vite.config.ts           # Proxy /api → backend
│   └── tailwind.config.js       # Brand colors & typography
├── start.bat                    # One-click launcher
└── README.md
```

## Design

- **Theme**: 蜜橘橙 / Tangerine Orange — warm, sweet, approachable
- **Primary**: `#FF8C42` | Background: `#FFFAF5` | Text: `#3D2C1E`
- **Font**: Quicksand + Nunito (rounded, friendly) + JetBrains Mono (numbers)
- **Corner radius**: 16px throughout — soft, candy-like feel
- **Responsive**: Mobile (bottom nav, max-w-md) → Desktop (sidebar, max-w-4xl)

## License

MIT
