from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Skill-related schemas
class SkillScore(BaseModel):
    skill_name: str
    score: float  # 0-100
    max_score: float = 100.0
    rationale: Optional[str] = None
    importance: str = "medium"  # low, medium, high, critical


class SkillGap(BaseModel):
    skill_name: str
    current_score: float
    required_score: float
    gap_severity: str  # minor, moderate, significant, critical
    importance_to_role: str  # low, medium, high, critical
    suggested_probe_areas: List[str] = []


# Candidate schemas
class CandidateBase(BaseModel):
    name: str
    email: str
    role_applied: str


class CandidateCreate(CandidateBase):
    pass


class CandidateResponse(CandidateBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Simulation schemas
class SimulationResultBase(BaseModel):
    simulation_type: str
    overall_score: float
    skills_tested: List[SkillScore]
    verified_skills: List[str]
    skill_gaps: List[SkillGap]
    evaluation_rationale: Optional[str] = None


class SimulationResultCreate(SimulationResultBase):
    candidate_id: int


class SimulationResultResponse(SimulationResultBase):
    id: int
    candidate_id: int
    completed_at: datetime
    
    class Config:
        from_attributes = True


# Job Description schemas
class JobDescriptionBase(BaseModel):
    title: str
    department: Optional[str] = None
    description: str
    required_skills: List[dict]  # {"skill": "name", "priority": "high/medium/low"}
    nice_to_have_skills: Optional[List[dict]] = None
    interview_type: str = "technical"


class JobDescriptionCreate(JobDescriptionBase):
    pass


class JobDescriptionResponse(JobDescriptionBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Interview Question schemas
class InterviewQuestion(BaseModel):
    question: str
    skill_targeted: str
    difficulty: str  # easy, medium, hard
    what_to_listen_for: List[str]
    red_flags: List[str]
    follow_up_questions: List[str]
    time_estimate: str  # e.g., "3-5 minutes"


# Interview Guide schemas
class InterviewGuideBase(BaseModel):
    summary: str
    questions: List[InterviewQuestion]
    red_flags: Optional[List[str]] = None
    strengths: Optional[List[str]] = None


class InterviewGuideCreate(BaseModel):
    candidate_id: int
    job_description_id: Optional[int] = None


class InterviewGuideResponse(InterviewGuideBase):
    id: int
    candidate_id: int
    job_description_id: Optional[int] = None
    generated_at: datetime
    
    class Config:
        from_attributes = True


# Combined response for dashboard
class CandidateDashboard(BaseModel):
    candidate: CandidateResponse
    simulations: List[SimulationResultResponse]
    interview_guides: List[InterviewGuideResponse]


# Generation request
class GenerateGuideRequest(BaseModel):
    candidate_id: int
    job_description_id: Optional[int] = None
    job_description_text: Optional[str] = None  # Alternative to ID
    num_questions: int = 8
    focus_areas: Optional[List[str]] = None

