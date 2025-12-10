"""Routes for fetching evaluation data from existing Skillfully database."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models_existing import Evaluation, EvaluationFeedback, EvaluationVoiceElsa, SkillsMap
from ..llm_service import llm_service
from ..schemas import SkillGap

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.get("/sessions")
def get_unique_sessions(
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """Get unique sessions with their latest evaluation info."""
    # Get distinct sessions with candidate info
    sessions = db.query(
        Evaluation.session_id,
        Evaluation.email,
        Evaluation.campaign_name,
        Evaluation.scenario_name,
        Evaluation.scenario_type,
        func.max(Evaluation.created_at).label('last_evaluation'),
        func.count(Evaluation.id).label('evaluation_count')
    ).group_by(
        Evaluation.session_id,
        Evaluation.email,
        Evaluation.campaign_name,
        Evaluation.scenario_name,
        Evaluation.scenario_type
    ).order_by(
        desc('last_evaluation')
    ).limit(limit).all()
    
    return [
        {
            "session_id": s.session_id,
            "email": s.email or "Unknown",
            "campaign_name": s.campaign_name or "Unknown Campaign",
            "scenario_name": s.scenario_name or "Unknown Scenario",
            "scenario_type": s.scenario_type,
            "last_evaluation": s.last_evaluation.isoformat() if s.last_evaluation else None,
            "evaluation_count": s.evaluation_count
        }
        for s in sessions
    ]


@router.get("/session/{session_id}")
def get_session_evaluations(session_id: str, db: Session = Depends(get_db)):
    """Get all evaluation data for a specific session."""
    
    # Get main evaluations
    evaluations = db.query(Evaluation).filter(
        Evaluation.session_id == session_id
    ).all()
    
    if not evaluations:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get feedback
    feedback = db.query(EvaluationFeedback).filter(
        EvaluationFeedback.session_id == session_id
    ).first()
    
    # Get voice evaluation (ELSA)
    voice_eval = db.query(EvaluationVoiceElsa).filter(
        EvaluationVoiceElsa.session_id == session_id
    ).first()
    
    # Process evaluations into skills with scores
    skills_evaluated = []
    for eval in evaluations:
        skill_data = {
            "skill": eval.skill,
            "result": eval.result,
            "transcript": eval.transcript[:500] if eval.transcript else None,  # Truncate
            "created_at": eval.created_at.isoformat() if eval.created_at else None
        }
        skills_evaluated.append(skill_data)
    
    # Get first evaluation for meta info
    first_eval = evaluations[0]
    
    return {
        "session_id": session_id,
        "email": first_eval.email,
        "campaign_name": first_eval.campaign_name,
        "scenario_name": first_eval.scenario_name,
        "scenario_type": first_eval.scenario_type,
        "simulation_type": first_eval.simulation_archtype,
        "skills_evaluated": skills_evaluated,
        "feedback": {
            "evaluation_results": feedback.evaluation_results if feedback else None,
            "feedback": feedback.feedback if feedback else None
        } if feedback else None,
        "voice_evaluation": {
            "elsa_score": voice_eval.elsa_score if voice_eval else None,
            "result": voice_eval.result if voice_eval else None
        } if voice_eval else None
    }


@router.get("/skills")
def get_all_skills(db: Session = Depends(get_db)):
    """Get all skills from skills_map."""
    skills = db.query(SkillsMap).all()
    return [
        {
            "skill_id": s.skill_id,
            "skill_name": s.skill_name,
            "skill_prompt": s.skill_prompt[:200] if s.skill_prompt else None,  # Truncate
            "is_ai_generated": s.is_ai_generated
        }
        for s in skills
    ]


@router.post("/generate-guide/{session_id}")
def generate_interview_guide_for_session(
    session_id: str,
    num_questions: int = Query(8, ge=5, le=15),
    db: Session = Depends(get_db)
):
    """Generate interview guide based on session evaluation data."""
    
    # Get all evaluations for this session
    evaluations = db.query(Evaluation).filter(
        Evaluation.session_id == session_id
    ).all()
    
    if not evaluations:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get feedback if available
    feedback = db.query(EvaluationFeedback).filter(
        EvaluationFeedback.session_id == session_id
    ).first()
    
    # Get voice evaluation if available
    voice_eval = db.query(EvaluationVoiceElsa).filter(
        EvaluationVoiceElsa.session_id == session_id
    ).first()
    
    first_eval = evaluations[0]
    candidate_email = first_eval.email or "Candidate"
    role = first_eval.scenario_name or first_eval.campaign_name or "Unknown Role"
    
    # Process evaluation results to identify skills and gaps
    verified_skills = []
    skill_gaps = []
    evaluation_notes = []
    
    for eval in evaluations:
        skill_name = eval.skill or "General Assessment"
        result = eval.result or {}
        
        # Try to extract score from result JSON
        score = None
        rationale = None
        
        if isinstance(result, dict):
            # Common patterns in evaluation results
            score = result.get('score', result.get('overall_score', result.get('rating')))
            rationale = result.get('rationale', result.get('feedback', result.get('explanation', '')))
            
            # If score is a string like "3/5", convert
            if isinstance(score, str) and '/' in score:
                try:
                    num, denom = score.split('/')
                    score = (float(num) / float(denom)) * 100
                except:
                    score = 50
            elif isinstance(score, (int, float)):
                # Normalize to 0-100 if needed
                if score <= 5:
                    score = score * 20
                elif score <= 10:
                    score = score * 10
        
        if score is None:
            score = 50  # Default middle score
        
        # Determine if this is a gap or verified skill
        if score >= 70:
            verified_skills.append(skill_name)
        else:
            gap_severity = "minor" if score >= 60 else "moderate" if score >= 40 else "significant"
            skill_gaps.append(SkillGap(
                skill_name=skill_name,
                current_score=score,
                required_score=70,
                gap_severity=gap_severity,
                importance_to_role="high",
                suggested_probe_areas=[
                    f"Depth of experience with {skill_name}",
                    f"Practical application of {skill_name}",
                    "Specific examples and outcomes"
                ]
            ))
        
        if rationale:
            evaluation_notes.append(f"{skill_name}: {rationale}")
    
    # Add feedback notes if available
    if feedback and feedback.feedback:
        if isinstance(feedback.feedback, dict):
            for key, value in feedback.feedback.items():
                if isinstance(value, str):
                    evaluation_notes.append(f"Feedback - {key}: {value}")
    
    # Add voice evaluation notes if available
    if voice_eval and voice_eval.elsa_score:
        elsa = voice_eval.elsa_score
        if isinstance(elsa, dict):
            pronunciation = elsa.get('pronunciation', elsa.get('overall'))
            if pronunciation:
                evaluation_notes.append(f"Voice/Pronunciation Score: {pronunciation}")
    
    # Generate interview guide using LLM
    guide = llm_service.generate_interview_questions(
        candidate_name=candidate_email.split('@')[0] if '@' in candidate_email else candidate_email,
        role=role,
        skill_gaps=skill_gaps,
        verified_skills=verified_skills,
        job_description=f"Role: {role}\nScenario: {first_eval.scenario_type or 'General'}\nCampaign: {first_eval.campaign_name or 'N/A'}",
        evaluation_rationale="\n".join(evaluation_notes[:10]),  # Limit notes
        num_questions=num_questions,
        interview_type="technical" if "tech" in (first_eval.scenario_type or "").lower() else "behavioral"
    )
    
    return {
        "session_id": session_id,
        "candidate": candidate_email,
        "role": role,
        "verified_skills": verified_skills,
        "skill_gaps": [g.model_dump() for g in skill_gaps],
        "guide": guide,
        "generated_at": datetime.utcnow().isoformat()
    }


@router.get("/candidates")
def get_candidates_list(
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """Get list of candidates with their evaluation summary."""
    
    # Get distinct candidates by email with aggregated stats
    candidates = db.query(
        Evaluation.email,
        func.count(func.distinct(Evaluation.session_id)).label('session_count'),
        func.max(Evaluation.created_at).label('last_activity'),
        func.array_agg(func.distinct(Evaluation.campaign_name)).label('campaigns'),
        func.array_agg(func.distinct(Evaluation.scenario_name)).label('scenarios')
    ).filter(
        Evaluation.email.isnot(None),
        Evaluation.email != ''
    ).group_by(
        Evaluation.email
    ).order_by(
        desc('last_activity')
    ).limit(limit).all()
    
    return [
        {
            "email": c.email,
            "name": c.email.split('@')[0].replace('.', ' ').replace('_', ' ').title() if c.email and '@' in c.email else c.email,
            "session_count": c.session_count,
            "last_activity": c.last_activity.isoformat() if c.last_activity else None,
            "campaigns": [x for x in (c.campaigns or []) if x],
            "scenarios": [x for x in (c.scenarios or []) if x]
        }
        for c in candidates
    ]


@router.get("/candidate/{email}/sessions")
def get_candidate_sessions(email: str, db: Session = Depends(get_db)):
    """Get all sessions for a specific candidate."""
    
    sessions = db.query(
        Evaluation.session_id,
        Evaluation.campaign_name,
        Evaluation.scenario_name,
        Evaluation.scenario_type,
        func.min(Evaluation.created_at).label('started_at'),
        func.count(Evaluation.id).label('evaluation_count')
    ).filter(
        Evaluation.email == email
    ).group_by(
        Evaluation.session_id,
        Evaluation.campaign_name,
        Evaluation.scenario_name,
        Evaluation.scenario_type
    ).order_by(
        desc('started_at')
    ).all()
    
    return [
        {
            "session_id": s.session_id,
            "campaign_name": s.campaign_name,
            "scenario_name": s.scenario_name,
            "scenario_type": s.scenario_type,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "evaluation_count": s.evaluation_count
        }
        for s in sessions
    ]

