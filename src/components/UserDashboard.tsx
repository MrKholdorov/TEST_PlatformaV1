/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calculator, Compass, Languages, Award, Clock, ArrowRight, CheckCircle, 
  XCircle, BarChart3, TrendingUp, Sparkles, ChevronRight, Bell, Trophy, BookMarked, ShieldAlert
} from 'lucide-react';
import { Subject, Profile, TestResult, Ranking, DBNotification } from '../types';
import { LocalDbService } from '../db/localDb';
import { LeaderboardPodium } from './LeaderboardPodium';
import { Certificate } from './Certificate';
import { DynamicIcon } from './DynamicIcon';

interface UserDashboardProps {
  profile: Profile;
  onStartExam: (subjectId: string, testType: 20 | 30 | 50 | 100) => void;
  onLogOut: () => void;
  onAdminNavigation?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  profile,
  onStartExam,
  onLogOut,
  onAdminNavigation
}) => {
  const [activeTab, setActiveTab] = useState<string>('subjects');
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
    
    // Online robust polling sync to refresh UI continuously matching server background fetches
    const intv = setInterval(() => {
      loadDashboardData();
    }, 5000);
    return () => clearInterval(intv);
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
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>Tarix boshi</span>
          <span>Hozirgi vaqt</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-4 text-left" id="user-dashboard-view">
      
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-6 shadow-premium">
        <div className="flex items-center gap-4">
          {/* Avatar frame */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-extrabold text-xl shadow-glow uppercase select-none">
            {profile.fullName.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-950 dark:text-white">{profile.fullName}</h1>
              <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2.5 py-0.5 rounded-full dark:bg-blue-950/40 dark:text-blue-400">
                O'quvchi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{profile.phone} | {profile.email}</p>
          </div>
        </div>

        {/* Level & XP progression indicator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-6 lg:mt-0">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800 min-w-[150px]">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-500">Tajriba (XP):</span>
              <span className="text-blue-600 font-mono">{profile.xp || 0} XP</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${Math.min(((profile.xp || 0) / 5000) * 100, 100)}%` }} 
              />
            </div>
          </div>

          {onAdminNavigation && (
            <button
              onClick={onAdminNavigation}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition duration-150 active:scale-95 shadow-glow cursor-pointer"
            >
              🚀 Admin Panel
            </button>
          )}

          <button
            onClick={onLogOut}
            className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition duration-150 active:scale-95 shadow-premium cursor-pointer"
            id="btn-user-logout"
          >
            Chiqish (Logout)
          </button>
        </div>
      </div>

      {/* Grid Dashboard structure with Sidebar summary stats and Main Workspace Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left-hand summary columns: Quick scores & analytics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-5">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">Statistika</h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-1 gap-4">
              {/* Box 1 */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/15 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Imtihonlar</p>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{totalCompleted} ta</p>
              </div>

              {/* Box 2 */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/15 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Eng yaxshi</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{bestScore}%</p>
              </div>

              {/* Box 3 */}
              <div className="p-3 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-500/15 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase">O'rtacha ball</p>
                <p className="text-xl font-black text-orange-600 dark:text-orange-400 font-mono mt-1">{avgScore}%</p>
              </div>
            </div>
          </div>

          {/* Quick Support Badge */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-premium relative overflow-hidden flex flex-col gap-3">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-transparent rounded-full filter blur-xl opacity-30"></div>
            <Award className="text-blue-500" size={28} />
            <div>
              <h4 className="font-bold text-sm text-slate-100">Mr. Kholdorov</h4>
              <p className="text-xs text-slate-400 mt-1">A’lo natijalar uchun sertifikat kodi beriladi hamda rasmiy tarzda g'oliblarga taqdim etiladi.</p>
            </div>
            <a href="https://t.me/MrKholdorov" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-400 flex items-center gap-1 hover:underline">
              Batafsil ma'lumot <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* Right Dashboard Workspace Panel */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Main Selectors */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 h-11 overflow-x-auto whitespace-nowrap">
            {[
              { id: 'subjects', label: '📚 Fanlar', icon: BookOpen },
              { id: 'analytics', label: '📊 Tahlillar (Analytics)', icon: BarChart3 },
              { id: 'rankings', label: '🏆 Peshqadamlar', icon: Trophy },
              { id: 'notifications', label: '🔔 Bildirishnoma', icon: Bell, badgeCount: notifications.filter(n=>!n.isRead).length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition duration-150 cursor-pointer ${activeTab === tab.id ? 'bg-[#0F172A] text-white dark:bg-slate-850' : 'text-slate-500 hover:bg-slate-150/50 dark:hover:bg-slate-800'}`}
              >
                <span>{tab.label}</span>
                {tab.badgeCount && tab.badgeCount > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold font-mono animate-bounce">{tab.badgeCount}</span>
                ) : null}
              </button>
            ))}
          </div>

          {/* TAB: Subjects lists */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              {/* Premium Mixed Subject Featured Section */}
              <div 
                onClick={() => {
                  const virtualMixedSubject = {
                    id: 'mixed',
                    name: "Aralash Savollar (Barcha fanlar)",
                    icon: 'Sparkles',
                    description: "Matematika, Ona tili va adabiyot, Ingliz tili va Tarix fanlarining barcha savollarini o'zi ichiga olgan aralash test rejimi.",
                    totalQuestions: LocalDbService.getQuestions().length,
                    progress: results.filter(r => r.subjectName === "Aralash Savollar (Barcha fanlar)").length > 0 
                      ? Math.max(...results.filter(r => r.subjectName === "Aralash Savollar (Barcha fanlar)").map(r => r.percentageScore)) 
                      : 0
                  };
                  setActiveSubjectForExam(virtualMixedSubject);
                }}
                className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-3xl p-6 shadow-premium cursor-pointer group hover:shadow-glow transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl transform translate-x-12 -translate-y-12 shrink-0 group-hover:scale-110 transition duration-300"></div>
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-xl text-left">
                    <span className="inline-flex items-center gap-1.5 bg-white/10 text-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-md uppercase tracking-wider">
                      <Sparkles size={10} className="animate-spin text-amber-300" /> SUPER INOVATSIYA
                    </span>
                    <h3 className="font-extrabold text-xl sm:text-2xl tracking-tight leading-none text-slate-100">
                      Barcha fanlardan aralash imtihon topshirish
                    </h3>
                    <p className="text-xs text-blue-100/90 leading-relaxed">
                      Matematika, Ona tili va adabiyot, Ingliz tili va Tarix fanlarining barcha savollaridan tuzilgan universal test sinovi. Haqiqiy bilimingizni umumiy imtihon reytingida sinab ko'ring!
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end shrink-0 gap-1.5">
                    <span className="text-[10px] font-mono text-blue-200 font-bold uppercase">UMUMIY SAVOLLAR</span>
                    <span className="text-lg font-black font-mono text-white bg-white/10 px-3 py-1 rounded-xl backdrop-blur-md">
                      {LocalDbService.getQuestions().length} ta bazada
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-100 font-medium">
                  <p>
                    O'rtacha natijangiz: <span className="font-bold underline text-white font-mono">
                      {results.filter(r => r.subjectName === "Aralash Savollar (Barcha fanlar)").length > 0 
                        ? `${Math.max(...results.filter(r => r.subjectName === "Aralash Savollar (Barcha fanlar)").map(r => r.percentageScore))}%` 
                        : "topshirilmagan"}
                    </span>
                  </p>
                  <span className="inline-flex items-center gap-1 font-bold text-white group-hover:translate-x-1 transition duration-155">
                    Imtihonni Tanlash va Boshlash <ArrowRight size={14} />
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setActiveSubjectForExam(sub)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500/40 dark:hover:border-blue-500/45 transition shadow-premium cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {/* Icon & title */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition shrink-0">
                          <DynamicIcon name={sub.icon} size={20} />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Savollar soni</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{sub.totalQuestions} ta</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-base text-slate-950 dark:text-white leading-tight group-hover:text-blue-600 transition">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 lines-2 leading-relaxed">
                        {sub.description}
                      </p>
                    </div>

                    {/* Progress representation */}
                    <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Oxirgi natija: <span className="font-bold font-mono text-slate-600 dark:text-slate-300">{sub.lastScore ? `${sub.lastScore}%` : 'topshirilmagan'}</span></span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">Eng yuqori: {sub.progress}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${sub.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Analytical records overview */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-4 font-mono">📈 % KO'RSATKICHLAR DINAMIKASI (Diagramma)</h3>
                {renderSVGLineChart()}
              </div>

              {/* Recent test results list */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium text-left">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-50 dark:border-slate-800 pb-3 font-mono">📋 YAQINDA TOPSHIRILGAN IMTIHON NATIJALARI</h3>
                
                {results.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Hech qanday natija saqlanmagan...</p>
                ) : (
                  <div className="space-y-3">
                    {results.map((r) => (
                      <div 
                        key={r.id} 
                        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-xl"
                      >
                        <div className="flex gap-3 items-center">
                          {r.percentageScore >= 60 ? (
                            <CheckCircle className="text-emerald-500 shrink-0" size={24} />
                          ) : (
                            <XCircle className="text-red-500 shrink-0" size={24} />
                          )}
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{r.subjectName}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Sana: {new Date(r.createdAt).toLocaleDateString()} | Vaqt sarfi: {r.completionTimeFormatted} | Turi: {r.testType} talik
                            </p>
                          </div>
                        </div>

                        {/* Right side scores */}
                        <div className="flex items-center gap-4 justify-between sm:justify-end">
                          <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold uppercase">To'g'ri / Noto'g'ri</p>
                            <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                              {r.correctAnswers} / {r.wrongAnswers}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <span className={`text-lg font-black font-mono ${r.percentageScore >= 60 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {r.percentageScore}%
                            </span>
                          </div>

                          {/* Request certificate if passing score */}
                          {r.percentageScore >= 60 ? (
                            <button
                              onClick={() => setReviewedCertificate(r)}
                              className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-2 rounded-xl transition duration-150 cursor-pointer text-center"
                            >
                              Sertifikat
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-mono px-2">Yetersiz ball</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Leaderboards and Rank Columns */}
          {activeTab === 'rankings' && (
            <div className="space-y-6">
              
              {/* Type Category selection */}
              <div className="flex flex-wrap gap-2 items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">Imtihon turi bo'yicha filter:</span>
                <div className="flex gap-1">
                  {([20, 30, 50, 100] as const).map((length) => (
                    <button
                      key={length}
                      onClick={() => setLeaderboardType(length)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition duration-150 cursor-pointer ${leaderboardType === length ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800'}`}
                    >
                      {length} talik test
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic physical top columns podium rendering */}
              <LeaderboardPodium top3={leaderboardList.slice(0, 3)} />

              {/* Full listings tables */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-4 font-mono">👥 TOP 100 LISTING (Barcha o'quvchilar ko'rsatkichi)</h3>
                
                {leaderboardList.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Kategoriya bo'yicha imtihon topshiriqlari yo'q...</p>
                ) : (
                  <div className="space-y-1 overflow-x-auto min-w-full">
                    {leaderboardList.map((rank, index) => {
                      const isTop3 = index < 3;
                      return (
                        <div 
                          key={rank.id} 
                          className={`flex items-center justify-between gap-4 p-3 rounded-xl border font-mono text-xs ${isTop3 ? 'bg-amber-500/5 border-amber-500/10' : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'} hover:shadow-premium transition`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${index === 0 ? 'bg-amber-400 text-slate-9a0 flex font-extrabold' : index === 1 ? 'bg-slate-300 text-slate-900' : index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-50 text-slate-500 dark:bg-slate-800'}`}>
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{rank.fullName}</p>
                              <p className="text-[10px] text-slate-400">{rank.subjectName}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[9px] text-slate-400 font-bold uppercase">To'g'ri/Jami</p>
                              <p className="font-bold text-slate-600 dark:text-slate-300">{rank.score} / {rank.testType}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Vaqt</p>
                              <p className="font-bold text-slate-600 dark:text-slate-300">{rank.completionTimeFormatted}</p>
                            </div>
                            <div className="text-right min-w-[50px]">
                              <span className="font-extrabold text-blue-600 dark:text-blue-400">{rank.percentage}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-850 pb-3">
                <span className="text-xs text-slate-500 font-bold font-mono">Barcha bildirishnomalar ({notifications.length} ta)</span>
                <button
                  onClick={handleMarkNotifsRead}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Hammasini o'qildi deb belgilash
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400">
                  Bildirishnomalar mavjud emas.
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => {
                    let borderTheme = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900";
                    if (!n.isRead) {
                      borderTheme = "border-blue-200 bg-blue-50/20 dark:bg-blue-950/20 dark:border-blue-900/60 font-medium";
                    }
                    return (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={`p-4 border rounded-xl text-left transition duration-150 cursor-pointer hover:shadow-premium hover:-translate-y-[1px] active:scale-[0.99] select-none ${borderTheme}`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                              {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />}
                              {n.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* MODAL Popup for Subject Exam length Selection */}
      {activeSubjectForExam && (
        <div className="fixed inset-0 z-50 bg-[#000000]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-premium text-left animate-scale-up space-y-6">
            
            {/* Header */}
            <div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <DynamicIcon name={activeSubjectForExam.icon} size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {activeSubjectForExam.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">Imtihonga mos savollar sonini tanlang:</p>
            </div>

            {/* Slider/Radio Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {[20, 30, 50, 100].map((length) => (
                <button
                  key={length}
                  onClick={() => setSelectedExamType(length as any)}
                  className={`p-3 rounded-2xl border text-center transition duration-150 cursor-pointer ${selectedExamType === length ? 'bg-blue-50 text-blue-600 border-blue-500 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 ring-4 ring-blue-500/10' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-100'}`}
                >
                  <p className="text-lg font-black font-mono leading-none">{length}</p>
                  <p className="text-[10px] font-bold uppercase mt-1">Savolli test</p>
                  <p className="text-[9px] font-mono whitespace-nowrap text-slate-400">{length} daqiqa vaqt</p>
                </button>
              ))}
            </div>

            {/* Warning notes */}
            <div className="flex gap-2 items-start bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 text-slate-500">
              <ShieldAlert size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                Tizimda har bir savol uchun 1 daqiqa vaqt ajratiladi. Imtihon boshlagach orqaga qaytib bo'lmaydi. Savollar tasodifiy tushadi.
              </p>
            </div>

            {/* Action controls */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setActiveSubjectForExam(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  const subId = activeSubjectForExam.id;
                  setActiveSubjectForExam(null);
                  onStartExam(subId, selectedExamType);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 shadow-glow cursor-pointer"
              >
                Imtihonni boshlash
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL Popup for Certificate viewer */}
      {reviewedCertificate && (
        <div className="fixed inset-0 z-50 bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl my-8">
            {/* Close button on modal header wrapper */}
            <button
              onClick={() => setReviewedCertificate(null)}
              className="absolute -top-12 right-0 bg-[#0F172A] hover:bg-slate-800 text-white p-2.5 rounded-xl shadow-premium cursor-pointer"
            >
              Yopish (X)
            </button>
            
            <Certificate
              fullName={profile.fullName}
              subjectName={reviewedCertificate.subjectName}
              percentage={reviewedCertificate.percentageScore}
              testType={reviewedCertificate.testType}
              date={new Date(reviewedCertificate.createdAt).toLocaleDateString()}
              certificateNumber={reviewedCertificate.id.toUpperCase().replace('RES-', 'CERT-').substring(0, 14)}
            />
          </div>
        </div>
      )}

      {/* MODAL Popup for Notification Detail viewer */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 bg-[#000000]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-premium text-left animate-scale-up space-y-4">
            
            {/* Header / Type badging */}
            <div className="flex justify-between items-center">
              <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full ${
                selectedNotification.type === 'warning' 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' 
                  : selectedNotification.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : selectedNotification.type === 'info'
                  ? 'bg-[#E0F2FE] text-[#0369A1] dark:bg-blue-950/40 dark:text-blue-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350'
              }`}>
                {selectedNotification.type || 'tizim'} Xabari
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(selectedNotification.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Title */}
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                {selectedNotification.title}
              </h3>
            </div>

            {/* Message Body */}
            <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-sans border-t border-slate-100 dark:border-slate-900 pt-3">
              {selectedNotification.message}
            </p>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-5 py-2 bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition duration-150 active:scale-95 cursor-pointer"
              >
                Tushunarli
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
