from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Candidate, SimulationResult, InterviewGuide
from ..schemas import (
    CandidateCreate, 
    CandidateResponse, 
    CandidateDashboard,
    SimulationResultResponse,
    InterviewGuideResponse
)

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("/", response_model=List[CandidateResponse])
def get_all_candidates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all candidates."""
    candidates = db.query(Candidate).offset(skip).limit(limit).all()
    return candidates


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Get a specific candidate by ID."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.get("/{candidate_id}/dashboard", response_model=CandidateDashboard)
def get_candidate_dashboard(candidate_id: int, db: Session = Depends(get_db)):
    """Get complete candidate dashboard with simulations and guides."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    simulations = db.query(SimulationResult).filter(
        SimulationResult.candidate_id == candidate_id
    ).all()
    
    guides = db.query(InterviewGuide).filter(
        InterviewGuide.candidate_id == candidate_id
    ).all()
    
    return CandidateDashboard(
        candidate=candidate,
        simulations=simulations,
        interview_guides=guides
    )


@router.post("/", response_model=CandidateResponse)
def create_candidate(candidate: CandidateCreate, db: Session = Depends(get_db)):
    """Create a new candidate."""
    # Check if email already exists
    existing = db.query(Candidate).filter(Candidate.email == candidate.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Candidate with this email already exists")
    
    db_candidate = Candidate(**candidate.model_dump())
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate


@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Delete a candidate."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    db.delete(candidate)
    db.commit()
    return {"message": "Candidate deleted successfully"}

