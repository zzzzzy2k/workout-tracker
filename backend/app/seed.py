import json
import os
from .database import engine, Base, SessionLocal
from .models import Exercise


EXERCISES_JSON = r"D:\Data\Study\Project\exercises-dataset\data\exercises.json"


def seed_exercises():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Exercise).count() > 0:
            return db.query(Exercise).count()
        with open(EXERCISES_JSON, "r", encoding="utf-8") as f:
            data = json.load(f)
        records = []
        for e in data:
            records.append(Exercise(
                id=e["id"],
                name=e["name"],
                body_part=e["body_part"],
                equipment=e["equipment"],
                target=e.get("target", ""),
                muscle_group=e.get("muscle_group", ""),
                secondary_muscles=json.dumps(e.get("secondary_muscles", [])),
                instructions=json.dumps(e.get("instructions", {}), ensure_ascii=False),
                instruction_steps=json.dumps(e.get("instruction_steps", {}), ensure_ascii=False),
                media_id=e.get("media_id", ""),
                image_path=e.get("image", ""),
                gif_path=e.get("gif_url", ""),
            ))
        db.add_all(records)
        db.commit()
        return len(records)
    finally:
        db.close()
