from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import InterviewGuide, Candidate, SimulationResult, JobDescription
from ..schemas import (
    InterviewGuideResponse, 
    GenerateGuideRequest, 
    SkillGap,
    InterviewGuideBase
)
from ..llm_service import llm_service

router = APIRouter(prefix="/guides", tags=["interview-guides"])


@router.get("/", response_model=List[InterviewGuideResponse])
def get_all_guides(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all interview guides."""
    guides = db.query(InterviewGuide).offset(skip).limit(limit).all()
    return guides


@router.get("/{guide_id}", response_model=InterviewGuideResponse)
def get_guide(guide_id: int, db: Session = Depends(get_db)):
    """Get a specific interview guide."""
    guide = db.query(InterviewGuide).filter(InterviewGuide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Interview guide not found")
    return guide


@router.get("/candidate/{candidate_id}", response_model=List[InterviewGuideResponse])
def get_candidate_guides(candidate_id: int, db: Session = Depends(get_db)):
    """Get all interview guides for a candidate."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    guides = db.query(InterviewGuide).filter(
        InterviewGuide.candidate_id == candidate_id
    ).all()
    return guides


@router.post("/generate", response_model=InterviewGuideResponse)
def generate_interview_guide(request: GenerateGuideRequest, db: Session = Depends(get_db)):
    """Generate a new interview guide using AI."""
    # Get candidate
    candidate = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Get simulation results
    simulations = db.query(SimulationResult).filter(
        SimulationResult.candidate_id == request.candidate_id
    ).all()
    
    if not simulations:
        raise HTTPException(
            status_code=400, 
            detail="No simulation results found for this candidate. Run a simulation first."
        )
    
    # Aggregate skill gaps from all simulations
    all_skill_gaps = []
    all_verified_skills = []
    evaluation_rationale = ""
    
    for sim in simulations:
        # Convert JSON skill gaps to SkillGap objects
        for gap in sim.skill_gaps:
            if isinstance(gap, dict):
                all_skill_gaps.append(SkillGap(**gap))
            else:
                all_skill_gaps.append(gap)
        
        all_verified_skills.extend(sim.verified_skills or [])
        if sim.evaluation_rationale:
            evaluation_rationale += f"\n{sim.simulation_type}: {sim.evaluation_rationale}"
    
    # Remove duplicates from verified skills
    all_verified_skills = list(set(all_verified_skills))
    
    # Get job description if provided
    job_description_text = request.job_description_text
    interview_type = "technical"
    
    if request.job_description_id:
        job_desc = db.query(JobDescription).filter(
            JobDescription.id == request.job_description_id
        ).first()
        if job_desc:
            job_description_text = job_desc.description
            interview_type = job_desc.interview_type
    
    # Generate questions using LLM
    result = llm_service.generate_interview_questions(
        candidate_name=candidate.name,
        role=candidate.role_applied,
        skill_gaps=all_skill_gaps,
        verified_skills=all_verified_skills,
        job_description=job_description_text,
        evaluation_rationale=evaluation_rationale.strip(),
        num_questions=request.num_questions,
        interview_type=interview_type
    )
    
    # Save to database
    db_guide = InterviewGuide(
        candidate_id=candidate.id,
        job_description_id=request.job_description_id,
        summary=result.get("summary", ""),
        questions=result.get("questions", []),
        red_flags=result.get("red_flags", []),
        strengths=result.get("strengths", [])
    )
    
    db.add(db_guide)
    db.commit()
    db.refresh(db_guide)
    
    return db_guide


@router.delete("/{guide_id}")
def delete_guide(guide_id: int, db: Session = Depends(get_db)):
    """Delete an interview guide."""
    guide = db.query(InterviewGuide).filter(InterviewGuide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Interview guide not found")
    
    db.delete(guide)
    db.commit()
    return {"message": "Interview guide deleted successfully"}

