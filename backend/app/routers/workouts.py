from typing import Optional
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Exercise, ExerciseTranslation, WorkoutSession, WorkoutLog
from ..schemas import (
    WorkoutSessionCreate, WorkoutSessionUpdate, WorkoutSessionBrief,
    WorkoutSessionDetail, WorkoutLogCreate, WorkoutLogUpdate, WorkoutLogOut,
)

router = APIRouter(prefix="/api/v1/workouts", tags=["workouts"])

MEDIA_BASE = "http://localhost:8000/media"


def _log_out(log: WorkoutLog) -> WorkoutLogOut:
    ex = log.exercise
    return WorkoutLogOut(
        id=log.id,
        exercise_id=log.exercise_id,
        exercise_name=ex.name if ex else "",
        sets=log.sets,
        reps=log.reps,
        weight_kg=log.weight_kg,
        order=log.order,
        gif_url=f"{MEDIA_BASE}/{ex.gif_path}" if ex and ex.gif_path else "",
    )


@router.get("/today", response_model=list[WorkoutSessionDetail])
def get_today(db: Session = Depends(get_db)):
    today = date.today()
    sessions = (
        db.query(WorkoutSession)
        .options(joinedload(WorkoutSession.logs).joinedload(WorkoutLog.exercise))
        .filter(WorkoutSession.date == today)
        .order_by(WorkoutSession.created_at.asc())
        .all()
    )
    result = []
    for s in sessions:
        logs = sorted(s.logs, key=lambda l: l.order)
        result.append(WorkoutSessionDetail(
            id=s.id, date=s.date, note=s.note, created_at=s.created_at,
            logs=[_log_out(l) for l in logs],
        ))
    return result


@router.get("", response_model=list[WorkoutSessionBrief])
def list_sessions(
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(WorkoutSession)
        .options(joinedload(WorkoutSession.logs))
    )
    if from_date and to_date:
        query = query.filter(WorkoutSession.date >= from_date, WorkoutSession.date <= to_date)
    elif from_date:
        query = query.filter(WorkoutSession.date >= from_date)
    elif to_date:
        query = query.filter(WorkoutSession.date <= to_date)
    if search and search.strip():
        query = query.filter(WorkoutSession.note.ilike(f"%{search.strip()}%"))
    sessions = query.order_by(WorkoutSession.date.desc()).all()
    result = []
    for s in sessions:
        total_vol = sum(l.sets * l.reps * l.weight_kg for l in s.logs)
        result.append(WorkoutSessionBrief(
            id=s.id, date=s.date, note=s.note,
            exercise_count=len(s.logs),
            total_sets=sum(l.sets for l in s.logs),
            total_volume_kg=round(total_vol, 1),
        ))
    return result


@router.get("/{session_id}", response_model=WorkoutSessionDetail)
def get_session(
    session_id: int,
    lang: str = Query("zh"),
    db: Session = Depends(get_db),
):
    s = (
        db.query(WorkoutSession)
        .options(joinedload(WorkoutSession.logs).joinedload(WorkoutLog.exercise))
        .filter(WorkoutSession.id == session_id)
        .first()
    )
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")

    # 批量加载中文翻译
    ex_ids = [l.exercise_id for l in s.logs if l.exercise_id]
    tmap = {}
    if lang != "en" and ex_ids:
        trs = db.query(ExerciseTranslation).filter(ExerciseTranslation.exercise_id.in_(ex_ids)).all()
        tmap = {t.exercise_id: t for t in trs}

    logs = sorted(s.logs, key=lambda l: l.order)
    out_logs = []
    for l in logs:
        ex = l.exercise
        name = ex.name if ex else ""
        if lang != "en":
            tr = tmap.get(l.exercise_id)
            if tr and tr.name:
                name = tr.name
        out_logs.append(WorkoutLogOut(
            id=l.id,
            exercise_id=l.exercise_id,
            exercise_name=name,
            sets=l.sets,
            reps=l.reps,
            weight_kg=l.weight_kg,
            order=l.order,
            gif_url=f"{MEDIA_BASE}/{ex.gif_path}" if ex and ex.gif_path else "",
        ))

    return WorkoutSessionDetail(
        id=s.id, date=s.date, note=s.note, created_at=s.created_at,
        logs=out_logs,
    )


@router.post("", response_model=WorkoutSessionDetail, status_code=201)
def create_session(body: WorkoutSessionCreate, db: Session = Depends(get_db)):
    session = WorkoutSession(date=body.date, note=body.note)
    db.add(session)
    db.flush()

    if body.template_id:
        from ..models import WorkoutTemplate, TemplateExercise
        tmpl = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == body.template_id).first()
        if tmpl:
            tmpl_exs = (
                db.query(TemplateExercise)
                .filter(TemplateExercise.template_id == tmpl.id)
                .order_by(TemplateExercise.order)
                .all()
            )
            for te in tmpl_exs:
                log = WorkoutLog(
                    session_id=session.id,
                    exercise_id=te.exercise_id,
                    sets=te.sets,
                    reps=0,
                    weight_kg=0.0,
                    order=te.order,
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
    logs = sorted(session.logs, key=lambda l: l.order)
    return WorkoutSessionDetail(
        id=session.id, date=session.date, note=session.note,
        created_at=session.created_at,
        logs=[_log_out(l) for l in logs],
    )


@router.put("/{session_id}", response_model=WorkoutSessionDetail)
def update_session(session_id: int, body: WorkoutSessionUpdate, db: Session = Depends(get_db)):
    s = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if body.note is not None:
        s.note = body.note
    s.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(s)
    s = (
        db.query(WorkoutSession)
        .options(joinedload(WorkoutSession.logs).joinedload(WorkoutLog.exercise))
        .filter(WorkoutSession.id == session_id)
        .first()
    )
    logs = sorted(s.logs, key=lambda l: l.order)
    return WorkoutSessionDetail(
        id=s.id, date=s.date, note=s.note, created_at=s.created_at,
        logs=[_log_out(l) for l in logs],
    )


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db)):
    s = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(s)
    db.commit()


@router.post("/{session_id}/logs", response_model=WorkoutLogOut, status_code=201)
def add_log(session_id: int, body: WorkoutLogCreate, db: Session = Depends(get_db)):
    s = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    log = WorkoutLog(
        session_id=session_id, exercise_id=body.exercise_id,
        sets=body.sets, reps=body.reps, weight_kg=body.weight_kg,
        order=body.order,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    log = (
        db.query(WorkoutLog)
        .options(joinedload(WorkoutLog.exercise))
        .filter(WorkoutLog.id == log.id)
        .first()
    )
    return _log_out(log)


@router.put("/logs/{log_id}", response_model=WorkoutLogOut)
def update_log(log_id: int, body: WorkoutLogUpdate, db: Session = Depends(get_db)):
    log = db.query(WorkoutLog).filter(WorkoutLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    if body.sets is not None:
        log.sets = body.sets
    if body.reps is not None:
        log.reps = body.reps
    if body.weight_kg is not None:
        log.weight_kg = body.weight_kg
    if body.order is not None:
        log.order = body.order
    db.commit()
    db.refresh(log)
    log = (
        db.query(WorkoutLog)
        .options(joinedload(WorkoutLog.exercise))
        .filter(WorkoutLog.id == log.id)
        .first()
    )
    return _log_out(log)


@router.delete("/logs/{log_id}", status_code=204)
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(WorkoutLog).filter(WorkoutLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
