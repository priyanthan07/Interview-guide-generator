import json
import logging
from typing import List, Optional, Dict, Any
from openai import OpenAI
from .config import settings
from .schemas import SkillGap

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of OpenAI client - checks API key on each access."""
        if self._client is None and settings.OPENAI_API_KEY:
            self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI client initialized successfully")
        return self._client
    
    def generate_agentic_guide(
        self,
        candidate_name: str,
        role: str,
        job_description: str,
        verified_skills: List[Dict[str, Any]],
        skill_gaps: List[Dict[str, Any]],
        skills_not_tested: List[Dict[str, Any]],
        evaluation_evidence: List[Dict[str, Any]],
        feedback_summary: Optional[Dict[str, Any]] = None,
        voice_summary: Optional[Dict[str, Any]] = None,
        custom_instructions: Optional[str] = None,
        num_questions: int = 8,
        scenario_type: Optional[str] = None
    ) -> dict:
        """
        Generate agentic interview guide with chain-of-thought reasoning.
        
        This method performs step-by-step reasoning to:
        1. Analyze evaluation evidence for each skill
        2. Determine significance of gaps relative to job requirements
        3. Generate targeted questions with full reasoning chains
        4. Include specific evidence citations from simulation data
        """
        
        # Check if we have an API key
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set - returning mock agentic response")
            return self._get_mock_agentic_response(
                candidate_name, verified_skills, skill_gaps, 
                skills_not_tested, num_questions
            )
        
        # Build the evidence context
        evidence_text = self._format_evidence(evaluation_evidence)
        verified_text = self._format_verified_skills(verified_skills)
        gaps_text = self._format_skill_gaps(skill_gaps)
        not_tested_text = self._format_not_tested_skills(skills_not_tested)
        feedback_text = self._format_feedback(feedback_summary)
        voice_text = self._format_voice_summary(voice_summary)
        
        # Build the comprehensive prompt
        prompt = f"""You are an expert interview strategist using chain-of-thought reasoning to generate a highly targeted, evidence-based interview guide.

## CANDIDATE CONTEXT
- **Name**: {candidate_name}
- **Role Applied**: {role}
- **Simulation Type**: {scenario_type or "General Assessment"}

## JOB DESCRIPTION
{job_description}

## EVALUATION EVIDENCE FROM SIMULATION
{evidence_text}

## SKILL CLASSIFICATION RESULTS

### VERIFIED SKILLS (Score >= 4/5)
{verified_text}

### SKILL GAPS (Score < 4/5 - Need probing)
{gaps_text}

### SKILLS NOT TESTED IN SIMULATION (Required by job but not evaluated)
{not_tested_text}

{f"## FEEDBACK SUMMARY{chr(10)}{feedback_text}" if feedback_text else ""}

{f"## VOICE/COMMUNICATION ASSESSMENT{chr(10)}{voice_text}" if voice_text else ""}

{f"## RECRUITER CUSTOM INSTRUCTIONS{chr(10)}{custom_instructions}" if custom_instructions else ""}

---

## YOUR TASK: Generate an Agentic Interview Guide

For this interview guide, you must:

1. **SECTION 1 - VERIFIED SKILLS**: For each verified skill (score 4+), provide a brief acknowledgment statement. These are NOT counted toward the num_questions target - they are quick confirmations only.

2. **SECTION 2 - SKILL GAPS**: For each skill gap, perform chain-of-thought reasoning:
   - **Data Observation**: What specific score/evidence do we have?
   - **Evidence from Transcript/Feedback**: Quote or cite specific observations
   - **Gap Significance**: Why does this matter for THIS specific role?
   - **Interview Strategy**: What approach will reveal true capability vs. simulation performance?
   - **Question Rationale**: Why is this specific question the right one to ask?
   
   Then generate 1-2 targeted questions per gap with:
   - The question text (behavioral/situational)
   - What to listen for (3 specific indicators)
   - Red flags (2-3 warning signs)
   - Follow-up questions (2-3 probing questions)

3. **SECTION 3 - SKILLS NOT TESTED**: For each skill required by the job but not tested in simulation:
   - **Note**: Acknowledge it wasn't tested
   - **Relevance to Role**: Why this skill matters for the job
   - **Question Strategy**: Standard behavioral assessment approach
   
   Generate 1 question per untested skill.

4. **EXECUTIVE SUMMARY**: 3-4 sentences synthesizing the candidate's profile and interview focus areas.

Generate EXACTLY {num_questions} questions total from SKILL GAPS and SKILLS NOT TESTED sections only. Verified skills receive acknowledgments, NOT questions, and do NOT count toward this target.

You MUST respond with valid JSON in this exact format:
{{
    "executive_summary": "3-4 sentence synthesis of candidate profile and interview strategy...",
    "interview_duration_estimate": "30-45 minutes",
    "sections": {{
        "verified_skills": [
            {{
                "skill_name": "Skill Name",
                "score": 4.5,
                "acknowledgment": "Brief acknowledgment statement for this verified skill...",
                "time_estimate": "1 minute"
            }}
        ],
        "skill_gaps": [
            {{
                "skill_name": "Skill Name",
                "current_score": 2,
                "priority": "high",
                "reasoning": {{
                    "data_observation": "Scored 2/5 in EMAIL_CONVERSATION simulation",
                    "evidence_from_evaluation": "User responses lacked context...",
                    "gap_significance": "Critical for role - daily client communication required",
                    "interview_strategy": "Behavioral questions to assess real-world application",
                    "question_rationale": "STAR format to elicit concrete examples"
                }},
                "questions": [
                    {{
                        "question": "The interview question text...",
                        "what_to_listen_for": ["indicator1", "indicator2", "indicator3"],
                        "red_flags": ["warning1", "warning2"],
                        "follow_ups": ["follow_up1", "follow_up2"],
                        "time_estimate": "4-5 minutes"
                    }}
                ]
            }}
        ],
        "skills_not_tested": [
            {{
                "skill_name": "Skill Name",
                "priority": "medium",
                "reasoning": {{
                    "note": "This skill was not evaluated in simulation",
                    "relevance_to_role": "Important because...",
                    "question_strategy": "Standard behavioral assessment"
                }},
                "question": {{
                    "question": "The interview question text...",
                    "what_to_listen_for": ["indicator1", "indicator2", "indicator3"],
                    "red_flags": ["warning1", "warning2"],
                    "follow_ups": ["follow_up1", "follow_up2"],
                    "time_estimate": "4-5 minutes"
                }}
            }}
        ]
    }},
    "overall_red_flags": ["Overall concern 1", "Overall concern 2"],
    "overall_strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "interview_tips": ["Tip 1 for conducting this interview", "Tip 2"]
}}"""

        try:
            logger.info(f"Generating agentic guide for candidate: {candidate_name}, target questions: {num_questions}")
            
            # Use iterative approach to ensure exact question count
            result = self._generate_guide_iteratively(
                prompt=prompt,
                num_questions=num_questions,
                candidate_name=candidate_name,
                role=role,
                job_description=job_description,
                skill_gaps=skill_gaps,
                skills_not_tested=skills_not_tested,
                scenario_type=scenario_type
            )
            
            if result:
                logger.info(f"Successfully generated agentic guide with {self._count_questions(result)} questions")
                return result
            else:
                logger.error("Failed to generate guide after iterations")
                return self._get_mock_agentic_response(
                    candidate_name, verified_skills, skill_gaps,
                    skills_not_tested, num_questions
                )
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error in agentic guide: {e}")
            return self._get_mock_agentic_response(
                candidate_name, verified_skills, skill_gaps,
                skills_not_tested, num_questions
            )
        except Exception as e:
            logger.error(f"OpenAI API Error in agentic guide: {type(e).__name__}: {e}")
            return self._get_mock_agentic_response(
                candidate_name, verified_skills, skill_gaps,
                skills_not_tested, num_questions
            )
    
    def _format_evidence(self, evidence: List[Dict]) -> str:
        """Format evaluation evidence for the prompt."""
        if not evidence:
            return "No evaluation evidence available."
        
        lines = []
        for e in evidence:
            lines.append(f"- **{e.get('skill_name', 'Unknown')}**: Score {e.get('score', 'N/A')}/5")
            if e.get('reason'):
                lines.append(f"  Reason: {e['reason'][:200]}...")
            if e.get('transcript_snippet'):
                lines.append(f"  Transcript: \"{e['transcript_snippet'][:150]}...\"")
            if e.get('is_required'):
                lines.append(f"  Priority: {e.get('priority', 'medium').upper()}")
        return "\n".join(lines)
    
    def _format_verified_skills(self, skills: List[Dict]) -> str:
        """Format verified skills for the prompt."""
        if not skills:
            return "No skills verified at 4+ level."
        
        lines = []
        for s in skills:
            lines.append(f"- {s.get('skill_name', 'Unknown')}: Score {s.get('score', 'N/A')}/5")
            if s.get('evidence'):
                lines.append(f"  Evidence: {s['evidence'][:150]}")
        return "\n".join(lines)
    
    def _format_skill_gaps(self, gaps: List[Dict]) -> str:
        """Format skill gaps for the prompt."""
        if not gaps:
            return "No significant skill gaps identified."
        
        lines = []
        for g in gaps:
            lines.append(f"- **{g.get('skill_name', 'Unknown')}**: Score {g.get('current_score', 'N/A')}/5 (Required: {g.get('required_score', 4)})")
            lines.append(f"  Severity: {g.get('gap_severity', 'unknown').upper()}, Priority: {g.get('priority', 'medium').upper()}")
            if g.get('evidence'):
                lines.append(f"  Evidence: {g['evidence'][:150]}")
            if g.get('transcript_snippet'):
                lines.append(f"  From transcript: \"{g['transcript_snippet'][:100]}...\"")
        return "\n".join(lines)
    
    def _format_not_tested_skills(self, skills: List[Dict]) -> str:
        """Format skills not tested for the prompt."""
        if not skills:
            return "All required skills were tested in simulation."
        
        lines = []
        for s in skills:
            lines.append(f"- {s.get('skill_name', 'Unknown')}: Priority {s.get('priority', 'medium').upper()}")
            if s.get('reason'):
                lines.append(f"  Note: {s['reason']}")
        return "\n".join(lines)
    
    def _format_feedback(self, feedback: Optional[Dict]) -> str:
        """Format feedback summary for the prompt."""
        if not feedback:
            return ""
        
        lines = []
        strengths = feedback.get('key_strengths', [])
        for s in strengths:
            if isinstance(s, dict):
                lines.append(f"- **{s.get('title', 'Strength')}**: {s.get('detail', '')[:100]}")
        return "\n".join(lines) if lines else ""
    
    def _format_voice_summary(self, voice: Optional[Dict]) -> str:
        """Format voice evaluation summary for the prompt."""
        if not voice:
            return ""
        
        lines = []
        elsa = voice.get('elsa_score', {})
        if elsa:
            lines.append(f"- Pronunciation CEFR: {elsa.get('pronunciation_cefr', 'N/A')}")
            lines.append(f"- Fluency CEFR: {elsa.get('fluency_cefr', 'N/A')}")
            lines.append(f"- Grammar CEFR: {elsa.get('grammar_cefr', 'N/A')}")
            lines.append(f"- Overall CEFR: {elsa.get('overall_cefr', 'N/A')}")
        
        attributes = voice.get('attributes', [])
        for attr in attributes[:3]:
            if isinstance(attr, dict):
                lines.append(f"- {attr.get('attribute', 'N/A')}: {attr.get('reasoning', '')[:100]}")
        
        return "\n".join(lines) if lines else ""
    
    def _count_questions(self, result: Dict) -> int:
        """Count total questions in the generated guide (excluding verified skills - they are acknowledgments only)."""
        count = 0
        sections = result.get('sections', {})
        
        # DO NOT count verified skills - they are acknowledgments, not questions
        # Only count skill gap questions
        for gap in sections.get('skill_gaps', []):
            count += len(gap.get('questions', []))
        
        # Count not tested skill questions
        for skill in sections.get('skills_not_tested', []):
            if skill.get('question'):
                count += 1
        
        return count
    
    def _generate_guide_iteratively(
        self,
        prompt: str,
        num_questions: int,
        candidate_name: str,
        role: str,
        job_description: str,
        skill_gaps: List[Dict[str, Any]],
        skills_not_tested: List[Dict[str, Any]],
        scenario_type: Optional[str] = None,
        max_iterations: int = 3
    ) -> Optional[Dict[str, Any]]:
        """
        Generate interview guide iteratively, calling LLM again if needed to reach target question count.
        
        This approach ensures the LLM generates all required questions rather than using fallback templates.
        """
        system_message = """You are an expert interview strategist who uses chain-of-thought reasoning to create highly targeted, evidence-based interview guides. 

Your guides are known for:
1. Citing specific evidence from evaluation data
2. Clear reasoning chains that justify each question
3. Practical, actionable interview guidance
4. Balancing thorough assessment with time efficiency

You must always respond with valid JSON only, no additional text or markdown."""

        # First iteration - generate initial guide
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            max_tokens=6000,
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        if not content:
            return None
        
        result = json.loads(content)
        current_count = self._count_questions(result)
        logger.info(f"Initial generation: {current_count}/{num_questions} questions")
        
        # If we have more than needed, trim
        if current_count > num_questions:
            self._trim_questions(result.get("sections", {}), num_questions)
            return result
        
        # If we have exact count, return
        if current_count == num_questions:
            return result
        
        # Iteratively generate more questions until we reach the target
        for iteration in range(max_iterations):
            needed = num_questions - self._count_questions(result)
            if needed <= 0:
                break
            
            logger.info(f"Iteration {iteration + 1}: Need {needed} more questions")
            
            # Build prompt for additional questions
            additional_prompt = self._build_additional_questions_prompt(
                candidate_name=candidate_name,
                role=role,
                job_description=job_description,
                skill_gaps=skill_gaps,
                skills_not_tested=skills_not_tested,
                existing_questions=self._extract_existing_questions(result),
                needed=needed,
                scenario_type=scenario_type
            )
            
            # Call LLM for additional questions
            additional_response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": additional_prompt}
                ],
                max_tokens=4000,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            additional_content = additional_response.choices[0].message.content
            if additional_content:
                additional_result = json.loads(additional_content)
                self._merge_additional_questions(result, additional_result)
                logger.info(f"After iteration {iteration + 1}: {self._count_questions(result)} questions")
        
        # Final trim if we overshot
        final_count = self._count_questions(result)
        if final_count > num_questions:
            self._trim_questions(result.get("sections", {}), num_questions)
        
        return result
    
    def _build_additional_questions_prompt(
        self,
        candidate_name: str,
        role: str,
        job_description: str,
        skill_gaps: List[Dict[str, Any]],
        skills_not_tested: List[Dict[str, Any]],
        existing_questions: List[str],
        needed: int,
        scenario_type: Optional[str] = None
    ) -> str:
        """Build prompt to generate additional questions."""
        gaps_text = self._format_skill_gaps(skill_gaps)
        not_tested_text = self._format_not_tested_skills(skills_not_tested)
        existing_text = "\n".join([f"- {q}" for q in existing_questions]) if existing_questions else "None yet"
        
        return f"""You are generating ADDITIONAL interview questions for a candidate.

## CONTEXT
- **Candidate**: {candidate_name}
- **Role**: {role}
- **Simulation Type**: {scenario_type or "General Assessment"}

## JOB DESCRIPTION
{job_description}

## SKILL GAPS TO PROBE
{gaps_text}

## SKILLS NOT TESTED
{not_tested_text}

## EXISTING QUESTIONS (DO NOT REPEAT THESE)
{existing_text}

## YOUR TASK
Generate EXACTLY {needed} NEW interview questions that:
1. Are DIFFERENT from the existing questions listed above
2. Target the skill gaps or untested skills
3. Use behavioral/situational format (STAR method)
4. Include what to listen for, red flags, and follow-ups

Respond with valid JSON in this format:
{{
    "additional_questions": [
        {{
            "skill_name": "The skill this question targets",
            "priority": "high/medium/low",
            "question": {{
                "question": "The interview question text...",
                "what_to_listen_for": ["indicator1", "indicator2", "indicator3"],
                "red_flags": ["warning1", "warning2"],
                "follow_ups": ["follow_up1", "follow_up2"],
                "time_estimate": "4-5 minutes"
            }}
        }}
    ]
}}

Generate EXACTLY {needed} questions. No more, no less."""
    
    def _extract_existing_questions(self, result: Dict[str, Any]) -> List[str]:
        """Extract all existing question texts from a guide result (excludes verified skill acknowledgments)."""
        questions = []
        sections = result.get("sections", {})
        
        # DO NOT extract from verified skills - they are acknowledgments, not questions
        
        # From skill gaps
        for gap in sections.get("skill_gaps", []):
            for q in gap.get("questions", []):
                if q.get("question"):
                    questions.append(q["question"])
        
        # From skills not tested
        for skill in sections.get("skills_not_tested", []):
            question_obj = skill.get("question", {})
            if isinstance(question_obj, dict) and question_obj.get("question"):
                questions.append(question_obj["question"])
        
        return questions
    
    def _merge_additional_questions(self, result: Dict[str, Any], additional: Dict[str, Any]) -> None:
        """Merge additional questions into the result, adding to skill_gaps section."""
        sections = result.setdefault("sections", {})
        sections.setdefault("skill_gaps", [])
        
        additional_questions = additional.get("additional_questions", [])
        
        for item in additional_questions:
            skill_name = item.get("skill_name", "General")
            question_data = item.get("question", {})
            
            # Find existing gap with this skill name or create new one
            existing_gap = None
            for gap in sections["skill_gaps"]:
                if gap.get("skill_name", "").lower() == skill_name.lower():
                    existing_gap = gap
                    break
            
            if existing_gap:
                existing_gap.setdefault("questions", []).append(question_data)
            else:
                # Create new skill gap entry
                sections["skill_gaps"].append({
                    "skill_name": skill_name,
                    "current_score": 0,
                    "priority": item.get("priority", "medium"),
                    "reasoning": {
                        "data_observation": "Additional probing question",
                        "evidence_from_evaluation": "Generated to meet interview coverage requirements",
                        "gap_significance": "Important for comprehensive assessment",
                        "interview_strategy": "Behavioral assessment",
                        "question_rationale": "Ensures thorough evaluation of candidate"
                    },
                    "questions": [question_data]
                })
    
    def _trim_questions(self, sections: Dict[str, Any], target: int) -> None:
        """Trim questions down to the target count, preserving structure. Verified skills are always preserved (they don't count toward target)."""
        remaining = target
        
        # ALWAYS preserve verified skills - they are acknowledgments, not questions
        # They don't count toward the target
        
        # Keep skill gap questions first (they carry the most depth)
        trimmed_gaps = []
        for gap in sections.get("skill_gaps", []):
            questions = gap.get("questions", []) or []
            if remaining <= 0:
                gap["questions"] = []
            else:
                gap["questions"] = questions[:remaining]
                remaining -= len(gap["questions"])
            if gap.get("questions"):
                trimmed_gaps.append(gap)
        sections["skill_gaps"] = trimmed_gaps
        
        # Then keep skills_not_tested (1 question each)
        if remaining > 0:
            kept_not_tested = []
            for item in sections.get("skills_not_tested", []):
                if remaining <= 0:
                    break
                kept_not_tested.append(item)
                remaining -= 1
            sections["skills_not_tested"] = kept_not_tested
        else:
            sections["skills_not_tested"] = []
    
    def _get_mock_agentic_response(
        self,
        candidate_name: str,
        verified_skills: List[Dict],
        skill_gaps: List[Dict],
        skills_not_tested: List[Dict],
        num_questions: int
    ) -> dict:
        """Generate mock agentic response for testing without API key."""
        logger.info("Generating mock agentic response")
        
        # Build verified skills section
        verified_section = []
        for skill in verified_skills[:3]:
            verified_section.append({
                "skill_name": skill.get('skill_name', 'Unknown Skill'),
                "score": skill.get('score', 4),
                "acknowledgment": f"Strong performance in {skill.get('skill_name', 'this skill')} - demonstrated competency in simulation.",
                "time_estimate": "1 minute"
            })
        
        # Build skill gaps section with reasoning
        gaps_section = []
        for gap in skill_gaps[:3]:
            gaps_section.append({
                "skill_name": gap.get('skill_name', 'Unknown Skill'),
                "current_score": gap.get('current_score', 2),
                "priority": gap.get('priority', 'medium'),
                "reasoning": {
                    "data_observation": f"Scored {gap.get('current_score', 2)}/5 in simulation assessment",
                    "evidence_from_evaluation": gap.get('evidence', 'Performance below expected threshold')[:150],
                    "gap_significance": f"This skill is {gap.get('priority', 'important')} for the role",
                    "interview_strategy": "Use behavioral questions to assess real-world application",
                    "question_rationale": "STAR format questions will help reveal actual experience depth"
                },
                "questions": [
                    {
                        "question": f"Tell me about a specific situation where you had to apply {gap.get('skill_name', 'this skill')} under pressure. What was the context, and what approach did you take?",
                        "what_to_listen_for": [
                            "Specific, detailed example with context",
                            "Clear problem-solving approach",
                            "Measurable outcomes or results"
                        ],
                        "red_flags": [
                            "Vague or hypothetical answers",
                            "Blaming others for failures",
                            "Cannot articulate specific actions taken"
                        ],
                        "follow_ups": [
                            "What was the outcome?",
                            "What would you do differently now?",
                            "How did you measure success?"
                        ],
                        "time_estimate": "4-5 minutes"
                    }
                ]
            })
        
        # Build not tested section
        not_tested_section = []
        for skill in skills_not_tested[:2]:
            not_tested_section.append({
                "skill_name": skill.get('skill_name', 'Unknown Skill'),
                "priority": skill.get('priority', 'medium'),
                "reasoning": {
                    "note": "This skill was not evaluated in the simulation",
                    "relevance_to_role": "This skill is required based on job description",
                    "question_strategy": "Standard behavioral assessment approach"
                },
                "question": {
                    "question": f"Describe a time when you had to demonstrate {skill.get('skill_name', 'this skill')} in a professional setting.",
                    "what_to_listen_for": [
                        "Clear understanding of the skill",
                        "Relevant experience examples",
                        "Positive outcomes"
                    ],
                    "red_flags": [
                        "No relevant experience",
                        "Misunderstanding of skill requirements"
                    ],
                    "follow_ups": [
                        "How did you develop this skill?",
                        "What challenges did you face?"
                    ],
                    "time_estimate": "4-5 minutes"
                }
            })
        
        gap_names = [g.get('skill_name', 'key area') for g in skill_gaps[:2]]
        
        return {
            "executive_summary": f"{candidate_name} demonstrated mixed performance in the simulation assessment. Strong performance was noted in verified skill areas, while gaps in {', '.join(gap_names) if gap_names else 'certain areas'} warrant deeper exploration during the interview. Focus on behavioral questions to distinguish between simulation performance and actual capability.",
            "interview_duration_estimate": "30-40 minutes",
            "sections": {
                "verified_skills": verified_section,
                "skill_gaps": gaps_section,
                "skills_not_tested": not_tested_section
            },
            "overall_red_flags": [
                f"Performance gaps in {gap_names[0]}" if gap_names else "Limited simulation data",
                "Verify depth of practical experience",
                "Assess learning agility and adaptability"
            ],
            "overall_strengths": [
                "Completed simulation assessment",
                "Demonstrated engagement with evaluation process",
                "Shows willingness to be assessed"
            ],
            "interview_tips": [
                "Start with verified skills to build rapport before probing gaps",
                "Use silence after questions to encourage elaboration",
                "Take notes on specific examples provided for reference checks"
            ]
        }
    
    def generate_interview_questions(
        self,
        candidate_name: str,
        role: str,
        skill_gaps: List[SkillGap],
        verified_skills: List[str],
        job_description: Optional[str] = None,
        evaluation_rationale: Optional[str] = None,
        num_questions: int = 8,
        interview_type: str = "technical"
    ) -> dict:
        """Generate personalized interview questions based on simulation results (legacy method)."""
        
        # Check if we have an API key
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set - returning mock data")
            return self._get_mock_response(candidate_name, skill_gaps, num_questions)
        
        # Format skill gaps for the prompt
        if skill_gaps:
            gaps_text = "\n".join([
                f"- {gap.skill_name}: Score {gap.current_score}/{gap.required_score} "
                f"(Gap severity: {gap.gap_severity}, Importance: {gap.importance_to_role})"
                f"\n  Suggested areas to probe: {', '.join(gap.suggested_probe_areas) if gap.suggested_probe_areas else 'General assessment needed'}"
                for gap in skill_gaps
            ])
        else:
            gaps_text = "No specific skill gaps identified - conduct general assessment"
        
        verified_text = ", ".join(verified_skills) if verified_skills else "None identified"
        
        prompt = f"""You are an expert technical recruiter and interview coach. Based on the following simulation results, generate a personalized interview guide for the upcoming interview.

## Candidate Information
- **Name**: {candidate_name}
- **Role Applied**: {role}
- **Interview Type**: {interview_type}

## Simulation Results

### Verified Skills (Already demonstrated - skip or briefly acknowledge)
{verified_text}

### Skill Gaps (Need deeper probing)
{gaps_text}

{f"## Job Description Context{job_description}" if job_description else ""}

{f"## Evaluation Notes from Simulation{evaluation_rationale}" if evaluation_rationale else ""}

## Your Task
Generate exactly {num_questions} targeted interview questions that:
1. Focus primarily on the skill gaps identified
2. Are appropriate for {interview_type} interviews
3. The questions should be based on the job description and the evaluation rationale.
3. Help assess whether gaps are due to lack of knowledge, lack of experience, or just simulation performance
4. Include follow-up questions to dig deeper
5. Prioritize questions by the importance of the skill gap to the role

For each question, provide:
- The main question
- Which skill/gap it targets
- Difficulty level (easy/medium/hard)
- What good answers should include (what to listen for) - provide 2-3 points
- Red flags that indicate deeper problems - provide 2-3 points
- 2-3 follow-up questions
- Estimated time (e.g., "3-5 minutes")

Also provide:
- A brief executive summary (2-3 sentences) about this candidate's fit
- Top 3 strengths to acknowledge during the interview
- Top 3 red flags to watch for overall

You MUST respond with valid JSON in this exact format:
{{
    "summary": "Executive summary about the candidate...",
    "strengths": ["strength1", "strength2", "strength3"],
    "red_flags": ["red_flag1", "red_flag2", "red_flag3"],
    "questions": [
        {{
            "question": "The interview question...",
            "skill_targeted": "skill name",
            "difficulty": "medium",
            "what_to_listen_for": ["point1", "point2"],
            "red_flags": ["red_flag1", "red_flag2"],
            "follow_up_questions": ["follow_up1", "follow_up2"],
            "time_estimate": "3-5 minutes"
        }}
    ]
}}"""

        try:
            logger.info(f"Calling OpenAI API for candidate: {candidate_name}")
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert technical recruiter and interview coach. You must always respond with valid JSON only, no additional text or markdown."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=4096,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            # Parse JSON from response
            content = response.choices[0].message.content
            logger.info(f"OpenAI API response received, length: {len(content) if content else 0}")
            
            if content:
                result = json.loads(content)
                logger.info(f"Successfully generated {len(result.get('questions', []))} questions")
                return result
            else:
                logger.error("OpenAI returned empty content")
                return self._get_mock_response(candidate_name, skill_gaps, num_questions)
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            logger.error(f"Raw content: {content[:500] if content else 'None'}")
            return self._get_mock_response(candidate_name, skill_gaps, num_questions)
        except Exception as e:
            logger.error(f"OpenAI API Error: {type(e).__name__}: {e}")
            return self._get_mock_response(candidate_name, skill_gaps, num_questions)
    
    def _get_mock_response(self, candidate_name: str, skill_gaps: List[SkillGap], num_questions: int) -> dict:
        """Generate mock response for testing without API key."""
        logger.info("Generating mock response")
        
        questions = []
        
        # Generate questions based on skill gaps
        skill_gap_list = list(skill_gaps) if skill_gaps else []
        
        for i in range(min(len(skill_gap_list), num_questions)):
            gap = skill_gap_list[i]
            questions.append({
                "question": f"Can you walk me through a specific example where you had to apply {gap.skill_name} in a challenging situation?",
                "skill_targeted": gap.skill_name,
                "difficulty": "medium",
                "what_to_listen_for": [
                    f"Clear understanding of {gap.skill_name} concepts",
                    "Specific, detailed examples from experience",
                    "Problem-solving approach and reasoning"
                ],
                "red_flags": [
                    "Vague or generic answers",
                    "Cannot provide specific examples",
                    "Blames others for failures"
                ],
                "follow_up_questions": [
                    "What was the outcome of that situation?",
                    "What would you do differently now?",
                    f"How do you stay updated on best practices in {gap.skill_name}?"
                ],
                "time_estimate": "4-6 minutes"
            })
        
        # Fill remaining questions with general probing
        general_questions = [
            {
                "question": "Tell me about a time you had to learn a new skill quickly to complete a project.",
                "skill_targeted": "Learning Agility",
                "difficulty": "medium",
                "what_to_listen_for": ["Structured approach to learning", "Resourcefulness", "Application of new knowledge"],
                "red_flags": ["Resistance to learning new things", "Over-reliance on others"],
                "follow_up_questions": ["What resources did you use?", "How long did it take to become proficient?"],
                "time_estimate": "3-4 minutes"
            },
            {
                "question": "Describe a situation where you received critical feedback. How did you handle it?",
                "skill_targeted": "Receiving Feedback",
                "difficulty": "medium",
                "what_to_listen_for": ["Openness to feedback", "Concrete actions taken", "Growth mindset"],
                "red_flags": ["Defensiveness", "Blaming others", "No follow-through"],
                "follow_up_questions": ["What specific changes did you make?", "How did you measure improvement?"],
                "time_estimate": "3-4 minutes"
            },
            {
                "question": "Tell me about a project that didn't go as planned. What happened and what did you learn?",
                "skill_targeted": "Problem Solving",
                "difficulty": "medium",
                "what_to_listen_for": ["Ownership of mistakes", "Root cause analysis", "Lessons learned"],
                "red_flags": ["No accountability", "Superficial analysis", "Repeated same mistakes"],
                "follow_up_questions": ["What would you do differently?", "How did you communicate the setback?"],
                "time_estimate": "4-5 minutes"
            },
            {
                "question": "How do you prioritize tasks when you have multiple deadlines?",
                "skill_targeted": "Time Management",
                "difficulty": "easy",
                "what_to_listen_for": ["Clear prioritization framework", "Communication with stakeholders", "Flexibility"],
                "red_flags": ["No clear system", "Overcommitting", "Poor communication"],
                "follow_up_questions": ["Give me a specific example", "How do you handle unexpected urgent tasks?"],
                "time_estimate": "3-4 minutes"
            },
            {
                "question": "Describe a time when you had to collaborate with someone difficult to work with.",
                "skill_targeted": "Collaboration",
                "difficulty": "medium",
                "what_to_listen_for": ["Empathy and understanding", "Conflict resolution skills", "Focus on outcomes"],
                "red_flags": ["Badmouthing colleagues", "Avoidance", "Escalating conflicts"],
                "follow_up_questions": ["What was the outcome?", "What did you learn about yourself?"],
                "time_estimate": "4-5 minutes"
            }
        ]
        
        while len(questions) < num_questions and general_questions:
            questions.append(general_questions.pop(0))
        
        # Ensure we have exactly num_questions
        questions = questions[:num_questions]
        
        gap_names = [g.skill_name for g in skill_gap_list[:2]] if skill_gap_list else ["key areas"]
        
        return {
            "summary": f"{candidate_name} showed performance in the simulation with areas that warrant deeper exploration. The interview should focus on understanding their experience with {', '.join(gap_names)} and assessing whether any gaps reflect actual skill deficiencies or situational factors.",
            "strengths": [
                "Completed the simulation assessment",
                "Demonstrated engagement with the process",
                "Showed willingness to be evaluated"
            ],
            "red_flags": [
                f"Gaps identified in {gap_names[0]}" if gap_names else "Limited data from simulation",
                "May need to probe depth of experience",
                "Verify practical application of skills"
            ],
            "questions": questions
        }


# Create singleton instance
llm_service = LLMService()
