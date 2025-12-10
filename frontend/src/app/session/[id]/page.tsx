'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Printer,
  RefreshCw,
  Clock,
  Target,
  MessageSquare,
  Flag,
  Lightbulb,
  Mail,
  Briefcase,
  BarChart3,
  Download,
  Mic,
  Activity,
  Zap,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { api, SessionDetail, InterviewGuide } from '@/lib/api';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = decodeURIComponent(params.id as string);

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [guide, setGuide] = useState<InterviewGuide | null>(null);
  const [numQuestions, setNumQuestions] = useState(8);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set([0]));
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const sessionData = await api.getSessionDetail(sessionId);
        setSession(sessionData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sessionId]);

  const handleGenerateGuide = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      const guideData = await api.generateGuide(sessionId, numQuestions);
      setGuide(guideData);
      setExpandedQuestions(new Set([0]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate guide');
    } finally {
      setGenerating(false);
    }
  };

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const copyQuestion = (question: string, index: number) => {
    navigator.clipboard.writeText(question);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreFromResult = (result: Record<string, unknown> | null): number | null => {
    if (!result) return null;
    const score = result.score || result.overall_score || result.rating;
    if (typeof score === 'number') {
      return score <= 5 ? score * 20 : score <= 10 ? score * 10 : score;
    }
    if (typeof score === 'string' && score.includes('/')) {
      const [num, denom] = score.split('/').map(Number);
      return (num / denom) * 100;
    }
    return null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' };
    if (score >= 50) return { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' };
    return { bg: 'bg-red-500', light: 'bg-red-50', text: 'text-red-600' };
  };

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'hard': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin mx-auto" />
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <FileText className="w-8 h-8 text-indigo-500" />
            </motion.div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">Loading session data...</p>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Session Not Found</h2>
          <p className="text-slate-500 mb-6">The session you're looking for doesn't exist.</p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  const candidateName = session.email?.includes('@') 
    ? session.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : session.email || 'Unknown';

  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50 no-print">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">Interview Guide</h1>
                  <p className="text-xs text-slate-500">{candidateName}</p>
                </div>
              </div>
            </div>
            
            {guide && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-secondary !py-2.5 !px-4 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button className="btn-secondary !py-2.5 !px-4 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl no-print"
              >
                <p className="text-red-600 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 no-print"
            >
              {/* Candidate Card */}
              <div className="card-premium overflow-hidden">
                <div className="h-24 gradient-card relative">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-2 right-2 w-20 h-20 rounded-full bg-white/10 blur-xl" />
                  </div>
                  <div className="absolute -bottom-8 left-6">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-xl font-bold text-slate-700">
                      {candidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-12">
                  <h2 className="text-xl font-bold text-slate-800">{candidateName}</h2>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-slate-600 truncate">{session.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                      </div>
                      <span className="text-slate-600">{session.scenario_name || session.campaign_name}</span>
                    </div>
                    {session.scenario_type && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-slate-600">{session.scenario_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills Evaluated */}
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-700">
                        Skills Evaluated ({session.skills_evaluated.length})
                      </span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {session.skills_evaluated.map((skill, idx) => {
                        const score = getScoreFromResult(skill.result);
                        const colors = score ? getScoreColor(score) : null;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-3 rounded-xl border ${colors?.light || 'bg-slate-50'} border-slate-200/50`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-700 truncate pr-2">{skill.skill}</span>
                              {score !== null && (
                                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${colors?.light} ${colors?.text}`}>
                                  {Math.round(score)}%
                                </span>
                              )}
                            </div>
                            {score !== null && (
                              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${score}%` }}
                                  transition={{ delay: 0.3, duration: 0.8 }}
                                  className={`h-full rounded-full ${colors?.bg}`}
                                />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Voice Evaluation */}
                  {session.voice_evaluation?.elsa_score && (
                    <div className="mt-4 p-4 bg-violet-50 rounded-xl border border-violet-200/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-violet-600" />
                        <span className="text-sm font-semibold text-violet-700">Voice Evaluation</span>
                      </div>
                      <p className="text-xs text-violet-600/80">ELSA speech analysis available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Controls */}
              <div className="card-premium p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Generate Guide</h3>
                    <p className="text-xs text-slate-500">AI-powered interview questions</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-700">Number of Questions</label>
                      <span className="text-lg font-bold text-indigo-600">{numQuestions}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="15"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>5 min</span>
                      <span>15 max</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateGuide}
                    disabled={generating}
                    className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Interview Guide
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Interview Guide */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {guide ? (
                  <motion.div
                    key="guide"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    className="space-y-6"
                  >
                    {/* Summary Card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card-premium p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Executive Summary</h3>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{guide.guide.summary}</p>
                    </motion.div>

                    {/* Skills Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card-premium p-5"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <h4 className="font-semibold text-slate-800">Verified Skills</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {guide.verified_skills.length > 0 ? guide.verified_skills.map((skill, i) => (
                            <span key={i} className="tag tag-success">{skill}</span>
                          )) : (
                            <span className="text-slate-400 text-sm">None identified</span>
                          )}
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card-premium p-5"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          </div>
                          <h4 className="font-semibold text-slate-800">Skill Gaps</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {guide.skill_gaps.length > 0 ? guide.skill_gaps.map((gap, i) => (
                            <span key={i} className={`tag ${
                              gap.gap_severity === 'significant' ? 'tag-danger' : 'tag-warning'
                            }`}>{gap.skill_name}</span>
                          )) : (
                            <span className="text-slate-400 text-sm">No significant gaps</span>
                          )}
                        </div>
                      </motion.div>
                    </div>

                    {/* Strengths & Red Flags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card-premium p-5"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Lightbulb className="w-4 h-4 text-emerald-600" />
                          </div>
                          <h4 className="font-semibold text-slate-800">Strengths</h4>
                        </div>
                        <ul className="space-y-2">
                          {guide.guide.strengths?.map((strength, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card-premium p-5"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                            <Flag className="w-4 h-4 text-red-600" />
                          </div>
                          <h4 className="font-semibold text-slate-800">Watch For</h4>
                        </div>
                        <ul className="space-y-2">
                          {guide.guide.red_flags?.map((flag, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    </div>

                    {/* Questions */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="card-premium p-6"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-violet-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">Interview Questions</h3>
                            <p className="text-sm text-slate-500">{guide.guide.questions.length} targeted questions</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedQuestions(new Set(guide.guide.questions.map((_, i) => i)))}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Expand All
                        </button>
                      </div>
                      
                      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
                        {guide.guide.questions.map((q, index) => (
                          <motion.div
                            key={index}
                            variants={item}
                            className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-slate-300 transition-colors"
                          >
                            <button
                              onClick={() => toggleQuestion(index)}
                              className="w-full p-5 flex items-start gap-4 text-left"
                            >
                              <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 leading-relaxed pr-4">{q.question}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getDifficultyStyles(q.difficulty)}`}>
                                    {q.difficulty}
                                  </span>
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                                    <Target className="w-3 h-3 inline mr-1" />
                                    {q.skill_targeted}
                                  </span>
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {q.time_estimate}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyQuestion(q.question, index);
                                  }}
                                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  {copiedIndex === index ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-slate-400" />
                                  )}
                                </button>
                                {expandedQuestions.has(index) ? (
                                  <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                            </button>
                            
                            <AnimatePresence>
                              {expandedQuestions.has(index) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-5 pb-5 pt-0 space-y-4 ml-14">
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                      <h5 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        What to Listen For
                                      </h5>
                                      <ul className="space-y-1.5">
                                        {q.what_to_listen_for.map((item, i) => (
                                          <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                                            <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                      <h5 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                                        <Flag className="w-4 h-4" />
                                        Red Flags
                                      </h5>
                                      <ul className="space-y-1.5">
                                        {q.red_flags.map((flag, i) => (
                                          <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                                            <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                                            {flag}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                      <h5 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Follow-up Questions
                                      </h5>
                                      <ul className="space-y-1.5">
                                        {q.follow_up_questions.map((followUp, i) => (
                                          <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                                            <span className="font-bold">{i + 1}.</span>
                                            {followUp}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="card-premium p-16 text-center"
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-8"
                    >
                      <Sparkles className="w-12 h-12 text-indigo-500" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">
                      Ready to Generate
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                      Create a personalized interview guide based on this candidate's 
                      simulation results. AI will analyze their performance and generate 
                      targeted questions.
                    </p>
                    <button
                      onClick={handleGenerateGuide}
                      disabled={generating}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Generate Interview Guide
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
