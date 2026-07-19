from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# ---- Exercise ----
class ExerciseBrief(BaseModel):
    id: str
    name: str
    body_part: str
    equipment: str
    target: str
    gif_url: str = ""
    image_url: str = ""

    model_config = {"from_attributes": True}


class ExerciseDetail(BaseModel):
    id: str
    name: str
    body_part: str
    equipment: str
    target: str
    muscle_group: str
    secondary_muscles: list[str] = []
    instructions: str = ""
    instruction_steps: list[str] = []
    gif_url: str = ""
    image_url: str = ""

    model_config = {"from_attributes": True}


class ExerciseListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[ExerciseBrief]


class FilterOptions(BaseModel):
    body_parts: list[str]
    equipment: list[str]


# ---- Workout ----
class WorkoutLogCreate(BaseModel):
    exercise_id: str
    sets: int = 0
    reps: int = 0
    weight_kg: float = 0.0
    order: int = 0


class WorkoutLogUpdate(BaseModel):
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight_kg: Optional[float] = None
    order: Optional[int] = None


class WorkoutLogOut(BaseModel):
    id: int
    exercise_id: str
    exercise_name: str = ""
    sets: int
    reps: int
    weight_kg: float
    order: int
    gif_url: str = ""

    model_config = {"from_attributes": True}


class WorkoutSessionCreate(BaseModel):
    date: date
    note: Optional[str] = None
    template_id: Optional[int] = None


class WorkoutSessionUpdate(BaseModel):
    note: Optional[str] = None


class WorkoutSessionBrief(BaseModel):
    id: int
    date: date
    note: Optional[str] = None
    exercise_count: int = 0
    total_sets: int = 0
    total_volume_kg: float = 0.0

    model_config = {"from_attributes": True}


class WorkoutSessionDetail(BaseModel):
    id: int
    date: date
    note: Optional[str] = None
    created_at: Optional[datetime] = None
    logs: list[WorkoutLogOut] = []

    model_config = {"from_attributes": True}


# ---- Template ----
class TemplateExerciseIn(BaseModel):
    exercise_id: str
    sets: int = 3
    order: int = 0


class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    exercises: list[TemplateExerciseIn] = []


class TemplateExerciseOut(BaseModel):
    id: int
    exercise_id: str
    exercise_name: str = ""
    body_part: str = ""
    sets: int
    order: int
    gif_url: str = ""

    model_config = {"from_attributes": True}


class TemplateOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    exercise_count: int = 0
    created_at: Optional[datetime] = None
    exercises: list[TemplateExerciseOut] = []

    model_config = {"from_attributes": True}


# ---- Stats ----
class StatsOverview(BaseModel):
    total_sessions: int
    total_sets: int
    total_volume_kg: float
    pr_count: int
    pr_increased: bool = False


class VolumeTrend(BaseModel):
    labels: list[str]
    volumes: list[float]
    sessions: list[int]


class BodyPartDistribution(BaseModel):
    body_parts: dict


class PersonalRecord(BaseModel):
    exercise_id: str
    exercise_name: str
    max_weight_kg: float
    max_reps: int
    achieved_at: str
    gif_url: str = ""
