from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Exercise, WorkoutTemplate, TemplateExercise
from ..schemas import (
    TemplateCreate, TemplateOut, TemplateExerciseOut, TemplateExerciseIn,
    WorkoutSessionDetail,
)

router = APIRouter(prefix="/api/v1/templates", tags=["templates"])

MEDIA_BASE = "http://localhost:8000/media"


def _template_out(t: WorkoutTemplate, include_exercises: bool = True) -> TemplateOut:
    exs = []
    if include_exercises:
        for te in sorted(t.exercises, key=lambda x: x.order):
            ex = te.exercise
            exs.append(TemplateExerciseOut(
                id=te.id,
                exercise_id=te.exercise_id,
                exercise_name=ex.name if ex else "",
                body_part=ex.body_part if ex else "",
                sets=te.sets,
                order=te.order,
                gif_url=f"{MEDIA_BASE}/{ex.gif_path}" if ex and ex.gif_path else "",
            ))
    return TemplateOut(
        id=t.id, name=t.name, description=t.description,
        exercise_count=len(t.exercises) if include_exercises else 0,
        created_at=t.created_at,
        exercises=exs,
    )


@router.get("", response_model=list[TemplateOut])
def list_templates(db: Session = Depends(get_db)):
    tmpls = (
        db.query(WorkoutTemplate)
        .options(joinedload(WorkoutTemplate.exercises).joinedload(TemplateExercise.exercise))
        .order_by(WorkoutTemplate.id.desc())
        .all()
    )
    return [_template_out(t, include_exercises=False) for t in tmpls]


@router.post("", response_model=TemplateOut, status_code=201)
def create_template(body: TemplateCreate, db: Session = Depends(get_db)):
    t = WorkoutTemplate(name=body.name, description=body.description)
    db.add(t)
    db.flush()
    for e in body.exercises:
        te = TemplateExercise(
            template_id=t.id, exercise_id=e.exercise_id,
            sets=e.sets, order=e.order,
        )
        db.add(te)
    db.commit()
    db.refresh(t)
    t = (
        db.query(WorkoutTemplate)
        .options(joinedload(WorkoutTemplate.exercises).joinedload(TemplateExercise.exercise))
        .filter(WorkoutTemplate.id == t.id)
        .first()
    )
    return _template_out(t)


@router.get("/{template_id}", response_model=TemplateOut)
def get_template(template_id: int, db: Session = Depends(get_db)):
    t = (
        db.query(WorkoutTemplate)
        .options(joinedload(WorkoutTemplate.exercises).joinedload(TemplateExercise.exercise))
        .filter(WorkoutTemplate.id == template_id)
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return _template_out(t)


@router.put("/{template_id}", response_model=TemplateOut)
def update_template(template_id: int, body: TemplateCreate, db: Session = Depends(get_db)):
    t = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    t.name = body.name
    t.description = body.description
    # replace exercises
    db.query(TemplateExercise).filter(TemplateExercise.template_id == template_id).delete()
    for e in body.exercises:
        te = TemplateExercise(
            template_id=t.id, exercise_id=e.exercise_id,
            sets=e.sets, order=e.order,
        )
        db.add(te)
    db.commit()
    db.refresh(t)
    t = (
        db.query(WorkoutTemplate)
        .options(joinedload(WorkoutTemplate.exercises).joinedload(TemplateExercise.exercise))
        .filter(WorkoutTemplate.id == template_id)
        .first()
    )
    return _template_out(t)


@router.delete("/{template_id}", status_code=204)
def delete_template(template_id: int, db: Session = Depends(get_db)):
    t = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(t)
    db.commit()


@router.post("/{template_id}/exercises", response_model=TemplateOut, status_code=201)
def add_exercise(template_id: int, body: TemplateExerciseIn, db: Session = Depends(get_db)):
    t = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    max_order = (
        db.query(TemplateExercise)
        .filter(TemplateExercise.template_id == template_id)
        .count()
    )
    te = TemplateExercise(
        template_id=template_id, exercise_id=body.exercise_id,
        sets=body.sets, order=body.order if body.order else max_order + 1,
    )
    db.add(te)
    db.commit()
    db.refresh(t)
    t = (
        db.query(WorkoutTemplate)
        .options(joinedload(WorkoutTemplate.exercises).joinedload(TemplateExercise.exercise))
        .filter(WorkoutTemplate.id == template_id)
        .first()
    )
    return _template_out(t)


@router.delete("/{template_id}/exercises/{exercise_id}", status_code=204)
def remove_exercise(template_id: int, exercise_id: str, db: Session = Depends(get_db)):
    te = (
        db.query(TemplateExercise)
        .filter(
            TemplateExercise.template_id == template_id,
            TemplateExercise.exercise_id == exercise_id,
        )
        .first()
    )
    if not te:
        raise HTTPException(status_code=404, detail="Template exercise not found")
    db.delete(te)
    db.commit()


@router.post("/{template_id}/start", response_model=WorkoutSessionDetail)
def start_from_template(template_id: int, db: Session = Depends(get_db)):
    from ..models import WorkoutSession, WorkoutLog
    t = (
        db.query(WorkoutTemplate)
        .options(joinedload(WorkoutTemplate.exercises))
        .filter(WorkoutTemplate.id == template_id)
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    session = WorkoutSession(
        date=date.today(),
        note=f"来源: {t.name}",
    )
    db.add(session)
    db.flush()
    for te in sorted(t.exercises, key=lambda x: x.order):
        log = WorkoutLog(
            session_id=session.id, exercise_id=te.exercise_id,
            sets=te.sets, reps=0, weight_kg=0.0, order=te.order,
        )
        db.add(log)
    db.commit()
    db.refresh(session)
    session = (
        db.query(WorkoutSession)
        .options(joinedload(WorkoutSession.logs).joinedload(WorkoutLog.exercise))
        .filter(WorkoutSession.id == session.id)
        .first()
    )
    from ..schemas import WorkoutLogOut
    logs = sorted(session.logs, key=lambda l: l.order)
    return WorkoutSessionDetail(
        id=session.id, date=session.date, note=session.note,
        created_at=session.created_at,
        logs=[WorkoutLogOut(
            id=l.id, exercise_id=l.exercise_id,
            exercise_name=l.exercise.name if l.exercise else "",
            sets=l.sets, reps=l.reps, weight_kg=l.weight_kg, order=l.order,
            gif_url=f"{MEDIA_BASE}/{l.exercise.gif_path}" if l.exercise and l.exercise.gif_path else "",
        ) for l in logs],
    )
