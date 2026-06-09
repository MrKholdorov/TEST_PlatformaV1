import React, { useState, useEffect } from 'react';
import { Trophy, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Ranking, Profile } from '../types';
import { LocalDbService } from '../db/localDb';
import { LeaderboardPodium } from './LeaderboardPodium';

interface RankingsViewProps {
  currentUser: Profile;
  onNavigate: (view: string) => void;
}

export const RankingsView: React.FC<RankingsViewProps> = ({
  currentUser,
  onNavigate
}) => {
  const [leaderboardType, setLeaderboardType] = useState<20 | 30 | 50 | 100>(20);
  const [leaderboardList, setLeaderboardList] = useState<Ranking[]>([]);

  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    loadRankings();
    const interval = setInterval(loadRankings, 4000);
    return () => clearInterval(interval);
  }, [leaderboardType]);

  const loadRankings = () => {
    const ranks = LocalDbService.getRankings()
      .filter(r => r.testType === leaderboardType)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.completionTimeSeconds - b.completionTimeSeconds; // Faster is better
      });
    setLeaderboardList(ranks);
    setAllProfiles(LocalDbService.getProfiles());
  };

  const getUserAvatar = (userId: string, fullName: string) => {
    const profile = allProfiles.find(p => p.id === userId);
    return profile?.avatar;
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-5 px-4 text-left space-y-6 animate-in fade-in duration-300" id="rankings-standalone-view">
      {/* Header with Back button */}
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
              <Trophy className="text-amber-500" size={24} /> Peshqadamlar Reytingi
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Imtihon topshirgan o'quvchilar o'rtasida umumiy peshqadamlik jadvali</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Imtihon turi bo'yicha filter:</span>
        <div className="flex gap-1.5">
          {([20, 30, 50, 100] as const).map((length) => (
            <button
              key={length}
              onClick={() => setLeaderboardType(length)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 cursor-pointer ${leaderboardType === length ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 ring-4 ring-blue-500/5' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800 hover:bg-slate-100'}`}
            >
              {length} talik test
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic podium */}
      <div className="py-2">
        <LeaderboardPodium top3={leaderboardList.slice(0, 3)} />
      </div>

      {/* TOP List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium text-left">
        <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-5 border-b border-slate-50 dark:border-slate-800 pb-3">👥 TOP 100 LISTING (Barcha o'quvchilar ko'rsatkichi)</h3>
        
        {leaderboardList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10 font-medium">Ushbu tur bo'yicha natijalar hali mavjud emas...</p>
        ) : (
          <div className="space-y-1.5 overflow-x-auto min-w-full">
            {leaderboardList.map((rank, index) => {
              const isTop3 = index < 3;
              const isMe = rank.fullName === currentUser.fullName;
              return (
                <div 
                  key={rank.id} 
                  className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border text-xs transition duration-150 ${
                    isMe 
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500/20 shadow-sm font-semibold' 
                      : isTop3 
                      ? 'bg-amber-500/5 border-amber-500/10' 
                      : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800/60'
                  } hover:shadow-premium`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${index === 0 ? 'bg-amber-400 text-slate-950' : index === 1 ? 'bg-slate-300 text-slate-950' : index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-50 text-slate-500 dark:bg-slate-800'}`}>
                      {index + 1}
                    </span>
                    
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {getUserAvatar(rank.userId, rank.fullName) ? (
                        <img src={getUserAvatar(rank.userId, rank.fullName)} alt={rank.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">{rank.fullName.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {rank.fullName}
                        {isMe && <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded-full">Siz</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{rank.subjectName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">To'g'ri/Jami</p>
                      <p className="font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5">{rank.score} / {rank.testType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Vaqt</p>
                      <p className="font-bold text-slate-650 dark:text-slate-300 mt-0.5">{rank.completionTimeFormatted}</p>
                    </div>
                    <div className="text-right min-w-[50px]">
                      <span className="font-black text-sm text-blue-600 dark:text-blue-400">{rank.percentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
