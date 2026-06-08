import React from 'react';
import { Profile, UserStats, Achievement } from '../types';
import { Award, Target, Swords, Brain, Flame, FastForward, CheckCircle2, ChevronRight, Activity, Smartphone } from 'lucide-react';
import { LocalDbService } from '../db/localDb';
import { getTelegramUser } from '../lib/telegramClient';

interface Props {
  currentUser: Profile;
  onNavigate: (view: string) => void;
}

export const ProfilePage: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const stats = LocalDbService.getUserStats(currentUser.id);
  const achievements = LocalDbService.getAchievements(currentUser.id);

  const handleLinkTelegram = () => {
    const tgUser = getTelegramUser();
    if (tgUser) {
      const updated = {
        ...currentUser,
        telegramId: String(tgUser.id),
        telegramUsername: tgUser.username
      };
      LocalDbService.saveProfile(updated);
      alert('Telegram akkauntingiz muvaffaqiyatli ulandi!');
      window.location.reload();
    } else {
      alert("Bu funksiya asosan Telegram Mini App ichida ishlaydi. Iltimos bot orqali kiring.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row items-center gap-6 relative">
           <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 border-4 border-white dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden">
              <span className="text-3xl font-bold text-blue-700 dark:text-blue-300 tracking-tight">
                 {currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </span>
           </div>
           <div className="text-center sm:text-left">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{currentUser.fullName}</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">{currentUser.email} • {currentUser.phone}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                 <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg uppercase">
                   XP: {currentUser.xp}
                 </span>
                 <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg uppercase">
                   O'rtacha natija: {Math.round(stats.averageScorePercentage)}%
                 </span>
                 <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-lg uppercase">
                   Yutuqlar: {achievements.length} ta
                 </span>
              </div>
           </div>
        </div>
        
        {/* Telegram Integration Panel */}
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
             <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc]">
                <Smartphone size={20} />
             </div>
             <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Telegram orqali xabarnomalar</h4>
                <p className="text-xs">Natijalaringiz haqida xabar oling</p>
             </div>
           </div>
           
           {currentUser.telegramId ? (
              <span className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
                 <CheckCircle2 size={16} /> Ulangan
              </span>
           ) : (
              <button 
                onClick={handleLinkTelegram}
                className="px-6 py-2.5 bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-bold rounded-xl transition shadow-md active:scale-95"
              >
                📲 Telegram ulash
              </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Navigation Cards */}
         <button onClick={() => onNavigate('statistics')} className="group flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-premium transition-all text-left">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110 group-hover:rotate-3">
                 <Activity size={24} />
               </div>
               <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Umumiy Statistika</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Barcha natijalaringiz tahlili</p>
               </div>
            </div>
            <ChevronRight className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
         </button>

         <button onClick={() => onNavigate('achievements')} className="group flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-premium transition-all text-left">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110 group-hover:rotate-3">
                 <Award size={24} />
               </div>
               <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Yutuqlar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Qo'lga kiritilgan medallar</p>
               </div>
            </div>
            <ChevronRight className="text-slate-400 group-hover:text-amber-600 transition-colors" />
         </button>
         
         <button onClick={() => onNavigate('duels')} className="group flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-premium transition-all text-left">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center text-rose-600 transition-transform group-hover:scale-110 group-hover:rotate-3">
                 <Swords size={24} />
               </div>
               <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Bellashuvlar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Boshqa o'quvchilar bilan duel</p>
               </div>
            </div>
            <ChevronRight className="text-slate-400 group-hover:text-rose-600 transition-colors" />
         </button>

         <button onClick={() => onNavigate('mentor')} className="group flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-premium transition-all text-left">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110 group-hover:rotate-3">
                 <Brain size={24} />
               </div>
               <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">AI Mentor</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sun'iy intellekt tahlili</p>
               </div>
            </div>
            <ChevronRight className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
         </button>
      </div>
    </div>
  );
}
