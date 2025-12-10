'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  FileText, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Menu,
  User,
  Calendar,
  Briefcase,
  Search,
  Filter,
  Zap,
  ArrowRight,
  Star,
  Activity
} from 'lucide-react';
import { api, Session } from '@/lib/api';
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const sessionsData = await api.getSessions(50);
        setSessions(sessionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Group sessions by email (candidate)
  const candidateMap = new Map<string, Session[]>();
  sessions.forEach(session => {
    const email = session.email || 'Unknown';
    if (!candidateMap.has(email)) {
      candidateMap.set(email, []);
    }
    candidateMap.get(email)!.push(session);
  });

  const candidates = Array.from(candidateMap.entries()).map(([email, sessions]) => ({
    email,
    name: email.includes('@') ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : email,
    sessions,
    latestSession: sessions[0],
    totalEvaluations: sessions.reduce((sum, s) => sum + s.evaluation_count, 0)
  }));

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.latestSession.scenario_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <section className="pt-28 pb-12 px-6">
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
              AI-Powered Interview Preparation
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Generate Perfect
              <span className="block text-transparent bg-clip-text gradient-accent">Interview Guides</span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Transform simulation results into personalized interview questions. 
              Help recruiters make better hiring decisions with AI-powered insights.
            </p>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative max-w-xl mx-auto"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates, roles, or campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all duration-300 text-slate-700 placeholder:text-slate-400"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'Candidates', value: candidates.length, icon: Users, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
              { label: 'Sessions', value: sessions.length, icon: FileText, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50' },
              { label: 'Evaluations', value: sessions.reduce((sum, s) => sum + s.evaluation_count, 0), icon: Activity, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
              { label: 'Ready', value: candidates.length, icon: CheckCircle2, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={item}
                className="card-premium p-5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} style={{ WebkitTextStroke: '2px currentColor' }} />
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
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl gradient-card flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Recent Candidates</h2>
                <p className="text-slate-500">Select a candidate to generate interview guide</p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">
              {filteredCandidates.length} candidates
            </span>
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
                {searchTerm ? 'Try a different search term' : 'Make sure the backend is connected and running'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCandidates.slice(0, 12).map((candidate) => (
                <motion.div key={candidate.email} variants={item}>
                  <Link href={`/session/${encodeURIComponent(candidate.latestSession.session_id)}`}>
                    <div className="card-premium overflow-hidden cursor-pointer group">
                      {/* Card Header */}
                      <div className="h-28 gradient-card relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                          <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-xl font-bold text-slate-700 transform translate-y-8 group-hover:translate-y-6 transition-transform duration-300">
                            {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex gap-2 mb-2">
                            <span className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">
                              {candidate.sessions.length} session{candidate.sessions.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 pt-12">
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors duration-300 mb-1">
                          {candidate.name}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4 truncate">{candidate.email}</p>
                        
                        <div className="space-y-3 mb-5">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                              <Briefcase className="w-4 h-4 text-indigo-500" />
                            </div>
                            <span className="text-slate-600 truncate flex-1">
                              {candidate.latestSession.scenario_name || candidate.latestSession.campaign_name || 'Unknown Role'}
                            </span>
                          </div>
                          
                          {candidate.latestSession.last_evaluation && (
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-emerald-500" />
                              </div>
                              <span className="text-slate-600">
                                {new Date(candidate.latestSession.last_evaluation).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {candidate.latestSession.scenario_type && (
                            <span className="tag tag-primary">
                              {candidate.latestSession.scenario_type}
                            </span>
                          )}
                          <span className="tag tag-success">
                            {candidate.totalEvaluations} evaluations
                          </span>
                        </div>

                        {/* Action */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <span className="text-sm font-medium text-slate-500">Generate Guide</span>
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-500 transition-colors duration-300">
                            <ArrowRight className="w-5 h-5 text-indigo-500 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
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
