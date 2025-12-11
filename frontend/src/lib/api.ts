const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types for existing Skillfully data
export interface Session {
  session_id: string;
  email: string;
  campaign_name: string;
  scenario_name: string;
  scenario_type: string | null;
  last_evaluation: string | null;
  evaluation_count: number;
}

export interface Campaign {
  campaign_id: string | null;
  campaign_name: string;
  candidate_count: number;
  session_count: number;
  last_activity: string | null;
}

export interface SkillScore {
  skill: string;
  score: number | null;
}

export interface CampaignCandidate {
  email: string;
  name: string;
  session_count: number;
  evaluation_count: number;
  last_activity: string | null;
  scenario_types: string[];
  session_ids: string[];
  latest_session_id: string | null;
  skills_evaluated: string[];
  skill_scores: SkillScore[];
  average_score: number | null;
}

export interface Candidate {
  email: string;
  name: string;
  session_count: number;
  last_activity: string | null;
  campaigns: string[];
  scenarios: string[];
}

export interface SkillEvaluation {
  skill: string;
  result: Record<string, unknown> | null;
  transcript: string | null;
  created_at: string | null;
}

export interface SessionDetail {
  session_id: string;
  email: string;
  campaign_name: string;
  scenario_name: string;
  scenario_type: string | null;
  simulation_type: string | null;
  skills_evaluated: SkillEvaluation[];
  feedback: {
    evaluation_results: Record<string, unknown> | null;
    feedback: Record<string, unknown> | null;
  } | null;
  voice_evaluation: {
    elsa_score: Record<string, unknown> | null;
    result: Record<string, unknown> | null;
  } | null;
}

export interface InterviewQuestion {
  question: string;
  skill_targeted: string;
  difficulty: string;
  what_to_listen_for: string[];
  red_flags: string[];
  follow_up_questions: string[];
  time_estimate: string;
}

export interface InterviewGuide {
  session_id: string;
  candidate: string;
  role: string;
  verified_skills: string[];
  skill_gaps: {
    skill_name: string;
    current_score: number;
    required_score: number;
    gap_severity: string;
    importance_to_role: string;
    suggested_probe_areas: string[];
  }[];
  guide: {
    summary: string;
    strengths: string[];
    red_flags: string[];
    questions: InterviewQuestion[];
  };
  generated_at: string;
}

export interface Skill {
  skill_id: number;
  skill_name: string;
  skill_prompt: string | null;
  is_ai_generated: boolean;
}

// Agentic Guide Types
export interface SkillRequirement {
  skill_name: string;
  priority: 'high' | 'medium' | 'low';
  min_score: number;
}

export interface AgenticGuideRequest {
  session_ids: string[];
  job_description: string;
  required_skills: SkillRequirement[];
  custom_instructions?: string;
  per_candidate_instructions?: Record<string, string>;  // session_id -> instruction
  num_questions: number;
}

export interface VerifiedSkillSection {
  skill_name: string;
  score: number;
  acknowledgment?: string;
  acknowledgment_question?: string; // Fallback for backwards compatibility
  time_estimate: string;
}

export interface SkillGapReasoning {
  data_observation: string;
  evidence_from_evaluation: string;
  gap_significance: string;
  interview_strategy: string;
  question_rationale: string;
}

export interface GapQuestion {
  question: string;
  what_to_listen_for: string[];
  red_flags: string[];
  follow_ups: string[];
  time_estimate: string;
}

export interface SkillGapSection {
  skill_name: string;
  current_score: number;
  priority: string;
  reasoning: SkillGapReasoning;
  questions: GapQuestion[];
}

export interface NotTestedReasoning {
  note: string;
  relevance_to_role: string;
  question_strategy: string;
}

export interface NotTestedSection {
  skill_name: string;
  priority: string;
  reasoning: NotTestedReasoning;
  question: GapQuestion;
}

export interface AgenticGuideSections {
  verified_skills: VerifiedSkillSection[];
  skill_gaps: SkillGapSection[];
  skills_not_tested: NotTestedSection[];
}

export interface AgenticGuide {
  executive_summary: string;
  interview_duration_estimate: string;
  sections: AgenticGuideSections;
  overall_red_flags: string[];
  overall_strengths: string[];
  interview_tips: string[];
}

export interface AgenticGuideResult {
  session_id: string;
  candidate_name: string;
  candidate_email: string;
  role: string;
  scenario_type: string | null;
  success: boolean;
  error?: string;
  classification: {
    verified_skills: Array<{ skill_name: string; score: number; evidence: string }>;
    skill_gaps: Array<{ skill_name: string; current_score: number; required_score: number; gap_severity: string; priority: string; evidence: string }>;
    skills_not_tested: Array<{ skill_name: string; priority: string; reason: string }>;
  };
  guide: AgenticGuide;
  metadata: {
    total_skills_evaluated: number;
    feedback_available: boolean;
    voice_evaluation_available: boolean;
    custom_instructions_provided: boolean;
  };
}

export interface AgenticGuideResponse {
  generated_at: string;
  job_description_provided: boolean;
  required_skills_count: number;
  candidates_processed: number;
  guides: AgenticGuideResult[];
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  // Campaigns
  getCampaigns: () => fetchAPI<Campaign[]>('/evaluations/campaigns'),
  getCampaignCandidates: (campaignId: string) => 
    fetchAPI<CampaignCandidate[]>(`/evaluations/campaigns/${encodeURIComponent(campaignId)}/candidates`),
  
  // Sessions
  getSessions: (limit = 50) => fetchAPI<Session[]>(`/evaluations/sessions?limit=${limit}`),
  getSessionDetail: (sessionId: string) => fetchAPI<SessionDetail>(`/evaluations/session/${sessionId}`),
  
  // Candidates
  getCandidates: (limit = 50) => fetchAPI<Candidate[]>(`/evaluations/candidates?limit=${limit}`),
  getCandidateSessions: (email: string) => fetchAPI<Session[]>(`/evaluations/candidate/${encodeURIComponent(email)}/sessions`),
  
  // Skills
  getSkills: () => fetchAPI<Skill[]>('/evaluations/skills'),
  
  // Interview Guide Generation (Legacy)
  generateGuide: (sessionId: string, numQuestions = 8) => 
    fetchAPI<InterviewGuide>(`/evaluations/generate-guide/${sessionId}?num_questions=${numQuestions}`, {
      method: 'POST',
    }),
  
  // Agentic Interview Guide Generation
  generateAgenticGuide: (request: AgenticGuideRequest) =>
    fetchAPI<AgenticGuideResponse>('/evaluations/generate-agentic-guide', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
  
  // Regenerate single question
  regenerateQuestion: (request: {
    original_question: string;
    skill_name: string;
    instruction?: string;
    candidate_context?: string;
  }) =>
    fetchAPI<{
      success: boolean;
      regenerated_question?: {
        question: string;
        what_to_listen_for: string[];
        red_flags: string[];
        follow_ups: string[];
        time_estimate: string;
      };
      error?: string;
    }>('/evaluations/regenerate-question', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};
