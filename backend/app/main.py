from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .seed import seed_exercises
from .routers import exercises, workouts, templates, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    count = seed_exercises()
    print(f"Exercises seeded: {count}")
    yield


app = FastAPI(title="Workout Tracker API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXERCISES_DIR = r"D:\Data\Study\Project\exercises-dataset"
app.mount("/media/images", StaticFiles(directory=f"{EXERCISES_DIR}/images"), name="images")
app.mount("/media/videos", StaticFiles(directory=f"{EXERCISES_DIR}/videos"), name="videos")

app.include_router(exercises.router)
app.include_router(workouts.router)
app.include_router(templates.router)
app.include_router(stats.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
