import React from 'react';
import { LocalDbService } from '../db/localDb';
import { Activity, Target, Zap, Clock, Hash, Percent } from 'lucide-react';

interface Props {
  currentUser: any;
}

export const StatisticsView: React.FC<Props> = ({ currentUser }) => {
  const stats = LocalDbService.getUserStats(currentUser.id);
  const results = LocalDbService.getResults().filter(r => r.userId === currentUser.id);
  
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4 py-4 border-b border-slate-200 dark:border-slate-800">
         <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm">
            <Activity size={28} />
         </div>
         <div className="text-left">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Umumiy Statistika</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Platformadagi barcha natijalaringiz tahlili.</p>
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
