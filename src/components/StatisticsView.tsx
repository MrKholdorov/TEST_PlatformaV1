import React from 'react';
import { LocalDbService } from '../db/localDb';
import { Activity, Target, Zap, Clock, Hash, Percent, ArrowLeft } from 'lucide-react';

interface Props {
  currentUser: any;
  onNavigate: (view: any) => void;
}

export const StatisticsView: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const stats = LocalDbService.getUserStats(currentUser.id);
  const results = LocalDbService.getResults().filter(r => r.userId === currentUser.id);
  
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Header width back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center transition active:scale-95 border border-slate-200/30 dark:border-slate-700 shadow-sm cursor-pointer shrink-0"
            aria-label="Ortga qaytish"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Activity size={24} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Umumiy Statistika</h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">Platformadagi barcha natijalaringiz tahlili</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm text-center">
          <Hash className="mx-auto text-slate-400 mb-2" size={20} />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Jami testlar</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.totalTests}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm text-center">
          <Percent className="mx-auto text-emerald-500 mb-2" size={20} />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">O'rtacha natija</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{Math.round(stats.averageScorePercentage)}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm text-center">
          <Zap className="mx-auto text-amber-500 mb-2" size={20} />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Jami duellar</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.totalDuels}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm text-center">
          <Target className="mx-auto text-rose-500 mb-2" size={20} />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Duel G'alaba</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.duelWins}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <h3 className="font-bold text-slate-900 dark:text-white pt-4">So'nggi test natijalari</h3>
      <div className="space-y-3">
        {results.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(r => (
           <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{r.subjectName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{new Date(r.createdAt).toLocaleDateString()} • {r.testType} ta savol</p>
              </div>
              <div className="text-right">
                <p className="font-black text-blue-600 dark:text-blue-400">{r.percentageScore}%</p>
                <p className="text-xs text-slate-500">{r.completionTimeFormatted}</p>
              </div>
           </div>
        ))}
        {results.length === 0 && (
          <p className="text-sm text-slate-500">Hali testlar ishlanmadi.</p>
        )}
      </div>

    </div>
  );
}
