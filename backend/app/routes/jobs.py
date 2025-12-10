from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import JobDescription
from ..schemas import JobDescriptionCreate, JobDescriptionResponse

router = APIRouter(prefix="/jobs", tags=["job-descriptions"])


@router.get("/", response_model=List[JobDescriptionResponse])
def get_all_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all job descriptions."""
    jobs = db.query(JobDescription).offset(skip).limit(limit).all()
    return jobs


@router.get("/{job_id}", response_model=JobDescriptionResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a specific job description."""
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")
    return job


@router.post("/", response_model=JobDescriptionResponse)
def create_job(job: JobDescriptionCreate, db: Session = Depends(get_db)):
    """Create a new job description."""
    db_job = JobDescription(**job.model_dump())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.put("/{job_id}", response_model=JobDescriptionResponse)
def update_job(job_id: int, job: JobDescriptionCreate, db: Session = Depends(get_db)):
    """Update a job description."""
    db_job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job description not found")
    
    for key, value in job.model_dump().items():
        setattr(db_job, key, value)
    
    db.commit()
    db.refresh(db_job)
    return db_job


@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    """Delete a job description."""
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")
    
    db.delete(job)
    db.commit()
    return {"message": "Job description deleted successfully"}

