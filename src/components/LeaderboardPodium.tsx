/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Star, Zap } from 'lucide-react';
import { Ranking, Profile } from '../types';
import { LocalDbService } from '../db/localDb';

interface LeaderboardPodiumProps {
  top3: Ranking[];
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({ top3 }) => {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  
  useEffect(() => {
    setAllProfiles(LocalDbService.getProfiles());
  }, []);

  const getUserAvatar = (userId: string, fullName: string) => {
    const profile = allProfiles.find(p => p.id === userId);
    return profile?.avatar;
  };
  // Pad if empty
  const placeholders: Ranking[] = [
    { id: 'p1', userId: 'm1', fullName: "O'rin bo'sh", subjectName: "-", testType: 20, score: 0, percentage: 0, completionTimeSeconds: 0, completionTimeFormatted: "00:00", updatedAt: "" },
    { id: 'p2', userId: 'm2', fullName: "O'rin bo'sh", subjectName: "-", testType: 20, score: 0, percentage: 0, completionTimeSeconds: 0, completionTimeFormatted: "00:00", updatedAt: "" },
    { id: 'p3', userId: 'm3', fullName: "O'rin bo'sh", subjectName: "-", testType: 20, score: 0, percentage: 0, completionTimeSeconds: 0, completionTimeFormatted: "00:00", updatedAt: "" }
  ];

  const first = top3[0] || placeholders[0];
  const second = top3[1] || placeholders[1];
  const third = top3[2] || placeholders[2];

  // Colors for columns
  return (
    <div className="flex flex-col md:flex-row items-end justify-center gap-4 lg:gap-8 pt-10 pb-6 px-4 w-full max-w-2xl mx-auto" id="leaderboard-podium">
      
      {/* 2ND PLACE - SILVER */}
      <div className="flex flex-col items-center w-full md:w-1/3 order-2 md:order-1 mt-6 md:mt-0">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-slate-300 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xl shadow-premium relative group">
            {getUserAvatar(second.userId, second.fullName) ? (
              <img src={getUserAvatar(second.userId, second.fullName)} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xl">{second.fullName.substring(0, 2).toUpperCase()}</span>
            )}
            <div className="absolute -top-3 -right-1 bg-slate-300 text-slate-900 rounded-full p-1 text-[9px] font-bold z-10 w-6 h-6 flex items-center justify-center">2</div>
          </div>
          <p className="mt-2 font-bold text-sm text-slate-800 dark:text-slate-200 text-center truncate w-full max-w-[140px]">{second.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate w-full max-w-[140px] text-center">{second.subjectName}</p>
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <Clock size={11} /> {second.completionTimeFormatted || '00:00'}
          </div>
        </div>
        {/* Silver Column */}
        <div className="w-full mt-4 bg-gradient-to-t from-slate-200/90 to-slate-100/50 dark:from-slate-800 dark:to-slate-900 border-t-2 border-slate-300 dark:border-slate-700 rounded-t-2xl py-6 flex flex-col items-center justify-center h-28 shadow-premium md:px-2">
          <span className="text-2xl font-extrabold text-slate-400">II</span>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">{second.percentage}%</span>
          <span className="text-[10px] font-sans tracking-tight text-slate-400">{second.score} / {second.testType || 20}</span>
        </div>
      </div>

      {/* 1ST PLACE - GOLD */}
      <div className="flex flex-col items-center w-full md:w-1/3 order-1 md:order-2">
        <div className="relative flex flex-col items-center">
          {/* Animated crown above first place */}
          <div className="absolute -top-7 text-amber-500 animate-[bounce_2s_infinite]">
            <Trophy size={28} className="fill-amber-500 text-amber-400 drop-shadow-glow" />
          </div>
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-[#1E1B10] flex items-center justify-center font-extrabold text-amber-600 dark:text-amber-400 text-2xl shadow-glow relative group">
            {getUserAvatar(first.userId, first.fullName) ? (
              <img src={getUserAvatar(first.userId, first.fullName)} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-2xl">{first.fullName.substring(0, 2).toUpperCase()}</span>
            )}
            <div className="absolute -top-2 -right-1 bg-amber-400 text-[#0F172A] rounded-full p-1.5 text-[10px] font-extrabold z-10 w-6 h-6 flex items-center justify-center">1</div>
          </div>
          <p className="mt-2 font-black text-base text-slate-900 dark:text-white text-center truncate w-full max-w-[160px]">{first.fullName}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate w-full max-w-[160px] text-center">{first.subjectName}</p>
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5">
            <Clock size={11} /> {first.completionTimeFormatted || '00:00'}
          </div>
        </div>
        {/* Golden Column */}
        <div className="w-full mt-4 bg-gradient-to-t from-amber-400/20 to-amber-200/10 dark:from-amber-600/15 dark:to-amber-500/5 border-t-4 border-amber-400 dark:border-amber-500 rounded-t-3xl py-8 flex flex-col items-center justify-center h-36 shadow-glow md:px-2">
          <span className="text-3xl font-extrabold text-amber-500">I</span>
          <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-1">{first.percentage}%</span>
          <span className="text-xs font-sans tracking-tight font-bold text-amber-500">{first.score} / {first.testType || 20}</span>
        </div>
      </div>

      {/* 3RD PLACE - BRONZE */}
      <div className="flex flex-col items-center w-full md:w-1/3 order-3 md:order-3 mt-6 md:mt-0">
        <div className="relative flex flex-col items-center">
          <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-amber-700/60 dark:border-amber-800 bg-orange-50 dark:bg-amber-950/20 flex items-center justify-center font-bold text-amber-700 dark:text-amber-500 text-lg shadow-premium relative group">
            {getUserAvatar(third.userId, third.fullName) ? (
              <img src={getUserAvatar(third.userId, third.fullName)} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-lg">{third.fullName.substring(0, 2).toUpperCase()}</span>
            )}
            <div className="absolute -top-3 -right-1 bg-amber-700 text-white rounded-full p-0.5 px-1.5 text-[8px] font-bold z-10 w-6 h-6 flex items-center justify-center">3</div>
          </div>
          <p className="mt-2 font-bold text-sm text-slate-800 dark:text-slate-200 text-center truncate w-full max-w-[140px]">{third.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate w-full max-w-[140px] text-center">{third.subjectName}</p>
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <Clock size={11} /> {third.completionTimeFormatted || '00:00'}
          </div>
        </div>
        {/* Bronze Column */}
        <div className="w-full mt-4 bg-gradient-to-t from-amber-800/10 to-amber-700/5 dark:from-amber-950/20 dark:to-slate-900 border-t-2 border-amber-800/60 dark:border-amber-800 rounded-t-2xl py-5 flex flex-col items-center justify-center h-24 shadow-premium md:px-2">
          <span className="text-xl font-extrabold text-amber-800/80 dark:text-amber-600">III</span>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">{third.percentage}%</span>
          <span className="text-[10px] font-sans tracking-tight text-slate-400">{third.score} / {third.testType || 20}</span>
        </div>
      </div>

    </div>
  );
};
