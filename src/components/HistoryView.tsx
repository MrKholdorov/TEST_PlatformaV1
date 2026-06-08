import React, { useState, useEffect } from 'react';
import { History, ArrowLeft, TrendingUp, CheckCircle, XCircle, Award } from 'lucide-react';
import { TestResult, Profile } from '../types';
import { LocalDbService } from '../db/localDb';
import { Certificate } from './Certificate';

interface HistoryViewProps {
  currentUser: Profile;
  onNavigate: (view: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  currentUser,
  onNavigate
}) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [reviewedCertificate, setReviewedCertificate] = useState<TestResult | null>(null);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadHistory = () => {
    const myResults = LocalDbService.getResults()
      .filter(r => r.userId === currentUser.id)
      .reverse(); // Newest first
    setResults(myResults);
  };

  // Compute Statistics
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
      // Scale points inside 100px vertical chart, and fit across 360px width
      const x = reversedResults.length > 1 ? (index / (reversedResults.length - 1)) * 360 + 20 : 200;
      const y = 90 - (r.percentageScore / 100) * 70; // Map percentage to vertical limits
      return { x, y, val: r.percentageScore };
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
    <div className="w-full max-w-7xl mx-auto py-5 px-4 text-left space-y-6 animate-in fade-in duration-300" id="history-standalone-view">
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center transition active:scale-95 border border-slate-200/30 dark:border-slate-700 shadow-sm cursor-pointer"
            aria-label="Ortga qaytish"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <History className="text-emerald-500" size={24} /> Tarix va Tahlil
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Siz topshirgan testlar tahlili va natijalar arxivi</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/15 rounded-3xl shadow-sm">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Imtihonlar</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{totalCompleted} ta</p>
          <p className="text-[10px] text-slate-450 mt-1">Umumiy topshirilgan sinovlar</p>
        </div>

        <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/15 rounded-3xl shadow-sm">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Eng yaxshi natija</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">{bestScore}%</p>
          <p className="text-[10px] text-slate-450 mt-1">Siz to'plagan rekord ball</p>
        </div>

        <div className="p-5 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-500/15 rounded-3xl shadow-sm">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">O'rtacha ball</p>
          <p className="text-3xl font-black text-orange-600 dark:text-orange-400 tracking-tight mt-1">{avgScore}%</p>
          <p className="text-[10px] text-slate-450 mt-1">Barcha urinishlar o'rtachasi</p>
        </div>
      </div>

      {/* Graphs & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* SVG charts */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium h-fit">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-4">📈 KO'RSATKICHLAR DINAMIKASI</h3>
          {renderSVGLineChart()}
        </div>

        {/* Dynamic Log list */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">📋 YAQINDA TOPSHIRILGAN IMTIHON NATIJALARI</h3>

          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium text-xs flex flex-col items-center justify-center gap-2">
              <History size={36} className="opacity-25" />
              <span>Siz hali hech qanday test topshirmagansiz</span>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r) => (
                <div 
                  key={r.id} 
                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl"
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
                        Sana: {new Date(r.createdAt).toLocaleDateString()} | Turi: {r.testType} talik
                      </p>
                    </div>
                  </div>

                  {/* Rating or actions */}
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-[9px] text-slate-405 font-bold uppercase tracking-wider">To'g'ri / Xato</p>
                      <p className="text-xs font-black text-slate-600 dark:text-slate-350 tracking-tight mt-0.5 font-mono">{r.correctAnswers} / {r.wrongAnswers}</p>
                    </div>

                    <div className="text-right">
                      <span className={`text-lg font-black tracking-tighter ${r.percentageScore >= 60 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {r.percentageScore}%
                      </span>
                    </div>

                    {r.percentageScore >= 60 ? (
                      <button
                        onClick={() => setReviewedCertificate(r)}
                        className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        Sertifikat
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic px-1 shrink-0 select-none">Yetersiz</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Certificate popup inside history panel */}
      {reviewedCertificate && (
        <div className="fixed inset-0 z-50 bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl my-8">
            <button
              onClick={() => setReviewedCertificate(null)}
              className="absolute -top-12 right-0 bg-[#0F172A] hover:bg-slate-800 text-white p-2.5 rounded-xl shadow-premium cursor-pointer"
            >
              Yopish (X)
            </button>
            <Certificate
              fullName={currentUser.fullName}
              subjectName={reviewedCertificate.subjectName}
              percentage={reviewedCertificate.percentageScore}
              testType={reviewedCertificate.testType}
              date={new Date(reviewedCertificate.createdAt).toLocaleDateString()}
              certificateNumber={reviewedCertificate.id.toUpperCase().replace('RES-', 'CERT-').substring(0, 14)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
