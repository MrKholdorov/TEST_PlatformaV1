/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calculator, Compass, Languages, Award, Clock, ArrowRight, CheckCircle, 
  XCircle, BarChart3, TrendingUp, Sparkles, ChevronRight, Bell, Trophy, BookMarked, ShieldAlert, History, Swords
} from 'lucide-react';
import { Subject, Profile, TestResult, Ranking, DBNotification } from '../types';
import { LocalDbService } from '../db/localDb';
import { LeaderboardPodium } from './LeaderboardPodium';
import { Certificate } from './Certificate';
import { DynamicIcon } from './DynamicIcon';

interface UserDashboardProps {
  profile: Profile;
  onStartExam: (
    subjectId: string, 
    testType: 20 | 30 | 50 | 100, 
    mixedSubjectIds: string[] | undefined, 
    isTimerEnabled: boolean, 
    timePerQuestion: number,
    isExamMode: boolean
  ) => void;
  onLogOut: () => void;
  onNavigate?: (view: string) => void;
  onAdminNavigation?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  profile,
  onStartExam,
  onLogOut,
  onNavigate,
  onAdminNavigation
}) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('dashboard_active_tab') || 'subjects';
    return saved === 'notifications' ? 'subjects' : saved;
  });
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateUz = (date: Date) => {
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const days = [
      'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'
    ];
    const dayOfWeek = days[date.getDay()];
    return `${dayOfWeek}, ${day}-${month}, ${year}-yil`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<20 | 30 | 50 | 100>(20);
  const [activeSubjectForExam, setActiveSubjectForExam] = useState<Subject | null>(null);
  
  // Leaderboards state
  const [leaderboardType, setLeaderboardType] = useState<20 | 30 | 50 | 100>(20);
  const [leaderboardList, setLeaderboardList] = useState<Ranking[]>([]);

  // Certificates modal state
  const [reviewedCertificate, setReviewedCertificate] = useState<TestResult | null>(null);

  // Notification modal detail state
  const [selectedNotification, setSelectedNotification] = useState<DBNotification | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    const handleSync = () => {
      loadDashboardData();
    };
    window.addEventListener('db_synced', handleSync);

    // Online robust polling sync to refresh UI continuously matching server background fetches
    const intv = setInterval(() => {
      loadDashboardData();
    }, 5000);

    return () => {
      window.removeEventListener('db_synced', handleSync);
      clearInterval(intv);
    };
  }, [profile.id, activeTab, leaderboardType]);

  const loadDashboardData = () => {
    // Rely on LocalDb values
    const listSubj = LocalDbService.getSubjects();
    const myResults = LocalDbService.getResults().filter(r => r.userId === profile.id);
    const myNotifs = LocalDbService.getNotifications(profile.id);

    // Filter Rankings for selected type
    const ranks = LocalDbService.getRankings()
      .filter(r => r.testType === leaderboardType)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.completionTimeSeconds - b.completionTimeSeconds; // Faster is better
      });

    // Populate each subject's progress & last score based on user results history
    const enrichedSubjects = listSubj.map(sub => {
      const subResults = myResults.filter(r => r.subjectName === sub.name);
      if (subResults.length > 0) {
        const last = subResults[subResults.length - 1];
        const best = Math.max(...subResults.map(r => r.percentageScore));
        return {
          ...sub,
          lastScore: last.percentageScore,
          progress: best
        };
      }
      return sub;
    });

    setSubjects(enrichedSubjects);
    setResults(myResults.reverse()); // Show newest first
    setNotifications(myNotifs);
    setLeaderboardList(ranks);
  };

  const handleMarkNotifsRead = () => {
    LocalDbService.markNotificationsRead(profile.id);
    loadDashboardData();
  };

  const handleNotificationClick = (n: DBNotification) => {
    setSelectedNotification(n);
    if (!n.isRead) {
      LocalDbService.markSingleNotificationRead(n.id);
      loadDashboardData();
    }
  };

  // High quality computed statistics
  const totalCompleted = results.length;
  const bestScore = results.length > 0 ? Math.max(...results.map(r => r.percentageScore)) : 0;
  const avgScore = results.length > 0 ? Math.round(results.reduce((acc, current) => acc + current.percentageScore, 0) / results.length) : 0;

  // Custom high precision light responsive SVG lines renderer for analytics
  const renderSVGLineChart = () => {
    if (results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <TrendingUp size={24} className="mb-2" />
          <p className="text-xs">Statistika shakllanishi uchun kamida bitta test topshirishingiz lozim.</p>
        </div>
      );
    }

    const reversedResults = [...results].reverse(); // oldest to newest
    const points = reversedResults.map((r, index) => {
      // Scale points inside 100px vertical chart, and fit across 400px width
      const x = reversedResults.length > 1 ? (index / (reversedResults.length - 1)) * 360 + 20 : 200;
      const y = 90 - (r.percentageScore / 100) * 70; // Map percentage to vertical limits
      return { x, y, val: r.percentageScore, sub: r.subjectName };
    });

    const pathData = points.length > 1
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
      : '';

    return (
      <div className="space-y-3">
        <div className="relative w-full h-44 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/40 p-4">
          <svg viewBox="0 0 400 100" className="w-full h-full">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {/* Guide Grid Lines */}
            <line x1="10" y1="20" x2="390" y2="20" stroke="#E2E8F0" strokeOpacity="0.2" strokeWidth="0.5" />
            <line x1="10" y1="55" x2="390" y2="55" stroke="#E2E8F0" strokeOpacity="0.2" strokeWidth="0.5" />
            <line x1="10" y1="90" x2="390" y2="90" stroke="#E2E8F0" strokeOpacity="0.2" strokeWidth="0.5" />

            {/* Line connector */}
            {points.length > 1 && (
              <>
                <path d={`${pathData} L ${points[points.length-1].x} 90 L ${points[0].x} 90 Z`} fill="url(#chartGrad)" />
                <path d={pathData} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}

            {/* Scatter Dots */}
            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="3" fill="#2563EB" stroke="white" strokeWidth="1" />
                <circle cx={p.x} cy={p.y} r="7" className="fill-blue-600 opacity-0 hover:opacity-20 transition" />
              </g>
            ))}
          </svg>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans tracking-tight">
          <span>Tarix boshi</span>
          <span>Hozirgi vaqt</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-4 text-left space-y-8 animate-in fade-in duration-300" id="user-dashboard-view">
      
      {/* Premium Greetings & Real-time Info Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-premium relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-300">
        {/* Abstract organic ambient background highlights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full filter blur-3xl -translate-y-12 translate-x-12 shrink-0"></div>
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full filter blur-2xl shrink-0"></div>
        
        <div className="relative space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full font-sans">
              Online tizim faol
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Assalamu alaykum, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">{profile.fullName}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            Platforma orqali o'z bilimlaringizni sinang, raqiblar bilan bellashing va yuqori cho'qqilarni zabt eting!
          </p>
        </div>

        {/* Real-time elegant tracking Clock - Borderless & Clean */}
        <div className="relative shrink-0 flex items-center gap-3.5 select-none self-start md:self-auto py-1">
          <Clock size={20} className="text-indigo-500 dark:text-indigo-400 shrink-0 animate-pulse" />
          <div className="text-left font-sans">
            <p className="text-[15px] font-black text-slate-850 dark:text-slate-100 leading-none tracking-tight font-mono">{formatTime(currentTime)}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">{formatDateUz(currentTime)}</p>
          </div>
        </div>
      </div>

      {/* Modern Premium Navigation Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Test Ishlash */}
        <button 
          onClick={() => {
            if (onNavigate) {
              onNavigate('subjects');
            }
          }}
          className="group relative text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-premium transition-all duration-300 shadow-sm cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom duration-300"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full filter blur-xl group-hover:scale-150 transition duration-300"></div>
          <div className="flex items-start justify-between gap-3 relative">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
              <BookOpen size={24} />
            </div>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono">Imtihon</span>
          </div>
          <div className="mt-4 relative">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Test Ishlash</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-medium">Barcha o'quv fanlari bo'yicha imtihon sinovlari topshirish.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-bold">
            <span>Fanlarni tanlash</span>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Module 2: Bellashuvlar */}
        <button 
          onClick={() => {
            if (onNavigate) {
              onNavigate('duels');
            }
          }}
          className="group relative text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-rose-500/50 dark:hover:border-rose-400/50 hover:shadow-premium transition-all duration-300 shadow-sm cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom duration-300 delay-100"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full filter blur-xl group-hover:scale-150 transition duration-300"></div>
          <div className="flex items-start justify-between gap-3 relative">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
              <Swords size={24} />
            </div>
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono">Live Duel</span>
          </div>
          <div className="mt-4 relative">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Bellashuvlar (Duel)</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-medium">Jonli ravishda do'stlar va raqiblar bilan onlayn bellashish.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-bold">
            <span>Musobaqaga kirish</span>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Module 3: Reytinglar */}
        <button 
          onClick={() => {
            if (onNavigate) {
              onNavigate('rankings');
            }
          }}
          className="group relative text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 dark:hover:border-amber-400/50 hover:shadow-premium transition-all duration-300 shadow-sm cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom duration-300 delay-200"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full filter blur-xl group-hover:scale-150 transition duration-300"></div>
          <div className="flex items-start justify-between gap-3 relative">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
              <Trophy size={24} />
            </div>
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono">Reyting</span>
          </div>
          <div className="mt-4 relative">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Reytinglar</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-medium">Barcha foydalanuvchilar orasida yetakchilik reytingini o'rganish.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold">
            <span>Peshqadamlar</span>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Module 4: Tarix va tahlil */}
        <button 
          onClick={() => {
            if (onNavigate) {
              onNavigate('history');
            }
          }}
          className="group relative text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 dark:hover:border-emerald-400/50 hover:shadow-premium transition-all duration-300 shadow-sm cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom duration-300 delay-300"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full filter blur-xl group-hover:scale-150 transition duration-300"></div>
          <div className="flex items-start justify-between gap-3 relative">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
              <History size={24} />
            </div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono">Tarix</span>
          </div>
          <div className="mt-4 relative">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Tarix va Tahlil</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-medium">Barcha topshirilgan sinovlar natijasi va ularning tahlili.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            <span>Arxiv va tahlillar</span>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

    </div>
  );
};
