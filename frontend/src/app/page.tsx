'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  FileText, 
  Sparkles, 
  ChevronRight,
  ChevronDown,
  Building2,
  CheckCircle2,
  Menu,
  User,
  Calendar,
  Briefcase,
  Search,
  Zap,
  ArrowRight,
  Star,
  Activity,
  FolderOpen,
  RefreshCw
} from 'lucide-react';
import { api, Campaign, CampaignCandidate } from '@/lib/api';
import Link from 'next/link';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
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

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [candidates, setCandidates] = useState<CampaignCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [campaignDropdownOpen, setCampaignDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const campaignsData = await api.getCampaigns();
        setCampaigns(campaignsData);
        if (campaignsData.length > 0) {
          setSelectedCampaign(campaignsData[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  useEffect(() => {
    async function fetchCandidates() {
      if (!selectedCampaign?.campaign_id) return;
      
      setLoadingCandidates(true);
      try {
        const candidatesData = await api.getCampaignCandidates(selectedCampaign.campaign_id);
        setCandidates(candidatesData);
        setSelectedCandidates(new Set());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load candidates');
      } finally {
        setLoadingCandidates(false);
      }
    }
    fetchCandidates();
  }, [selectedCampaign]);

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
              <Sparkles className="w-8 h-8 text-indigo-500" />
            </motion.div>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-slate-600 font-medium"
          >
            Loading campaigns...
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
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Skillfully</h1>
                <p className="text-xs text-slate-500">Interview Guide Generator</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-300">
                <User className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-300">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-6"
            >
              <Zap className="w-4 h-4" />
              AI-Powered Pre-Interview Guide
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Interview Guide
              <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">Generator</span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Chain-of-thought reasoning to generate targeted interview questions 
              with evidence-based insights from simulation data.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Campaign Selector */}
      <section className="px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-premium p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Select Campaign</h2>
                <p className="text-sm text-slate-500">Choose a campaign to view candidates and generate guides</p>
              </div>
            </div>

            {/* Campaign Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCampaignDropdownOpen(!campaignDropdownOpen)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-indigo-500" />
                  <span className="font-semibold text-slate-700">
                    {selectedCampaign?.campaign_name || 'Select a campaign'}
                  </span>
                  {selectedCampaign && (
                    <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium">
                      {selectedCampaign.candidate_count} candidates
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${campaignDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {campaignDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 max-h-80 overflow-y-auto"
                  >
                    {campaigns.map((campaign) => (
                      <button
                        key={campaign.campaign_id}
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setCampaignDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl ${
                          selectedCampaign?.campaign_id === campaign.campaign_id ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FolderOpen className={`w-5 h-5 ${selectedCampaign?.campaign_id === campaign.campaign_id ? 'text-indigo-500' : 'text-slate-400'}`} />
                          <div className="text-left">
                            <p className="font-medium text-slate-700">{campaign.campaign_name}</p>
                            <p className="text-xs text-slate-400">
                              {campaign.candidate_count} candidates • {campaign.session_count} sessions
                            </p>
                          </div>
                        </div>
                        {selectedCampaign?.campaign_id === campaign.campaign_id && (
                          <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'Campaigns', value: campaigns.length, icon: Building2, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
              { label: 'Candidates', value: candidates.length, icon: Users, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50' },
              { label: 'Selected', value: selectedCandidates.size, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
              { label: 'Ready', value: candidates.filter(c => c.latest_session_id).length, icon: Activity, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={item}
                className="card-premium p-5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-slate-600`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
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
            transition={{ delay: 0.4 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl gradient-card flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Campaign Candidates</h2>
                <p className="text-slate-500">Select candidates to generate interview guides</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
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
                <Link
                  href={{
                    pathname: '/generate',
                    query: { 
                      sessionIds: getSelectedSessionIds().join(','),
                      campaignName: selectedCampaign?.campaign_name
                    }
                  }}
                >
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate for {selectedCandidates.size}
                  </motion.button>
                </Link>
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

          {/* Loading Candidates */}
          {loadingCandidates ? (
            <div className="card-premium p-16 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Loading candidates...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
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
                {searchTerm ? 'Try a different search term' : 'Select a campaign with candidates'}
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
                    onClick={() => toggleCandidateSelection(candidate.email)}
                    className={`card-premium overflow-hidden cursor-pointer group transition-all duration-300 ${
                      selectedCandidates.has(candidate.email) 
                        ? 'ring-2 ring-indigo-500 ring-offset-2' 
                        : ''
                    }`}
                  >
                    {/* Card Header */}
                    <div className="h-24 gradient-card relative overflow-hidden">
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
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors duration-300 mb-1">
                        {candidate.name}
                      </h3>
                      <p className="text-slate-400 text-sm mb-4 truncate">{candidate.email}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Sessions</span>
                          <span className="font-semibold text-slate-700">{candidate.session_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Evaluations</span>
                          <span className="font-semibold text-slate-700">{candidate.evaluation_count}</span>
                        </div>
                        {candidate.average_score && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Avg Score</span>
                            <span className={`font-semibold ${
                              candidate.average_score >= 4 ? 'text-emerald-600' :
                              candidate.average_score >= 3 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {candidate.average_score.toFixed(1)}/5
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {candidate.scenario_types.slice(0, 2).map((type) => (
                          <span key={type} className="tag tag-primary text-xs">
                            {type}
                          </span>
                        ))}
                        <span className="tag tag-success text-xs">
                          {candidate.evaluation_count} evaluations
                        </span>
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
                        <Link
                          href={{
                            pathname: '/generate',
                            query: { 
                              sessionIds: candidate.latest_session_id,
                              campaignName: selectedCampaign?.campaign_name
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center hover:bg-indigo-500 transition-colors duration-300 group/btn"
                        >
                          <ArrowRight className="w-5 h-5 text-indigo-500 group-hover/btn:text-white transition-colors duration-300" />
                        </Link>
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
