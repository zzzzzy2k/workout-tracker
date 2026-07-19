from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Exercise, WorkoutSession, WorkoutLog
from ..schemas import StatsOverview, VolumeTrend, PersonalRecord

router = APIRouter(prefix="/api/v1/stats", tags=["stats"])

MEDIA_BASE = "http://localhost:8000/media"


@router.get("/overview", response_model=StatsOverview)
def get_overview(
    period: str = Query("month"),
    db: Session = Depends(get_db),
):
    end = date.today()
    if period == "week":
        start = end - timedelta(days=6)
    elif period == "3month":
        start = end - timedelta(days=89)
    else:
        start = end - timedelta(days=29)

    sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.date >= start, WorkoutSession.date <= end)
        .all()
    )
    total_sessions = len(sessions)

    session_ids = [s.id for s in sessions]
    total_sets = 0
    total_volume = 0.0
    if session_ids:
        logs = (
            db.query(WorkoutLog)
            .filter(WorkoutLog.session_id.in_(session_ids))
            .all()
        )
        total_sets = sum(l.sets for l in logs)
        total_volume = sum(l.sets * l.reps * l.weight_kg for l in logs)

    prev_start = start - (end - start)
    prev_sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.date >= prev_start, WorkoutSession.date < start)
        .count()
    )

    return StatsOverview(
        total_sessions=total_sessions,
        total_sets=total_sets,
        total_volume_kg=round(total_volume, 1),
        pr_count=0,
        pr_increased=total_sessions > prev_sessions if prev_sessions > 0 else False,
    )


@router.get("/volume-trend", response_model=VolumeTrend)
def get_volume_trend(
    period: str = Query("month"),
    db: Session = Depends(get_db),
):
    end = date.today()
    if period == "week":
        days = 7
        start = end - timedelta(days=days - 1)
    elif period == "3month":
        days = 90
        start = end - timedelta(days=days - 1)
    else:
        days = 30
        start = end - timedelta(days=days - 1)

    sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.date >= start, WorkoutSession.date <= end)
        .all()
    )
    session_map = {}
    for s in sessions:
        key = s.date.isoformat()
        session_map.setdefault(key, []).append(s)

    labels = []
    volumes = []
    session_counts = []
    for i in range(days):
        d = start + timedelta(days=i)
        key = d.isoformat()
        sess_list = session_map.get(key, [])
        session_counts.append(len(sess_list))
        vol = 0.0
        if sess_list:
            sids = [s.id for s in sess_list]
            logs = db.query(WorkoutLog).filter(WorkoutLog.session_id.in_(sids)).all()
            vol = sum(l.sets * l.reps * l.weight_kg for l in logs)
        volumes.append(round(vol, 1))
        labels.append(d.strftime("%m/%d"))

    return VolumeTrend(labels=labels, volumes=volumes, sessions=session_counts)


@router.get("/body-parts")
def get_body_parts(
    period: str = Query("month"),
    db: Session = Depends(get_db),
):
    end = date.today()
    if period == "week":
        start = end - timedelta(days=6)
    elif period == "3month":
        start = end - timedelta(days=89)
    else:
        start = end - timedelta(days=29)

    sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.date >= start, WorkoutSession.date <= end)
        .all()
    )
    sids = [s.id for s in sessions]
    body_count = {}
    if sids:
        logs = (
            db.query(WorkoutLog)
            .join(Exercise, WorkoutLog.exercise_id == Exercise.id)
            .filter(WorkoutLog.session_id.in_(sids))
            .all()
        )
        for l in logs:
            bp = l.exercise.body_part if l.exercise else "unknown"
            body_count[bp] = body_count.get(bp, 0) + 1
    return {"body_parts": body_count}


@router.get("/personal-records", response_model=list[PersonalRecord])
def get_personal_records(db: Session = Depends(get_db)):
    subq = (
        db.query(
            WorkoutLog.exercise_id,
            func.max(WorkoutLog.weight_kg).label("max_w"),
        )
        .group_by(WorkoutLog.exercise_id)
        .subquery()
    )
    rows = (
        db.query(WorkoutLog, Exercise)
        .join(subq, (WorkoutLog.exercise_id == subq.c.exercise_id) &
              (WorkoutLog.weight_kg == subq.c.max_w))
        .join(Exercise, WorkoutLog.exercise_id == Exercise.id)
        .order_by(subq.c.max_w.desc())
        .limit(15)
        .all()
    )
    seen = set()
    result = []
    for log, ex in rows:
        if ex.id in seen:
            continue
        seen.add(ex.id)
        result.append(PersonalRecord(
            exercise_id=ex.id,
            exercise_name=ex.name,
            max_weight_kg=log.weight_kg,
            max_reps=log.reps,
            achieved_at=log.session.date.isoformat() if log.session else "",
            gif_url=f"{MEDIA_BASE}/{ex.gif_path}" if ex.gif_path else "",
        ))
    return result


@router.get("/top-exercises")
def get_top_exercises(
    period: str = Query("month"),
    limit: int = Query(10),
    db: Session = Depends(get_db),
):
    end = date.today()
    if period == "week":
        start = end - timedelta(days=6)
    elif period == "3month":
        start = end - timedelta(days=89)
    else:
        start = end - timedelta(days=29)

    sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.date >= start, WorkoutSession.date <= end)
        .all()
    )
    sids = [s.id for s in sessions]
    if not sids:
        return {"exercises": []}
    rows = (
        db.query(
            WorkoutLog.exercise_id,
            Exercise.name,
            func.count(WorkoutLog.id).label("cnt"),
        )
        .join(Exercise, WorkoutLog.exercise_id == Exercise.id)
        .filter(WorkoutLog.session_id.in_(sids))
        .group_by(WorkoutLog.exercise_id)
        .order_by(func.count(WorkoutLog.id).desc())
        .limit(limit)
        .all()
    )
    return {
        "exercises": [
            {"exercise_id": r[0], "name": r[1], "count": r[2]} for r in rows
        ]
    }
