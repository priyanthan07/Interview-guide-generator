"""Routes for fetching evaluation data from existing Skillfully database."""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, distinct
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from ..database import get_db
from ..models_existing import Evaluation, EvaluationFeedback, EvaluationVoiceElsa, SkillsMap
from ..llm_service import llm_service
from ..schemas import SkillGap

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


# ============================================================================
# Pydantic Models for Agentic Guide Generation
# ============================================================================

class SkillRequirement(BaseModel):
    skill_name: str
    priority: str = "medium"  # high, medium, low
    min_score: int = 4  # Score threshold (out of 5)


class AgenticGuideRequest(BaseModel):
    session_ids: List[str]
    job_description: str
    required_skills: List[SkillRequirement]
    custom_instructions: Optional[str] = None
    num_questions: int = 8


# ============================================================================
# Campaign Endpoints
# ============================================================================

@router.get("/campaigns")
def get_campaigns(db: Session = Depends(get_db)):
    """Get all unique campaigns with candidate counts."""
    campaigns = db.query(
        Evaluation.campaign_id,
        Evaluation.campaign_name,
        func.count(distinct(Evaluation.email)).label('candidate_count'),
        func.count(distinct(Evaluation.session_id)).label('session_count'),
        func.max(Evaluation.created_at).label('last_activity')
    ).filter(
        Evaluation.campaign_name.isnot(None),
        Evaluation.campaign_name != ''
    ).group_by(
        Evaluation.campaign_id,
        Evaluation.campaign_name
    ).order_by(
        desc('last_activity')
    ).limit(50).all()
    
    return [
        {
            "campaign_id": str(c.campaign_id) if c.campaign_id else None,
            "campaign_name": c.campaign_name,
            "candidate_count": c.candidate_count,
            "session_count": c.session_count,
            "last_activity": c.last_activity.isoformat() if c.last_activity else None
        }
        for c in campaigns
    ]


@router.get("/campaigns/{campaign_id}/candidates")
def get_campaign_candidates(
    campaign_id: str, 
    limit: int = Query(100, le=300),
    db: Session = Depends(get_db)
):
    """Get candidates in a specific campaign with their evaluation summary (limited to 300 max)."""
    
    # Single efficient query - no inner loops
    candidates = db.query(
        Evaluation.email,
        func.count(distinct(Evaluation.session_id)).label('session_count'),
        func.count(Evaluation.id).label('evaluation_count'),
        func.max(Evaluation.created_at).label('last_activity'),
        func.array_agg(distinct(Evaluation.scenario_type)).label('scenario_types'),
        func.max(Evaluation.session_id).label('latest_session_id'),  # Get one session
        func.count(distinct(Evaluation.skill)).label('skills_count')
    ).filter(
        Evaluation.campaign_id == campaign_id,
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
            "name": c.email.split('@')[0].replace('.', ' ').replace('_', ' ').title() if '@' in c.email else c.email,
            "session_count": c.session_count,
            "evaluation_count": c.evaluation_count,
            "last_activity": c.last_activity.isoformat() if c.last_activity else None,
            "scenario_types": [x for x in (c.scenario_types or []) if x][:3],  # Limit to 3
            "session_ids": [],  # Removed to avoid large data transfer
            "latest_session_id": c.latest_session_id,
            "skills_evaluated": [],  # Removed individual skill names for performance
            "average_score": None  # Removed expensive calculation
        }
        for c in candidates
    ]


# ============================================================================
# Skills Endpoint
# ============================================================================

@router.get("/skills")
def get_all_skills(db: Session = Depends(get_db)):
    """Get all skills from skills_map for dropdown selection."""
    skills = db.query(SkillsMap).order_by(SkillsMap.skill_name).all()
    return [
        {
            "skill_id": s.skill_id,
            "skill_name": s.skill_name,
            "skill_prompt": s.skill_prompt[:200] if s.skill_prompt else None,
            "is_ai_generated": s.is_ai_generated
        }
        for s in skills
    ]


# ============================================================================
# Agentic Guide Generation Endpoint
# ============================================================================

@router.post("/generate-agentic-guide")
def generate_agentic_guide(
    request: AgenticGuideRequest,
    db: Session = Depends(get_db)
):
    """
    Generate agentic interview guides with chain-of-thought reasoning.
    
    Accepts:
    - session_ids: List of session IDs to generate guides for
    - job_description: The job description text (not stored in DB)
    - required_skills: List of skills with priority and min_score
    - custom_instructions: Optional additional context for generation
    - num_questions: Number of questions to generate per candidate
    """
    
    results = []
    
    for session_id in request.session_ids:
        try:
            guide = _generate_single_agentic_guide(
                session_id=session_id,
                job_description=request.job_description,
                required_skills=request.required_skills,
                custom_instructions=request.custom_instructions,
                num_questions=request.num_questions,
                db=db
            )
            results.append(guide)
        except HTTPException as e:
            results.append({
                "session_id": session_id,
                "error": e.detail,
                "success": False
            })
        except Exception as e:
            results.append({
                "session_id": session_id,
                "error": str(e),
                "success": False
            })
    
    return {
        "generated_at": datetime.utcnow().isoformat(),
        "job_description_provided": bool(request.job_description),
        "required_skills_count": len(request.required_skills),
        "candidates_processed": len(request.session_ids),
        "guides": results
    }


def _generate_single_agentic_guide(
    session_id: str,
    job_description: str,
    required_skills: List[SkillRequirement],
    custom_instructions: Optional[str],
    num_questions: int,
    db: Session
) -> dict:
    """Generate agentic guide for a single session with chain-of-thought reasoning."""
    
    # Get all evaluations for this session
    evaluations = db.query(Evaluation).filter(
        Evaluation.session_id == session_id
    ).all()
    
    if not evaluations:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    # Get feedback if available
    feedback = db.query(EvaluationFeedback).filter(
        EvaluationFeedback.session_id == session_id
    ).first()
    
    # Get voice evaluation if available (for ELSA scenarios)
    voice_eval = db.query(EvaluationVoiceElsa).filter(
        EvaluationVoiceElsa.session_id == session_id
    ).first()
    
    first_eval = evaluations[0]
    candidate_email = first_eval.email or "Candidate"
    candidate_name = candidate_email.split('@')[0].replace('.', ' ').replace('_', ' ').title() if '@' in candidate_email else candidate_email
    role = first_eval.scenario_name or first_eval.campaign_name or "Unknown Role"
    scenario_type = first_eval.scenario_type
    
    # Auto-derive skills from evaluations if none provided
    if not required_skills:
        # Extract unique skills from evaluations and treat them all as required
        derived_skills = set()
        for eval in evaluations:
            if eval.skill:
                derived_skills.add(eval.skill)
        
        required_skills = [
            SkillRequirement(
                skill_name=skill,
                priority="medium",
                min_score=4
            )
            for skill in derived_skills
        ]
    
    # Build required skills lookup
    required_skills_map = {s.skill_name.lower().replace('-', '_').replace(' ', '_'): s for s in required_skills}
    
    # Process evaluation results to classify skills
    verified_skills = []
    skill_gaps = []
    skills_evaluated = []
    evaluation_evidence = []
    
    for eval in evaluations:
        skill_name = eval.skill or "General Assessment"
        result = eval.result or {}
        transcript = eval.transcript
        
        # Extract score and reason from result
        score = None
        reason = None
        
        if isinstance(result, dict):
            score = result.get('score', result.get('overall_score', result.get('rating')))
            reason = result.get('reason', result.get('rationale', result.get('feedback', '')))
            
            # Handle string scores like "3/5"
            if isinstance(score, str) and '/' in score:
                try:
                    num, denom = score.split('/')
                    score = float(num)
                except:
                    score = 2.5
        
        if score is None:
            score = 2.5  # Default middle score (out of 5)
        
        # Normalize skill name for comparison
        skill_key = skill_name.lower().replace('-', '_').replace(' ', '_')
        
        # Get requirement info if this skill is required
        requirement = required_skills_map.get(skill_key)
        min_score = requirement.min_score if requirement else 4
        priority = requirement.priority if requirement else "medium"
        
        # Build evidence object
        evidence = {
            "skill_name": skill_name,
            "score": score,
            "max_score": 5,
            "reason": reason,
            "scenario_type": scenario_type,
            "transcript_snippet": transcript[:300] if transcript else None,
            "is_required": requirement is not None,
            "priority": priority
        }
        evaluation_evidence.append(evidence)
        skills_evaluated.append(skill_name)
        
        # Classify skill
        if score >= min_score:
            verified_skills.append({
                "skill_name": skill_name,
                "score": score,
                "evidence": reason
            })
        else:
            gap_severity = "minor" if score >= 3 else "moderate" if score >= 2 else "significant"
            skill_gaps.append({
                "skill_name": skill_name,
                "current_score": score,
                "required_score": min_score,
                "gap_severity": gap_severity,
                "priority": priority,
                "evidence": reason,
                "transcript_snippet": transcript[:200] if transcript else None
            })
    
    # Identify skills NOT tested (required but not in evaluations)
    skills_not_tested = []
    evaluated_skill_keys = {s.lower().replace('-', '_').replace(' ', '_') for s in skills_evaluated}
    
    for req_skill in required_skills:
        skill_key = req_skill.skill_name.lower().replace('-', '_').replace(' ', '_')
        if skill_key not in evaluated_skill_keys:
            skills_not_tested.append({
                "skill_name": req_skill.skill_name,
                "priority": req_skill.priority,
                "reason": "This skill was not evaluated in the simulation"
            })
    
    # Get feedback summary if available
    feedback_summary = None
    if feedback and feedback.feedback:
        if isinstance(feedback.feedback, dict):
            key_strengths = feedback.feedback.get('Key_Strengths', [])
            if key_strengths:
                feedback_summary = {
                    "key_strengths": [
                        {"title": s.get('title'), "detail": s.get('strength')}
                        for s in key_strengths if isinstance(s, dict)
                    ]
                }
    
    # Get voice evaluation summary if available
    voice_summary = None
    if voice_eval and voice_eval.elsa_score:
        voice_summary = {
            "elsa_score": voice_eval.elsa_score,
            "attributes": voice_eval.result.get('reasons', []) if voice_eval.result else []
        }
    
    # Generate the agentic guide using LLM
    guide = llm_service.generate_agentic_guide(
        candidate_name=candidate_name,
        role=role,
        job_description=job_description,
        verified_skills=verified_skills,
        skill_gaps=skill_gaps,
        skills_not_tested=skills_not_tested,
        evaluation_evidence=evaluation_evidence,
        feedback_summary=feedback_summary,
        voice_summary=voice_summary,
        custom_instructions=custom_instructions,
        num_questions=num_questions,
        scenario_type=scenario_type
    )
    
    return {
        "session_id": session_id,
        "candidate_name": candidate_name,
        "candidate_email": candidate_email,
        "role": role,
        "scenario_type": scenario_type,
        "success": True,
        "classification": {
            "verified_skills": verified_skills,
            "skill_gaps": skill_gaps,
            "skills_not_tested": skills_not_tested
        },
        "guide": guide,
        "metadata": {
            "total_skills_evaluated": len(skills_evaluated),
            "feedback_available": feedback is not None,
            "voice_evaluation_available": voice_eval is not None,
            "custom_instructions_provided": bool(custom_instructions)
        }
    }


# ============================================================================
# Legacy Endpoints (kept for backward compatibility)
# ============================================================================

@router.get("/sessions")
def get_unique_sessions(
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """Get unique sessions with their latest evaluation info."""
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
    
    evaluations = db.query(Evaluation).filter(
        Evaluation.session_id == session_id
    ).all()
    
    if not evaluations:
        raise HTTPException(status_code=404, detail="Session not found")
    
    feedback = db.query(EvaluationFeedback).filter(
        EvaluationFeedback.session_id == session_id
    ).first()
    
    voice_eval = db.query(EvaluationVoiceElsa).filter(
        EvaluationVoiceElsa.session_id == session_id
    ).first()
    
    skills_evaluated = []
    for eval in evaluations:
        skill_data = {
            "skill": eval.skill,
            "result": eval.result,
            "transcript": eval.transcript[:500] if eval.transcript else None,
            "created_at": eval.created_at.isoformat() if eval.created_at else None
        }
        skills_evaluated.append(skill_data)
    
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


@router.get("/candidates")
def get_candidates_list(
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """Get list of candidates with their evaluation summary."""
    
    candidates = db.query(
        Evaluation.email,
        func.count(distinct(Evaluation.session_id)).label('session_count'),
        func.max(Evaluation.created_at).label('last_activity'),
        func.array_agg(distinct(Evaluation.campaign_name)).label('campaigns'),
        func.array_agg(distinct(Evaluation.scenario_name)).label('scenarios')
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
