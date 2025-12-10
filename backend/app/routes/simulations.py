from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import SimulationResult, Candidate
from ..schemas import SimulationResultCreate, SimulationResultResponse

router = APIRouter(prefix="/simulations", tags=["simulations"])


@router.get("/", response_model=List[SimulationResultResponse])
def get_all_simulations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all simulation results."""
    simulations = db.query(SimulationResult).offset(skip).limit(limit).all()
    return simulations


@router.get("/{simulation_id}", response_model=SimulationResultResponse)
def get_simulation(simulation_id: int, db: Session = Depends(get_db)):
    """Get a specific simulation result."""
    simulation = db.query(SimulationResult).filter(SimulationResult.id == simulation_id).first()
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return simulation


@router.get("/candidate/{candidate_id}", response_model=List[SimulationResultResponse])
def get_candidate_simulations(candidate_id: int, db: Session = Depends(get_db)):
    """Get all simulations for a candidate."""
    # Verify candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    simulations = db.query(SimulationResult).filter(
        SimulationResult.candidate_id == candidate_id
    ).all()
    return simulations


@router.post("/", response_model=SimulationResultResponse)
def create_simulation(simulation: SimulationResultCreate, db: Session = Depends(get_db)):
    """Create a new simulation result."""
    # Verify candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == simulation.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Convert Pydantic models to dicts for JSON storage
    simulation_data = simulation.model_dump()
    simulation_data['skills_tested'] = [s.model_dump() if hasattr(s, 'model_dump') else s for s in simulation_data['skills_tested']]
    simulation_data['skill_gaps'] = [g.model_dump() if hasattr(g, 'model_dump') else g for g in simulation_data['skill_gaps']]
    
    db_simulation = SimulationResult(**simulation_data)
    db.add(db_simulation)
    db.commit()
    db.refresh(db_simulation)
    return db_simulation


@router.delete("/{simulation_id}")
def delete_simulation(simulation_id: int, db: Session = Depends(get_db)):
    """Delete a simulation result."""
    simulation = db.query(SimulationResult).filter(SimulationResult.id == simulation_id).first()
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    db.delete(simulation)
    db.commit()
    return {"message": "Simulation deleted successfully"}

