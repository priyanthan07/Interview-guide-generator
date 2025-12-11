'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Sparkles, 
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Menu,
  User,
  Search,
  ArrowRight,
  ArrowLeft,
  Star,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  FolderOpen,
  Clock,
  FileText,
  Globe
} from 'lucide-react';
import { api, Campaign, CampaignCandidate } from '@/lib/api';
import Link from 'next/link';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function CampaignCandidatesPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = decodeURIComponent(params.id as string);
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [candidates, setCandidates] = useState<CampaignCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  
  // Campaign-level settings (cached in localStorage)
  const [jobDescription, setJobDescription] = useState('');
  const [globalInstructions, setGlobalInstructions] = useState('');
  const [showSettings, setShowSettings] = useState(true);
  
  // Cache key for localStorage
  const getCacheKey = (type: string) => `campaign_${campaignId}_${type}`;
  
  // Load cached values on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedJD = localStorage.getItem(getCacheKey('jobDescription'));
      const cachedInstructions = localStorage.getItem(getCacheKey('globalInstructions'));
      
      if (cachedJD) setJobDescription(cachedJD);
      if (cachedInstructions) setGlobalInstructions(cachedInstructions);
    }
  }, [campaignId]);
  
  // Save to localStorage when values change
  useEffect(() => {
    if (typeof window !== 'undefined' && campaignId) {
      localStorage.setItem(getCacheKey('jobDescription'), jobDescription);
    }
  }, [jobDescription, campaignId]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && campaignId) {
      localStorage.setItem(getCacheKey('globalInstructions'), globalInstructions);
    }
  }, [globalInstructions, campaignId]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch campaigns to get the campaign name
        const campaigns = await api.getCampaigns();
        const currentCampaign = campaigns.find(c => 
          c.campaign_id === campaignId || c.campaign_name === campaignId
        );
        setCampaign(currentCampaign || null);
        
        // Fetch candidates for this campaign
        const candidatesData = await api.getCampaignCandidates(campaignId);
        setCandidates(candidatesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [campaignId]);

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCandidateSelection = (email: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedCandidates(newSelected);
  };

  const selectAllCandidates = () => {
    if (selectedCandidates.size === filteredCandidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c.email)));
    }
  };

  const getSelectedSessionIds = () => {
    return filteredCandidates
      .filter(c => selectedCandidates.has(c.email) && c.latest_session_id)
      .map(c => c.latest_session_id!);
  };

  const handleGenerateClick = () => {
    const sessionIds = getSelectedSessionIds();
    if (sessionIds.length === 0) return;
    
    // Navigate with all campaign-level settings
    const queryParams = new URLSearchParams({
      sessionIds: sessionIds.join(','),
      campaignId: campaignId,
      campaignName: campaign?.campaign_name || '',
      jobDescription: jobDescription,
      globalInstructions: globalInstructions
    });
    
    router.push(`/generate?${queryParams.toString()}`);
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' };
    if (score >= 4) return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
    if (score >= 3) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
  };

  const getScoreIcon = (score: number | null) => {
    if (score === null) return <Minus className="w-3 h-3" />;
    if (score >= 4) return <TrendingUp className="w-3 h-3" />;
    if (score >= 3) return <Minus className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
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
              <Users className="w-8 h-8 text-indigo-500" />
            </motion.div>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-slate-600 font-medium"
          >
            Loading candidates...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50">
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
                  <h1 className="text-lg font-bold text-slate-800">Skillfully</h1>
                  <p className="text-xs text-slate-500">Interview Guide Generator</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-300">
                <User className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-300">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Campaign Header */}
      <section className="pt-24 pb-4 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-card flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Link href="/" className="hover:text-indigo-500 transition-colors">Campaigns</Link>
                  <span>/</span>
                  <span className="text-slate-700">Candidates</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {campaign?.campaign_name || 'Campaign'}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1 text-indigo-600">
                    <Users className="w-4 h-4" />
                    {candidates.length} candidates
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <BarChart3 className="w-4 h-4" />
                    {campaign?.session_count || 0} sessions
                  </span>
                  {campaign?.last_activity && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-4 h-4" />
                      Last: {new Date(campaign.last_activity).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Campaign-Level Settings (Job Description & Global Instructions) */}
      <section className="px-6 pb-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium overflow-hidden"
          >
            {/* Collapsible Header */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-800">Campaign Settings</h3>
                  <p className="text-sm text-slate-500">Job description & instructions for all candidates (auto-saved)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {jobDescription && (
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-600 text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    JD Saved
                  </span>
                )}
                {globalInstructions && (
                  <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-600 text-xs font-medium">
                    Instructions
                  </span>
                )}
                {showSettings ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 space-y-6 border-t border-slate-100">
                    {/* Job Description */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <label className="text-sm font-semibold text-slate-700">Job Description</label>
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                          Required
                        </span>
                      </div>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here. The AI will automatically identify required skills and generate relevant questions based on each candidate's simulation performance..."
                        className="w-full h-40 p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all duration-300 text-slate-700 placeholder:text-slate-400 resize-none text-sm"
                      />
                    </div>

                    {/* Global Instructions */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-4 h-4 text-amber-500" />
                        <label className="text-sm font-semibold text-slate-700">Global Instructions</label>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                          Optional
                        </span>
                      </div>
                      <textarea
                        value={globalInstructions}
                        onChange={(e) => setGlobalInstructions(e.target.value)}
                        placeholder="Add instructions that apply to all candidates in this campaign. e.g., 'Focus on leadership potential', 'This is a senior role', 'Probe technical depth'..."
                        className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all duration-300 text-slate-700 placeholder:text-slate-400 resize-none text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'Candidates', value: candidates.length, icon: Users, bg: 'bg-violet-50' },
              { label: 'Selected', value: selectedCandidates.size, icon: CheckCircle2, bg: 'bg-emerald-50' },
              { label: 'With Scores', value: candidates.filter(c => c.average_score !== null).length, icon: BarChart3, bg: 'bg-amber-50' },
              { label: 'Data', value: 'Live', icon: RefreshCw, bg: 'bg-blue-50' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={item}
                className="card-premium p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-slate-600`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Section Header with Search and Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl gradient-card flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Campaign Candidates</h2>
                <p className="text-slate-500">Select candidates to generate interview guides</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all duration-300 text-sm text-slate-700 placeholder:text-slate-400 w-64"
                />
              </div>
              
              {/* Bulk Select */}
              <button
                onClick={selectAllCandidates}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-600 transition-all duration-300"
              >
                {selectedCandidates.size === filteredCandidates.length ? 'Deselect All' : 'Select All'}
              </button>
              
              {/* Generate Button */}
              {selectedCandidates.size > 0 && (
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={handleGenerateClick}
                  disabled={!jobDescription.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!jobDescription.trim() ? 'Please add a job description first' : ''}
                >
                  <Sparkles className="w-4 h-4" />
                  Generate for {selectedCandidates.size}
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl"
              >
                <p className="text-red-600 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Candidates Grid */}
          {filteredCandidates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-premium p-16 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Candidates Found</h3>
              <p className="text-slate-500">
                {searchTerm ? 'Try a different search term' : 'No candidates in this campaign'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCandidates.map((candidate) => (
                <motion.div key={candidate.email} variants={item}>
                  <div 
                    className={`card-premium overflow-hidden cursor-pointer group transition-all duration-300 ${
                      selectedCandidates.has(candidate.email) 
                        ? 'ring-2 ring-indigo-500 ring-offset-2' 
                        : ''
                    }`}
                  >
                    {/* Card Header */}
                    <div 
                      onClick={() => toggleCandidateSelection(candidate.email)}
                      className="h-24 gradient-card relative overflow-hidden"
                    >
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                      </div>
                      
                      {/* Selection Checkbox */}
                      <div className="absolute top-4 right-4">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                          selectedCandidates.has(candidate.email)
                            ? 'bg-white border-white'
                            : 'border-white/50 hover:border-white'
                        }`}>
                          {selectedCandidates.has(candidate.email) && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-lg font-bold text-slate-700 transform translate-y-7">
                          {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 pt-10">
                      <h3 
                        onClick={() => toggleCandidateSelection(candidate.email)}
                        className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors duration-300 mb-1"
                      >
                        {candidate.name}
                      </h3>
                      <p className="text-slate-400 text-sm mb-4 truncate">{candidate.email}</p>
                      
                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 rounded-lg bg-slate-50">
                          <p className="text-lg font-bold text-slate-800">{candidate.session_count}</p>
                          <p className="text-xs text-slate-500">Sessions</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-slate-50">
                          <p className="text-lg font-bold text-slate-800">{candidate.evaluation_count}</p>
                          <p className="text-xs text-slate-500">Evals</p>
                        </div>
                        <div className={`text-center p-2 rounded-lg ${getScoreColor(candidate.average_score).bg}`}>
                          <p className={`text-lg font-bold ${getScoreColor(candidate.average_score).text}`}>
                            {candidate.average_score !== null ? candidate.average_score.toFixed(1) : 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500">Avg</p>
                        </div>
                      </div>

                      {/* Skill Scores Preview */}
                      {candidate.skill_scores && candidate.skill_scores.length > 0 && (
                        <div className="mb-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCandidate(expandedCandidate === candidate.email ? null : candidate.email);
                            }}
                            className="w-full flex items-center justify-between text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                          >
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {candidate.skill_scores.length} Skills Evaluated
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedCandidate === candidate.email ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <AnimatePresence>
                            {expandedCandidate === candidate.email && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                                  {candidate.skill_scores.map((skill, idx) => {
                                    const colors = getScoreColor(skill.score);
                                    return (
                                      <div 
                                        key={idx}
                                        className={`flex items-center justify-between p-2 rounded-lg border ${colors.bg} ${colors.border}`}
                                      >
                                        <span className="text-xs font-medium text-slate-700 truncate flex-1">
                                          {skill.skill}
                                        </span>
                                        <span className={`flex items-center gap-1 text-xs font-bold ${colors.text}`}>
                                          {getScoreIcon(skill.score)}
                                          {skill.score !== null ? skill.score.toFixed(1) : 'N/A'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {candidate.scenario_types.slice(0, 2).map((type) => (
                          <span key={type} className="tag tag-primary text-xs">
                            {type}
                          </span>
                        ))}
                      </div>

                      {/* Individual Generate Link */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <Link
                          href={`/session/${encodeURIComponent(candidate.latest_session_id || '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!jobDescription.trim()) {
                              alert('Please add a job description first');
                              return;
                            }
                            const queryParams = new URLSearchParams({
                              sessionIds: candidate.latest_session_id || '',
                              campaignId: campaignId,
                              campaignName: campaign?.campaign_name || '',
                              jobDescription: jobDescription,
                              globalInstructions: globalInstructions
                            });
                            router.push(`/generate?${queryParams.toString()}`);
                          }}
                          className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center hover:bg-indigo-500 transition-colors duration-300 group/btn"
                          title={!jobDescription.trim() ? 'Add job description first' : 'Generate guide'}
                        >
                          <ArrowRight className="w-5 h-5 text-indigo-500 group-hover/btn:text-white transition-colors duration-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-slate-600 font-medium">
                Interview Guide Generator by <span className="text-slate-800 font-bold">Skillfully</span>
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Built by Gayaani & Team • Hackathon 2024
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

