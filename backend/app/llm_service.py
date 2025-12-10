import json
from typing import List, Optional
from openai import OpenAI
from .config import settings
from .schemas import SkillGap, InterviewQuestion


class LLMService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
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
        
        # Format skill gaps for the prompt
        gaps_text = "\n".join([
            f"- {gap.skill_name}: Score {gap.current_score}/{gap.required_score} "
            f"(Gap severity: {gap.gap_severity}, Importance: {gap.importance_to_role})"
            f"\n  Suggested areas to probe: {', '.join(gap.suggested_probe_areas) if gap.suggested_probe_areas else 'General assessment needed'}"
            for gap in skill_gaps
        ])
        
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
Generate {num_questions} targeted interview questions that:
1. Focus primarily on the skill gaps identified
2. Are appropriate for {interview_type} interviews
3. Help assess whether gaps are due to lack of knowledge, lack of experience, or just simulation performance
4. Include follow-up questions to dig deeper
5. Prioritize questions by the importance of the skill gap to the role

For each question, provide:
- The main question
- Which skill/gap it targets
- Difficulty level (easy/medium/hard)
- What good answers should include (what to listen for)
- Red flags that indicate deeper problems
- 2-3 follow-up questions
- Estimated time (e.g., "3-5 minutes")

Also provide:
- A brief executive summary (2-3 sentences) about this candidate's fit
- Top 3 strengths to acknowledge during the interview
- Top 3 red flags to watch for overall

Respond in the following JSON format:
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

        if not self.client:
            # Return mock data if no API key
            return self._get_mock_response(candidate_name, skill_gaps, num_questions)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert technical recruiter and interview coach. Always respond with valid JSON."
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
            if content:
                return json.loads(content)
            else:
                return self._get_mock_response(candidate_name, skill_gaps, num_questions)
                
        except Exception as e:
            print(f"OpenAI Error: {e}")
            return self._get_mock_response(candidate_name, skill_gaps, num_questions)
    
    def _get_mock_response(self, candidate_name: str, skill_gaps: List[SkillGap], num_questions: int) -> dict:
        """Generate mock response for testing without API key."""
        questions = []
        for i, gap in enumerate(skill_gaps[:num_questions]):
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
        while len(questions) < num_questions:
            questions.append({
                "question": "Tell me about a time you had to learn a new skill quickly to complete a project.",
                "skill_targeted": "Learning Agility",
                "difficulty": "medium",
                "what_to_listen_for": [
                    "Structured approach to learning",
                    "Resourcefulness",
                    "Application of new knowledge"
                ],
                "red_flags": [
                    "Resistance to learning new things",
                    "Over-reliance on others"
                ],
                "follow_up_questions": [
                    "What resources did you use?",
                    "How long did it take to become proficient?"
                ],
                "time_estimate": "3-4 minutes"
            })
        
        return {
            "summary": f"{candidate_name} showed strong performance in verified areas but has notable gaps in {', '.join([g.skill_name for g in skill_gaps[:2]])}. The interview should focus on understanding whether these gaps reflect actual skill deficiencies or situational factors during the simulation.",
            "strengths": [
                "Demonstrated competency in core technical skills",
                "Good communication during simulation",
                "Showed problem-solving initiative"
            ],
            "red_flags": [
                f"Significant gap in {skill_gaps[0].skill_name if skill_gaps else 'key areas'}",
                "May need additional training in certain areas",
                "Verify depth of experience"
            ],
            "questions": questions[:num_questions]
        }


llm_service = LLMService()
