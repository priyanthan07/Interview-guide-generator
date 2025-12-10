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
  MessageSquare,
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
  User,
  Brain,
  Users,
  Globe,
  UserCog
} from 'lucide-react';
import Link from 'next/link';
import { api, AgenticGuideResponse, AgenticGuideResult } from '@/lib/api';

interface CandidateInstruction {
  sessionId: string;
  name: string;
  instruction: string;
}

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const sessionIds = searchParams.get('sessionIds')?.split(',').filter(Boolean) || [];
  const campaignName = searchParams.get('campaignName') || 'Unknown Campaign';
  
  // Global settings
  const [jobDescription, setJobDescription] = useState('');
  const [globalInstructions, setGlobalInstructions] = useState('');
  const [numQuestions, setNumQuestions] = useState(8);
  
  // Per-candidate instructions
  const [candidateInstructions, setCandidateInstructions] = useState<Map<string, string>>(new Map());
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideResponse, setGuideResponse] = useState<AgenticGuideResponse | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());

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

  const generateGuide = async () => {
    if (sessionIds.length === 0) {
      setError('No sessions selected');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please provide a job description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build combined instructions: global + per-candidate
      const combinedInstructions = sessionIds.map(sessionId => {
        const candidateInstruction = candidateInstructions.get(sessionId) || '';
        let combined = globalInstructions;
        if (candidateInstruction) {
          combined = combined 
            ? `${combined}\n\n[Candidate-specific]: ${candidateInstruction}`
            : `[Candidate-specific]: ${candidateInstruction}`;
        }
        return { sessionId, instruction: combined || undefined };
      });

      // For now, send the same request but with instructions combined
      // Later we can add per-candidate instruction support in the backend
      const response = await api.generateAgenticGuide({
        session_ids: sessionIds,
        job_description: jobDescription,
        required_skills: [], // Empty - auto-derive from evaluations
        custom_instructions: globalInstructions || undefined,
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

  // If we have generated guides, show them
  if (guideResponse) {
    return (
      <div className="min-h-screen gradient-hero">
        {/* Header */}
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

        {/* Guide Results */}
        <main className="pt-24 pb-12 px-6">
          <div className="max-w-4xl mx-auto">
            {guideResponse.guides.map((guide, index) => (
              <GuideDisplay 
                key={guide.session_id} 
                guide={guide} 
                index={index}
                expandedReasoning={expandedReasoning}
                toggleReasoning={toggleReasoning}
                copyToClipboard={copyToClipboard}
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
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
          {/* Campaign Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-6 mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-card flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Interview Guide Generator</h2>
                <p className="text-slate-500">Campaign: <span className="font-semibold text-slate-700">{campaignName}</span></p>
                <p className="text-sm text-slate-400">{sessionIds.length} candidate(s) selected • Skills auto-derived from evaluations</p>
              </div>
            </div>
          </motion.div>

          {/* Job Description - Global for Campaign */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-800">Job Description</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                    <Globe className="w-3 h-3 inline mr-1" />
                    Campaign-wide
                  </span>
                </div>
                <p className="text-sm text-slate-500">This applies to all candidates in the campaign</p>
              </div>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here. The AI will automatically identify required skills and generate relevant questions based on the candidate's simulation performance..."
              className="w-full h-48 p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all duration-300 text-slate-700 placeholder:text-slate-400 resize-none"
            />
          </motion.div>

          {/* Global Custom Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-premium p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-800">Global Instructions</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    Optional
                  </span>
                </div>
                <p className="text-sm text-slate-500">Applies to all candidates in this generation</p>
              </div>
            </div>
            <textarea
              value={globalInstructions}
              onChange={(e) => setGlobalInstructions(e.target.value)}
              placeholder="Add instructions that apply to all candidates. e.g., 'Focus on leadership potential', 'This is a senior role', 'Probe technical depth'..."
              className="w-full h-24 p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all duration-300 text-slate-700 placeholder:text-slate-400 resize-none"
            />
          </motion.div>

          {/* Per-Candidate Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-premium p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-800">Per-Candidate Instructions</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                    Optional
                  </span>
                </div>
                <p className="text-sm text-slate-500">Add specific notes for individual candidates (click to expand)</p>
              </div>
            </div>

            <div className="space-y-2">
              {sessionIds.map((sessionId, index) => {
                const instruction = candidateInstructions.get(sessionId) || '';
                const isExpanded = expandedCandidates.has(sessionId);
                const candidateName = `Candidate ${index + 1}`;
                
                return (
                  <div key={sessionId} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleCandidateExpand(sessionId)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                          {index + 1}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-slate-700">{candidateName}</p>
                          <p className="text-xs text-slate-400 truncate max-w-xs">
                            {instruction ? `"${instruction.slice(0, 50)}${instruction.length > 50 ? '...' : ''}"` : 'No custom instructions'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {instruction && (
                          <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-600 text-xs font-medium">
                            Has instructions
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
                          <div className="p-4 pt-0 border-t border-slate-100">
                            <textarea
                              value={instruction}
                              onChange={(e) => updateCandidateInstruction(sessionId, e.target.value)}
                              placeholder="Add specific instructions for this candidate. e.g., 'Being considered for team lead in 6 months', 'Has prior management experience', 'Focus on communication skills'..."
                              className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 transition-all duration-300 text-slate-700 placeholder:text-slate-400 resize-none text-sm"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Questions Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
                  onClick={() => setNumQuestions(Math.max(5, numQuestions - 1))}
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
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <button
              onClick={generateGuide}
              disabled={loading || sessionIds.length === 0}
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
            <p className="mt-4 text-sm text-slate-500">
              Skills will be automatically derived from simulation evaluations
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// Guide Display Component
function GuideDisplay({ 
  guide, 
  index,
  expandedReasoning,
  toggleReasoning,
  copyToClipboard
}: { 
  guide: AgenticGuideResult;
  index: number;
  expandedReasoning: Set<string>;
  toggleReasoning: (key: string) => void;
  copyToClipboard: (text: string) => void;
}) {
  if (!guide.success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
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
      transition={{ delay: index * 0.1 }}
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
          {/* Executive Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Executive Summary</h3>
            <p className="text-slate-700 leading-relaxed">{guideData.executive_summary}</p>
          </div>
          
          {/* Strengths & Red Flags */}
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
          
          {/* Interview Tips */}
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
                <p className="text-slate-600 text-sm italic">"{skill.acknowledgment_question}"</p>
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
            {guideData.sections.skill_gaps.map((gap) => (
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

                {/* Collapsible Reasoning */}
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

                {/* Questions */}
                {gap.questions.map((q, i) => (
                  <QuestionCard key={i} question={q} index={i} copyToClipboard={copyToClipboard} />
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
            {guideData.sections.skills_not_tested.map((skill) => (
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

                {/* Reasoning */}
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

                {/* Question */}
                <QuestionCard question={skill.question} index={0} copyToClipboard={copyToClipboard} />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Question Card Component
function QuestionCard({ 
  question, 
  index, 
  copyToClipboard 
}: { 
  question: { 
    question: string; 
    what_to_listen_for: string[]; 
    red_flags: string[]; 
    follow_ups: string[]; 
    time_estimate: string; 
  }; 
  index: number;
  copyToClipboard: (text: string) => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 mb-3 last:mb-0">
      <div className="flex items-start justify-between gap-4 mb-3">
        <p className="text-slate-800 font-medium leading-relaxed">"{question.question}"</p>
        <button
          onClick={() => copyToClipboard(question.question)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          title="Copy question"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
      
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
