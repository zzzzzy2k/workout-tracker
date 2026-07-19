import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    body_part = Column(String, nullable=False)
    equipment = Column(String, nullable=False)
    target = Column(String, nullable=False)
    muscle_group = Column(String, nullable=False)
    secondary_muscles = Column(Text)   # JSON array
    instructions = Column(Text)         # JSON {lang: str}
    instruction_steps = Column(Text)    # JSON {lang: [str]}
    media_id = Column(String, nullable=False)
    image_path = Column(String, nullable=False)
    gif_path = Column(String, nullable=False)


class ExerciseTranslation(Base):
    """动作中文翻译表（1:1 对应 exercises），种子时一次性生成。"""
    __tablename__ = "exercise_translations"

    exercise_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)        # 中文动作名
    body_part = Column(String)                   # 中文部位
    equipment = Column(String)                   # 中文器械
    target = Column(String)                      # 中文目标肌群
    muscle_group = Column(String)                # 中文主协同肌群
    secondary_muscles = Column(Text)             # JSON 中文辅助肌群数组


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, default=datetime.date.today)
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    logs = relationship("WorkoutLog", back_populates="session", cascade="all, delete-orphan")


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(String, ForeignKey("exercises.id"), nullable=False)
    sets = Column(Integer, nullable=False, default=0)
    reps = Column(Integer, nullable=False, default=0)
    weight_kg = Column(Float, nullable=False, default=0.0)
    order = Column(Integer, nullable=False, default=0)

    session = relationship("WorkoutSession", back_populates="logs")
    exercise = relationship("Exercise")


class WorkoutTemplate(Base):
    __tablename__ = "workout_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    exercises = relationship("TemplateExercise", back_populates="template", cascade="all, delete-orphan")


class TemplateExercise(Base):
    __tablename__ = "template_exercises"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("workout_templates.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(String, ForeignKey("exercises.id"), nullable=False)
    sets = Column(Integer, nullable=False, default=3)
    order = Column(Integer, nullable=False, default=0)

    template = relationship("WorkoutTemplate", back_populates="exercises")
    exercise = relationship("Exercise")
