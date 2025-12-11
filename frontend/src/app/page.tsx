'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Sparkles, 
  Building2,
  Menu,
  User,
  Calendar,
  Zap,
  ArrowRight,
  FolderOpen,
  RefreshCw,
  BarChart3,
  Clock
} from 'lucide-react';
import { api, Campaign } from '@/lib/api';
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const campaignsData = await api.getCampaigns();
        setCampaigns(campaignsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  const totalCandidates = campaigns.reduce((sum, c) => sum + c.candidate_count, 0);
  const totalSessions = campaigns.reduce((sum, c) => sum + c.session_count, 0);

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
              { label: 'Campaigns', value: campaigns.length, icon: Building2, bg: 'bg-blue-50' },
              { label: 'Total Candidates', value: totalCandidates, icon: Users, bg: 'bg-violet-50' },
              { label: 'Total Sessions', value: totalSessions, icon: BarChart3, bg: 'bg-emerald-50' },
              { label: 'Data Source', value: 'Live DB', icon: RefreshCw, bg: 'bg-amber-50' },
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
                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Campaigns Section */}
      <main className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="w-12 h-12 rounded-2xl gradient-card flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Select a Campaign</h2>
              <p className="text-slate-500">Click on a campaign to view its candidates</p>
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

          {/* Campaign Cards */}
          {campaigns.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-premium p-16 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Campaigns Found</h3>
              <p className="text-slate-500">No campaigns available in the database</p>
            </motion.div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {campaigns.map((campaign) => (
                <motion.div key={campaign.campaign_id} variants={item}>
                  <Link href={`/campaign/${encodeURIComponent(campaign.campaign_id || campaign.campaign_name)}`}>
                    <div className="card-premium overflow-hidden cursor-pointer group transition-all duration-300 hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2">
                      {/* Card Header */}
                      <div className="h-28 gradient-card relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                        </div>
                        
                        <div className="absolute inset-0 p-5 flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <FolderOpen className="w-6 h-6 text-white" />
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                              <ArrowRight className="w-5 h-5 text-white group-hover:text-indigo-500 transition-colors" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors duration-300 mb-2 line-clamp-2">
                          {campaign.campaign_name}
                        </h3>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-indigo-500" />
                              <span className="text-xl font-bold text-indigo-700">{campaign.candidate_count}</span>
                            </div>
                            <p className="text-xs text-indigo-600 mt-1">Candidates</p>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-emerald-500" />
                              <span className="text-xl font-bold text-emerald-700">{campaign.session_count}</span>
                            </div>
                            <p className="text-xs text-emerald-600 mt-1">Sessions</p>
                          </div>
                        </div>

                        {/* Last Activity */}
                        {campaign.last_activity && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>Last activity: {new Date(campaign.last_activity).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Data Source Info */}
      <section className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="card-premium p-6 bg-blue-50/50 border-blue-200">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-500" />
              Data Source Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600"><strong>Campaign Name:</strong> From <code className="bg-slate-100 px-1 rounded">evaluation.campaign_name</code> column</p>
                <p className="text-slate-600"><strong>Candidate Name:</strong> Derived from <code className="bg-slate-100 px-1 rounded">evaluation.email</code> (before @)</p>
              </div>
              <div>
                <p className="text-slate-600"><strong>Session Count:</strong> <code className="bg-slate-100 px-1 rounded">COUNT(DISTINCT session_id)</code></p>
                <p className="text-slate-600"><strong>Evaluation Count:</strong> <code className="bg-slate-100 px-1 rounded">COUNT(evaluation.id)</code> (total skill rows)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
