from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)
    role_applied = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    simulations = relationship("SimulationResult", back_populates="candidate")
    interview_guides = relationship("InterviewGuide", back_populates="candidate")


class SimulationResult(Base):
    __tablename__ = "simulation_results"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    simulation_type = Column(String(255), nullable=False)  # e.g., "Technical Interview", "Customer Support"
    overall_score = Column(Float, nullable=False)
    
    # JSON fields for flexible skill data
    skills_tested = Column(JSON, nullable=False)  # List of skills with scores
    verified_skills = Column(JSON, nullable=False)  # Skills that passed threshold
    skill_gaps = Column(JSON, nullable=False)  # Skills below threshold
    evaluation_rationale = Column(Text, nullable=True)  # Detailed evaluation notes
    
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    candidate = relationship("Candidate", back_populates="simulations")


class JobDescription(Base):
    __tablename__ = "job_descriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    required_skills = Column(JSON, nullable=False)  # List of required skills with priority
    nice_to_have_skills = Column(JSON, nullable=True)
    interview_type = Column(String(50), default="technical")  # technical, behavioral, mixed
    created_at = Column(DateTime, default=datetime.utcnow)


class InterviewGuide(Base):
    __tablename__ = "interview_guides"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    
    # Generated content
    summary = Column(Text, nullable=False)  # Executive summary of candidate
    questions = Column(JSON, nullable=False)  # List of generated questions
    red_flags = Column(JSON, nullable=True)  # Potential concerns to explore
    strengths = Column(JSON, nullable=True)  # Verified strengths to acknowledge
    
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    candidate = relationship("Candidate", back_populates="interview_guides")
    job_description = relationship("JobDescription")

