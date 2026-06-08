import React from 'react';
import { Profile, UserStats, Achievement } from '../types';
import { Award, Target, Swords, Brain, Flame, FastForward, CheckCircle2, ChevronRight, Activity, Smartphone, BookOpen, Trophy, History } from 'lucide-react';
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
      const linkUrl = `https://t.me/TestONLINE_uzbot?start=link_${currentUser.id}`;
      window.open(linkUrl, '_blank');
      alert("Telegram botimizga yo'naltirildingiz! Botda 'Start' tugmasini bosing va hisobingiz platformaga avtomat bog'lanadi!");
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
         <button 
           onClick={() => {
             localStorage.setItem('dashboard_active_tab', 'subjects');
             onNavigate('dashboard');
           }} 
           className="group flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md hover:shadow-premium hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all text-left cursor-pointer duration-300"
         >
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                 <BookOpen size={28} />
               </div>
               <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Test Ishlash</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Barcha fanlar bo'yicha imtihon sinovlari</p>
               </div>
            </div>
            <ChevronRight className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
         </button>

         <button 
           onClick={() => onNavigate('duels')} 
           className="group flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md hover:shadow-premium hover:border-rose-500/40 dark:hover:border-rose-500/40 transition-all text-left cursor-pointer duration-300"
         >
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                 <Swords size={28} />
               </div>
               <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Bellashuvlar (Duel)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Jonli do'stlar va raqiblar bilan bellashish</p>
               </div>
            </div>
            <ChevronRight className="text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
         </button>
         
         <button 
           onClick={() => {
             localStorage.setItem('dashboard_active_tab', 'rankings');
             onNavigate('dashboard');
           }} 
           className="group flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md hover:shadow-premium hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all text-left cursor-pointer duration-300"
         >
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                 <Trophy size={28} />
               </div>
               <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Reytinglar</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Barcha o'quvchilar peshqadamlik reytingi</p>
               </div>
            </div>
            <ChevronRight className="text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
         </button>

         <button 
           onClick={() => {
             localStorage.setItem('dashboard_active_tab', 'history');
             onNavigate('dashboard');
           }} 
           className="group flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md hover:shadow-premium hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all text-left cursor-pointer duration-300"
         >
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                 <History size={28} />
               </div>
               <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Tarix va Tahlil</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Oldingi testlar natijalari tarixi</p>
               </div>
            </div>
            <ChevronRight className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
         </button>
      </div>
    </div>
  );
}
