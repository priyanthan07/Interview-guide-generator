'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Briefcase,
  Target,
  Loader2,
  Copy,
  Printer,
  X,
  Plus,
  Minus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ChevronRight,
  Brain,
  UserCog,
  Edit3,
  RefreshCw,
  Save,
  Wand2,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { api, AgenticGuideResponse, AgenticGuideResult, GapQuestion, SessionDetail } from '@/lib/api';

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const sessionIds = searchParams.get('sessionIds')?.split(',').filter(Boolean) || [];
  const campaignName = searchParams.get('campaignName') || 'Unknown Campaign';
  const campaignIdFromUrl = searchParams.get('campaignId') || '';
  
  // Get job description and global instructions from URL params or localStorage
  const [jobDescription, setJobDescription] = useState('');
  const [globalInstructions, setGlobalInstructions] = useState('');
  
  // Load campaign settings from URL params or localStorage cache
  useEffect(() => {
    const urlJD = searchParams.get('jobDescription') || '';
    const urlInstructions = searchParams.get('globalInstructions') || '';
    
    if (urlJD) {
      setJobDescription(urlJD);
    } else if (typeof window !== 'undefined') {
      // Try to get from localStorage using campaign name as fallback key
      const campaigns = Object.keys(localStorage).filter(k => k.startsWith('campaign_') && k.endsWith('_jobDescription'));
      for (const key of campaigns) {
        if (key.includes(encodeURIComponent(campaignName)) || key.includes(campaignIdFromUrl)) {
          const cached = localStorage.getItem(key);
          if (cached) {
            setJobDescription(cached);
            break;
          }
        }
      }
      // Also try direct key match
      const cachedJD = localStorage.getItem(`campaign_${campaignIdFromUrl}_jobDescription`) ||
                       localStorage.getItem(`campaign_${encodeURIComponent(campaignName)}_jobDescription`);
      if (cachedJD) setJobDescription(cachedJD);
    }
    
    if (urlInstructions) {
      setGlobalInstructions(urlInstructions);
    } else if (typeof window !== 'undefined') {
      const cachedInstructions = localStorage.getItem(`campaign_${campaignIdFromUrl}_globalInstructions`) ||
                                  localStorage.getItem(`campaign_${encodeURIComponent(campaignName)}_globalInstructions`);
      if (cachedInstructions) setGlobalInstructions(cachedInstructions);
    }
  }, [searchParams, campaignName, campaignIdFromUrl]);
  
  // Candidate-level settings
  const [numQuestions, setNumQuestions] = useState(8);
  const [candidateInstructions, setCandidateInstructions] = useState<Map<string, string>>(new Map());
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());
  
  // Session details for showing evaluation results
  const [sessionDetails, setSessionDetails] = useState<Map<string, SessionDetail>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideResponse, setGuideResponse] = useState<AgenticGuideResponse | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());

  // Fetch session details for each candidate
  useEffect(() => {
    async function fetchSessionDetails() {
      setLoadingDetails(true);
      const details = new Map<string, SessionDetail>();
      
      for (const sessionId of sessionIds) {
        try {
          const detail = await api.getSessionDetail(sessionId);
          details.set(sessionId, detail);
        } catch (err) {
          console.error(`Failed to fetch session ${sessionId}:`, err);
        }
      }
      
      setSessionDetails(details);
      setLoadingDetails(false);
    }
    
    if (sessionIds.length > 0) {
      fetchSessionDetails();
    } else {
      setLoadingDetails(false);
    }
  }, [sessionIds.join(',')]);

  const toggleCandidateExpand = (sessionId: string) => {
    const newExpanded = new Set(expandedCandidates);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedCandidates(newExpanded);
  };

  const updateCandidateInstruction = (sessionId: string, instruction: string) => {
    const newInstructions = new Map(candidateInstructions);
    if (instruction.trim()) {
      newInstructions.set(sessionId, instruction);
    } else {
      newInstructions.delete(sessionId);
    }
    setCandidateInstructions(newInstructions);
  };

  const toggleReasoning = (key: string) => {
    const newExpanded = new Set(expandedReasoning);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedReasoning(newExpanded);
  };

  const getScoreFromResult = (result: Record<string, unknown> | null): number | null => {
    if (!result) return null;
    const score = result.score || result.overall_score || result.rating;
    if (typeof score === 'number') return score;
    if (typeof score === 'string' && score.includes('/')) {
      const [num, denom] = score.split('/').map(Number);
      return num / denom * 5;
    }
    return null;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return { bg: 'bg-slate-100', text: 'text-slate-500' };
    if (score >= 4) return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    if (score >= 3) return { bg: 'bg-amber-100', text: 'text-amber-700' };
    return { bg: 'bg-red-100', text: 'text-red-700' };
  };

  const generateGuide = async () => {
    if (sessionIds.length === 0) {
      setError('No sessions selected');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Job description is required. Please go back to the campaign page and add it.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert Map to object for API
      const perCandidateInstructionsObj: Record<string, string> = {};
      candidateInstructions.forEach((value, key) => {
        if (value.trim()) {
          perCandidateInstructionsObj[key] = value;
        }
      });
      
      const response = await api.generateAgenticGuide({
        session_ids: sessionIds,
        job_description: jobDescription,
        required_skills: [],
        custom_instructions: globalInstructions || undefined,
        per_candidate_instructions: Object.keys(perCandidateInstructionsObj).length > 0 
          ? perCandidateInstructionsObj 
          : undefined,
        num_questions: numQuestions
      });
      setGuideResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate guide');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const printGuide = () => {
    window.print();
  };

  const updateQuestion = (guideIndex: number, sectionType: string, skillIndex: number, questionIndex: number, newQuestion: GapQuestion) => {
    if (!guideResponse) return;
    
    const newGuides = [...guideResponse.guides];
    const guide = { ...newGuides[guideIndex] };
    const sections = { ...guide.guide.sections };
    
    if (sectionType === 'skill_gaps') {
      const skillGaps = [...sections.skill_gaps];
      const gap = { ...skillGaps[skillIndex] };
      const questions = [...gap.questions];
      questions[questionIndex] = newQuestion;
      gap.questions = questions;
      skillGaps[skillIndex] = gap;
      sections.skill_gaps = skillGaps;
    } else if (sectionType === 'skills_not_tested') {
      const notTested = [...sections.skills_not_tested];
      const skill = { ...notTested[skillIndex] };
      skill.question = newQuestion;
      notTested[skillIndex] = skill;
      sections.skills_not_tested = notTested;
    }
    
    guide.guide = { ...guide.guide, sections };
    newGuides[guideIndex] = guide;
    setGuideResponse({ ...guideResponse, guides: newGuides });
  };

  // If we have generated guides, show them
  if (guideResponse) {
    return (
      <div className="min-h-screen gradient-hero">
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50 no-print">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setGuideResponse(null)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Settings</span>
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={printGuide}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-600"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="pt-24 pb-12 px-6">
          <div className="max-w-4xl mx-auto">
            {guideResponse.guides.map((guide, index) => (
              <GuideDisplay 
                key={guide.session_id} 
                guide={guide} 
                guideIndex={index}
                expandedReasoning={expandedReasoning}
                toggleReasoning={toggleReasoning}
                copyToClipboard={copyToClipboard}
                onUpdateQuestion={(sectionType, skillIndex, questionIndex, newQuestion) => 
                  updateQuestion(index, sectionType, skillIndex, questionIndex, newQuestion)
                }
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Campaign</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Generate Guide</h1>
                <p className="text-xs text-slate-500">{sessionIds.length} candidate(s)</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Campaign Info Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-6 mb-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl gradient-card flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-800">Interview Guide Generator</h2>
                <p className="text-slate-500">Campaign: <span className="font-semibold text-slate-700">{campaignName}</span></p>
              </div>
            </div>
            
            {/* Campaign Settings Summary */}
            <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Job Description</p>
                <p className="text-sm text-slate-700 line-clamp-2">
                  {jobDescription ? jobDescription.slice(0, 150) + (jobDescription.length > 150 ? '...' : '') : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Global Instructions</p>
                <p className="text-sm text-slate-700 line-clamp-2">
                  {globalInstructions || 'None'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Candidates with Evaluation Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800">Candidates & Evaluation Results</h3>
                <p className="text-sm text-slate-500">View skills and add per-candidate instructions</p>
              </div>
            </div>

            {loadingDetails ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="ml-2 text-slate-600">Loading candidate details...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {sessionIds.map((sessionId, index) => {
                  const detail = sessionDetails.get(sessionId);
                  const instruction = candidateInstructions.get(sessionId) || '';
                  const isExpanded = expandedCandidates.has(sessionId);
                  const candidateName = detail?.email?.split('@')[0]?.replace(/[._]/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || `Candidate ${index + 1}`;
                  
                  // Calculate average score
                  const scores = detail?.skills_evaluated?.map(s => getScoreFromResult(s.result)).filter(s => s !== null) as number[] || [];
                  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                  
                  return (
                    <div key={sessionId} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleCandidateExpand(sessionId)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl gradient-card flex items-center justify-center text-sm font-bold text-white">
                            {candidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-slate-700">{candidateName}</p>
                            <p className="text-xs text-slate-400">
                              {detail?.skills_evaluated?.length || 0} skills evaluated
                              {avgScore !== null && ` • Avg: ${avgScore.toFixed(1)}/5`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {instruction && (
                            <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-600 text-xs font-medium">
                              Has instructions
                            </span>
                          )}
                          {avgScore !== null && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getScoreColor(avgScore).bg} ${getScoreColor(avgScore).text}`}>
                              {avgScore.toFixed(1)}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-0 border-t border-slate-100 space-y-4">
                              {/* Skill Scores */}
                              {detail?.skills_evaluated && detail.skills_evaluated.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                    <BarChart3 className="w-3 h-3" />
                                    Evaluation Results
                                  </p>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {detail.skills_evaluated.map((skill, idx) => {
                                      const score = getScoreFromResult(skill.result);
                                      const colors = getScoreColor(score);
                                      return (
                                        <div 
                                          key={idx}
                                          className={`flex items-center justify-between p-2 rounded-lg border ${colors.bg}`}
                                        >
                                          <span className="text-xs font-medium text-slate-700 truncate flex-1 mr-2">
                                            {skill.skill}
                                          </span>
                                          <span className={`text-xs font-bold ${colors.text} flex items-center gap-1`}>
                                            {score !== null ? (
                                              <>
                                                {score >= 4 ? <TrendingUp className="w-3 h-3" /> : score < 3 ? <TrendingDown className="w-3 h-3" /> : null}
                                                {score.toFixed(1)}
                                              </>
                                            ) : 'N/A'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Scenario Info */}
                              {detail && (
                                <div className="flex flex-wrap gap-2">
                                  {detail.scenario_type && (
                                    <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium">
                                      {detail.scenario_type}
                                    </span>
                                  )}
                                  {detail.scenario_name && (
                                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs">
                                      {detail.scenario_name}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Per-Candidate Instructions */}
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                  Custom Instructions for this Candidate
                                </p>
                                <textarea
                                  value={instruction}
                                  onChange={(e) => updateCandidateInstruction(sessionId, e.target.value)}
                                  placeholder="Add specific instructions for this candidate. e.g., 'Being considered for team lead', 'Focus on communication skills'..."
                                  className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 transition-all duration-300 text-slate-700 placeholder:text-slate-400 resize-none text-sm"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Questions Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-premium p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Questions per Candidate</h3>
                  <p className="text-sm text-slate-500">Total questions to generate</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNumQuestions(Math.max(3, numQuestions - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-5 h-5 text-slate-600" />
                </button>
                <span className="w-12 text-center text-2xl font-bold text-slate-800">{numQuestions}</span>
                <button
                  onClick={() => setNumQuestions(Math.min(15, numQuestions + 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <button
              onClick={generateGuide}
              disabled={loading || sessionIds.length === 0 || !jobDescription.trim()}
              className="btn-primary text-lg px-10 py-4 flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Generating Interview Guide...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>Generate Interview Guides</span>
                </>
              )}
            </button>
            {!jobDescription.trim() && (
              <p className="mt-4 text-sm text-red-500">
                ⚠️ Job description is required. Please go back to the campaign page and add it.
              </p>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// Guide Display Component
function GuideDisplay({ 
  guide, 
  guideIndex,
  expandedReasoning,
  toggleReasoning,
  copyToClipboard,
  onUpdateQuestion
}: { 
  guide: AgenticGuideResult;
  guideIndex: number;
  expandedReasoning: Set<string>;
  toggleReasoning: (key: string) => void;
  copyToClipboard: (text: string) => void;
  onUpdateQuestion: (sectionType: string, skillIndex: number, questionIndex: number, newQuestion: GapQuestion) => void;
}) {
  if (!guide.success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: guideIndex * 0.1 }}
        className="card-premium p-6 mb-6 border-l-4 border-red-500"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="font-bold text-slate-800">{guide.candidate_name}</h3>
            <p className="text-red-500">{guide.error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const guideData = guide.guide;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: guideIndex * 0.1 }}
      className="mb-8"
    >
      {/* Header */}
      <div className="card-premium overflow-hidden mb-6">
        <div className="h-32 gradient-card relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-4 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-xl font-bold text-slate-700">
                {guide.candidate_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{guide.candidate_name}</h2>
                <p className="text-white/80">{guide.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Clock className="w-4 h-4" />
              <span>{guideData.interview_duration_estimate}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Executive Summary</h3>
            <p className="text-slate-700 leading-relaxed">{guideData.executive_summary}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <h4 className="font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Overall Strengths
              </h4>
              <ul className="space-y-1">
                {guideData.overall_strengths.map((strength, i) => (
                  <li key={i} className="text-sm text-emerald-600">• {strength}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Watch For
              </h4>
              <ul className="space-y-1">
                {guideData.overall_red_flags.map((flag, i) => (
                  <li key={i} className="text-sm text-red-600">• {flag}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Interview Tips
            </h4>
            <ul className="space-y-1">
              {guideData.interview_tips.map((tip, i) => (
                <li key={i} className="text-sm text-amber-700">• {tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Section 1: Verified Skills */}
      {guideData.sections.verified_skills.length > 0 && (
        <div className="card-premium p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Section 1: Verified Skills</h3>
              <p className="text-sm text-slate-500">Brief acknowledgment only - scored 4+ in simulation</p>
            </div>
          </div>
          <div className="space-y-3">
            {guideData.sections.verified_skills.map((skill) => (
              <div key={skill.skill_name} className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-emerald-700">{skill.skill_name}</span>
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium">
                    Score: {skill.score}/5
                  </span>
                </div>
                <p className="text-slate-600 text-sm italic">"{skill.acknowledgment || skill.acknowledgment_question}"</p>
                <p className="text-xs text-slate-400 mt-1">⏱ {skill.time_estimate}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Skill Gaps */}
      {guideData.sections.skill_gaps.length > 0 && (
        <div className="card-premium p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Section 2: Skill Gaps</h3>
              <p className="text-sm text-slate-500">Deep probing required - with AI reasoning</p>
            </div>
          </div>
          <div className="space-y-6">
            {guideData.sections.skill_gaps.map((gap, skillIndex) => (
              <div key={gap.skill_name} className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">{gap.skill_name}</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${
                      gap.priority === 'high' ? 'bg-red-100 text-red-700' :
                      gap.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {gap.priority} Priority
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-sm font-medium">
                    Score: {gap.current_score}/5
                  </span>
                </div>

                <button
                  onClick={() => toggleReasoning(`gap-${gap.skill_name}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors mb-4"
                >
                  <span className="flex items-center gap-2 text-indigo-700 font-medium">
                    <Brain className="w-4 h-4" />
                    Show AI Reasoning
                  </span>
                  {expandedReasoning.has(`gap-${gap.skill_name}`) ? (
                    <ChevronUp className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-indigo-500" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedReasoning.has(`gap-${gap.skill_name}`) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2 text-sm">
                        <p><strong className="text-indigo-700">Data Observation:</strong> <span className="text-slate-600">{gap.reasoning.data_observation}</span></p>
                        <p><strong className="text-indigo-700">Evidence:</strong> <span className="text-slate-600">{gap.reasoning.evidence_from_evaluation}</span></p>
                        <p><strong className="text-indigo-700">Gap Significance:</strong> <span className="text-slate-600">{gap.reasoning.gap_significance}</span></p>
                        <p><strong className="text-indigo-700">Interview Strategy:</strong> <span className="text-slate-600">{gap.reasoning.interview_strategy}</span></p>
                        <p><strong className="text-indigo-700">Question Rationale:</strong> <span className="text-slate-600">{gap.reasoning.question_rationale}</span></p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {gap.questions.map((q, qIndex) => (
                  <EditableQuestionCard 
                    key={qIndex} 
                    question={q} 
                    index={qIndex} 
                    skillName={gap.skill_name}
                    copyToClipboard={copyToClipboard}
                    onUpdate={(newQuestion) => onUpdateQuestion('skill_gaps', skillIndex, qIndex, newQuestion)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Skills Not Tested */}
      {guideData.sections.skills_not_tested.length > 0 && (
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Section 3: Skills Not Tested</h3>
              <p className="text-sm text-slate-500">Required by job but not evaluated in simulation</p>
            </div>
          </div>
          <div className="space-y-6">
            {guideData.sections.skills_not_tested.map((skill, skillIndex) => (
              <div key={skill.skill_name} className="p-5 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-bold text-slate-800">{skill.skill_name}</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${
                    skill.priority === 'high' ? 'bg-red-100 text-red-700' :
                    skill.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {skill.priority} Priority
                  </span>
                </div>

                <button
                  onClick={() => toggleReasoning(`nottest-${skill.skill_name}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors mb-4"
                >
                  <span className="flex items-center gap-2 text-blue-700 font-medium">
                    <Brain className="w-4 h-4" />
                    Show AI Reasoning
                  </span>
                  {expandedReasoning.has(`nottest-${skill.skill_name}`) ? (
                    <ChevronUp className="w-4 h-4 text-blue-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-500" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedReasoning.has(`nottest-${skill.skill_name}`) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="p-4 rounded-lg bg-blue-100 border border-blue-200 space-y-2 text-sm">
                        <p><strong className="text-blue-700">Note:</strong> <span className="text-slate-600">{skill.reasoning.note}</span></p>
                        <p><strong className="text-blue-700">Relevance to Role:</strong> <span className="text-slate-600">{skill.reasoning.relevance_to_role}</span></p>
                        <p><strong className="text-blue-700">Question Strategy:</strong> <span className="text-slate-600">{skill.reasoning.question_strategy}</span></p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <EditableQuestionCard 
                  question={skill.question} 
                  index={0} 
                  skillName={skill.skill_name}
                  copyToClipboard={copyToClipboard}
                  onUpdate={(newQuestion) => onUpdateQuestion('skills_not_tested', skillIndex, 0, newQuestion)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Editable Question Card Component
function EditableQuestionCard({ 
  question, 
  index, 
  skillName,
  copyToClipboard,
  onUpdate
}: { 
  question: GapQuestion; 
  index: number;
  skillName: string;
  copyToClipboard: (text: string) => void;
  onUpdate: (newQuestion: GapQuestion) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(question.question);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateInstruction, setRegenerateInstruction] = useState('');
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);

  const handleSave = () => {
    onUpdate({
      ...question,
      question: editedQuestion
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedQuestion(question.question);
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const result = await api.regenerateQuestion({
        original_question: question.question,
        skill_name: skillName,
        instruction: regenerateInstruction || undefined
      });
      
      if (result.success && result.regenerated_question) {
        onUpdate(result.regenerated_question);
        setShowRegenerateInput(false);
        setRegenerateInstruction('');
      }
    } catch (error) {
      console.error('Failed to regenerate question:', error);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 mb-3 last:mb-0">
      <div className="flex items-start justify-between gap-4 mb-3">
        {isEditing ? (
          <textarea
            value={editedQuestion}
            onChange={(e) => setEditedQuestion(e.target.value)}
            className="flex-1 p-3 rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium resize-none"
            rows={3}
          />
        ) : (
          <p className="text-slate-800 font-medium leading-relaxed flex-1">"{question.question}"</p>
        )}
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors"
                title="Save"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => copyToClipboard(question.question)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Copy question"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors"
                title="Edit manually"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowRegenerateInput(!showRegenerateInput)}
                className="p-2 rounded-lg hover:bg-purple-100 text-slate-400 hover:text-purple-600 transition-colors"
                title="Regenerate with AI"
              >
                <Wand2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showRegenerateInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-xs text-purple-600 mb-2 font-medium">AI Regeneration Instructions (optional)</p>
              <input
                type="text"
                value={regenerateInstruction}
                onChange={(e) => setRegenerateInstruction(e.target.value)}
                placeholder="e.g., 'Make it more technical', 'Focus on teamwork aspect'..."
                className="w-full p-2 rounded-lg border border-purple-200 text-sm text-slate-700 placeholder:text-slate-400"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {regenerating ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3" />
                      Regenerate
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowRegenerateInput(false);
                    setRegenerateInstruction('');
                  }}
                  className="px-3 py-1.5 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
        <Clock className="w-3 h-3" />
        <span>{question.time_estimate}</span>
      </div>
      
      <div className="grid md:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Listen For
          </p>
          <ul className="text-xs text-emerald-600 space-y-0.5">
            {question.what_to_listen_for.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </div>
        <div className="p-3 rounded-lg bg-red-50 border border-red-100">
          <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Red Flags
          </p>
          <ul className="text-xs text-red-600 space-y-0.5">
            {question.red_flags.map((flag, i) => (
              <li key={i}>• {flag}</li>
            ))}
          </ul>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            Follow-ups
          </p>
          <ul className="text-xs text-blue-600 space-y-0.5">
            {question.follow_ups.map((fu, i) => (
              <li key={i}>• {fu}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <GeneratePageContent />
    </Suspense>
  );
}
