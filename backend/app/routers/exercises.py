import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Exercise, ExerciseTranslation
from ..schemas import ExerciseBrief, ExerciseDetail, ExerciseListResponse, FilterOptions
from ..translate import translate_body_part, translate_equipment

router = APIRouter(prefix="/api/v1/exercises", tags=["exercises"])

MEDIA_BASE = "http://localhost:8000/media"


def _urls(e: Exercise):
    return (
        f"{MEDIA_BASE}/{e.gif_path}" if e.gif_path else "",
        f"{MEDIA_BASE}/{e.image_path}" if e.image_path else "",
    )


def _make_brief(e: Exercise, lang: str = "zh", tr: ExerciseTranslation | None = None) -> ExerciseBrief:
    gif_url, image_url = _urls(e)
    if lang != "en" and tr:
        return ExerciseBrief(
            id=e.id,
            name=tr.name or e.name,
            body_part=tr.body_part or e.body_part,
            equipment=tr.equipment or e.equipment,
            target=tr.target or e.target,
            gif_url=gif_url,
            image_url=image_url,
        )
    return ExerciseBrief(
        id=e.id, name=e.name, body_part=e.body_part,
        equipment=e.equipment, target=e.target,
        gif_url=gif_url, image_url=image_url,
    )


def _make_detail(e: Exercise, lang: str = "zh", tr: ExerciseTranslation | None = None) -> ExerciseDetail:
    gif_url, image_url = _urls(e)
    instructions_map = json.loads(e.instructions or "{}")
    steps_map = json.loads(e.instruction_steps or "{}")
    if lang != "en" and tr:
        return ExerciseDetail(
            id=e.id,
            name=tr.name or e.name,
            body_part=tr.body_part or e.body_part,
            equipment=tr.equipment or e.equipment,
            target=tr.target or e.target,
            muscle_group=tr.muscle_group or e.muscle_group,
            secondary_muscles=json.loads(tr.secondary_muscles or "[]") or json.loads(e.secondary_muscles or "[]"),
            instructions=instructions_map.get(lang, instructions_map.get("en", "")),
            instruction_steps=steps_map.get(lang, steps_map.get("en", [])),
            gif_url=gif_url,
            image_url=image_url,
        )
    return ExerciseDetail(
        id=e.id, name=e.name, body_part=e.body_part,
        equipment=e.equipment, target=e.target,
        muscle_group=e.muscle_group,
        secondary_muscles=json.loads(e.secondary_muscles or "[]"),
        instructions=instructions_map.get(lang, instructions_map.get("en", "")),
        instruction_steps=steps_map.get(lang, steps_map.get("en", [])),
        gif_url=gif_url, image_url=image_url,
    )


@router.get("/filters", response_model=FilterOptions)
def get_filters(db: Session = Depends(get_db)):
    body_parts = sorted(set(r[0] for r in db.query(Exercise.body_part).distinct().all()))
    equipment = sorted(set(r[0] for r in db.query(Exercise.equipment).distinct().all()))
    return FilterOptions(
        body_parts=body_parts,
        equipment=equipment,
        body_parts_zh=[translate_body_part(b) for b in body_parts],
        equipment_zh=[translate_equipment(q) for q in equipment],
    )


@router.get("", response_model=ExerciseListResponse)
def list_exercises(
    page: int = Query(1, ge=1),
    size: int = Query(24, ge=1, le=100),
    body_part: str = Query(None),
    equipment: str = Query(None),
    search: str = Query(None),
    lang: str = Query("zh"),
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
        # 用 like 而非 ilike：SQLite 的 LIKE 本身对 ASCII 大小写不敏感，
        # 且对中文等多字节子串匹配可靠；ilike 会被编译成 lower(...)，
        # 在某些 SQLite 构建里对多字节中文处理有差异，导致中文搜索偶发 0 结果。
        pattern = f"%{search}%"
        q = q.outerjoin(ExerciseTranslation, Exercise.id == ExerciseTranslation.exercise_id)
        q = q.filter(or_(Exercise.name.like(pattern), ExerciseTranslation.name.like(pattern)))

    total = q.count()
    items = q.order_by(Exercise.id).offset((page - 1) * size).limit(size).all()

    # 批量加载翻译，避免 N+1
    ids = [e.id for e in items]
    trs = db.query(ExerciseTranslation).filter(ExerciseTranslation.exercise_id.in_(ids)).all()
    tmap = {t.exercise_id: t for t in trs}

    return ExerciseListResponse(
        total=total, page=page, size=size,
        items=[_make_brief(e, lang, tmap.get(e.id)) for e in items],
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
    tr = db.query(ExerciseTranslation).filter(ExerciseTranslation.exercise_id == exercise_id).first()
    return _make_detail(e, lang, tr)
