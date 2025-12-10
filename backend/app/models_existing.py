"""Models mapping to existing Skillfully database tables."""

from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .database import Base


class SkillsMap(Base):
    """Maps to skills_map table."""
    __tablename__ = "skills_map"
    
    skill_id = Column(Integer, primary_key=True)
    skill_name = Column(String(255))
    skill_prompt = Column(Text)
    version_number = Column(Integer)
    created_at = Column(DateTime)
    last_modified_at = Column(DateTime)
    is_ai_generated = Column(Boolean, default=False)


class Evaluation(Base):
    """Maps to evaluation table - main evaluation results."""
    __tablename__ = "evaluation"
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String(255))
    transcript = Column(Text)
    skill = Column(Text)
    result = Column(JSONB)
    created_at = Column(DateTime)
    last_modified_at = Column(DateTime)
    simulation_archtype = Column(String(255))
    meta_data = Column(JSONB)
    user_id = Column(UUID)
    email = Column(String(255))
    campaign_id = Column(UUID)
    campaign_name = Column(String(255))
    scenario_id = Column(UUID)
    scenario_name = Column(String(255))
    scenario_type = Column(String(100))
    eval_uuid = Column(String(255))


class EvaluationFeedback(Base):
    """Maps to evaluation_feedback_table."""
    __tablename__ = "evaluation_feedback_table"
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String(255))
    evaluation_results = Column(JSONB)
    feedback = Column(JSONB)
    created_at = Column(DateTime)
    last_modified_at = Column(DateTime)


class EvaluationVoiceElsa(Base):
    """Maps to evaluation_voice_elsa table."""
    __tablename__ = "evaluation_voice_elsa"
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String(255))
    transcript = Column(Text)
    elsa_score = Column(JSONB)
    result = Column(JSONB)
    meta_data = Column(JSONB)
    created_at = Column(DateTime)
    last_modified_at = Column(DateTime)
    user_id = Column(UUID)
    email = Column(String(255))
    campaign_id = Column(UUID)
    campaign_name = Column(String(255))
    scenario_id = Column(UUID)
    scenario_name = Column(String(255))
    scenario_type = Column(String(100))
    eval_uuid = Column(String(255))

