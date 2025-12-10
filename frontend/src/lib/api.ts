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
  // Sessions
  getSessions: (limit = 50) => fetchAPI<Session[]>(`/evaluations/sessions?limit=${limit}`),
  getSessionDetail: (sessionId: string) => fetchAPI<SessionDetail>(`/evaluations/session/${sessionId}`),
  
  // Candidates
  getCandidates: (limit = 50) => fetchAPI<Candidate[]>(`/evaluations/candidates?limit=${limit}`),
  getCandidateSessions: (email: string) => fetchAPI<Session[]>(`/evaluations/candidate/${encodeURIComponent(email)}/sessions`),
  
  // Skills
  getSkills: () => fetchAPI<Skill[]>('/evaluations/skills'),
  
  // Interview Guide Generation
  generateGuide: (sessionId: string, numQuestions = 8) => 
    fetchAPI<InterviewGuide>(`/evaluations/generate-guide/${sessionId}?num_questions=${numQuestions}`, {
      method: 'POST',
    }),
};
