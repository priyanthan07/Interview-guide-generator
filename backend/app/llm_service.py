import json
import logging
from typing import List, Optional
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
        """Generate personalized interview questions based on simulation results."""
        
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

{f"## Job Description Context{chr(10)}{job_description}" if job_description else ""}

{f"## Evaluation Notes from Simulation{chr(10)}{evaluation_rationale}" if evaluation_rationale else ""}

## Your Task
Generate exactly {num_questions} targeted interview questions that:
1. Focus primarily on the skill gaps identified
2. Are appropriate for {interview_type} interviews
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
