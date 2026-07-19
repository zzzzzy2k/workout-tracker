import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Exercise
from ..schemas import ExerciseBrief, ExerciseDetail, ExerciseListResponse, FilterOptions

router = APIRouter(prefix="/api/v1/exercises", tags=["exercises"])

MEDIA_BASE = "http://localhost:8000/media"


def _make_brief(e: Exercise) -> ExerciseBrief:
    return ExerciseBrief(
        id=e.id, name=e.name, body_part=e.body_part,
        equipment=e.equipment, target=e.target,
        gif_url=f"{MEDIA_BASE}/{e.gif_path}" if e.gif_path else "",
        image_url=f"{MEDIA_BASE}/{e.image_path}" if e.image_path else "",
    )


def _make_detail(e: Exercise, lang: str = "zh") -> ExerciseDetail:
    instructions_map = json.loads(e.instructions or "{}")
    steps_map = json.loads(e.instruction_steps or "{}")
    return ExerciseDetail(
        id=e.id, name=e.name, body_part=e.body_part,
        equipment=e.equipment, target=e.target,
        muscle_group=e.muscle_group,
        secondary_muscles=json.loads(e.secondary_muscles or "[]"),
        instructions=instructions_map.get(lang, instructions_map.get("en", "")),
        instruction_steps=steps_map.get(lang, steps_map.get("en", [])),
        gif_url=f"{MEDIA_BASE}/{e.gif_path}" if e.gif_path else "",
        image_url=f"{MEDIA_BASE}/{e.image_path}" if e.image_path else "",
    )


@router.get("/filters", response_model=FilterOptions)
def get_filters(db: Session = Depends(get_db)):
    body_parts = sorted(set(
        r[0] for r in db.query(Exercise.body_part).distinct().all()
    ))
    equipment = sorted(set(
        r[0] for r in db.query(Exercise.equipment).distinct().all()
    ))
    return FilterOptions(body_parts=body_parts, equipment=equipment)


@router.get("", response_model=ExerciseListResponse)
def list_exercises(
    page: int = Query(1, ge=1),
    size: int = Query(24, ge=1, le=100),
    body_part: str = Query(None),
    equipment: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Exercise)
    if body_part:
        parts = [p.strip().lower() for p in body_part.split(",") if p.strip()]
        if parts:
            q = q.filter(Exercise.body_part.in_(parts))
    if equipment:
        eqs = [p.strip().lower() for p in equipment.split(",") if p.strip()]
        if eqs:
            q = q.filter(Exercise.equipment.in_(eqs))
    if search:
        q = q.filter(Exercise.name.ilike(f"%{search}%"))
    total = q.count()
    items = q.order_by(Exercise.id).offset((page - 1) * size).limit(size).all()
    return ExerciseListResponse(
        total=total, page=page, size=size,
        items=[_make_brief(e) for e in items],
    )


@router.get("/{exercise_id}", response_model=ExerciseDetail)
def get_exercise(
    exercise_id: str,
    lang: str = Query("zh"),
    db: Session = Depends(get_db),
):
    e = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Exercise not found")
    return _make_detail(e, lang)
