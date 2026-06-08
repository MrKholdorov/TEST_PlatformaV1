import React from 'react';
import { Achievement } from '../types';
import { LocalDbService } from '../db/localDb';
import { Trophy, ShieldCheck, Flame, Star, Target, Zap, Clock, Award, Users } from 'lucide-react';

interface Props {
  currentUser: any;
}

const ALL_ACHIEVEMENTS = [
  { id: 'first_test', title: 'Ilk qadam', description: 'Birinchi testni muvaffaqiyatli topshirdingiz', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  { id: '10_tests', title: 'O\'quvchi', description: '10 ta testni yakunladingiz', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  { id: '50_tests', title: 'Mutaxassis', description: '50 ta testni yakunladingiz', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  { id: '100_tests', title: 'Bilimdon', description: '100 ta testni yakunladingiz', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' },
  { id: 'accuracy_master', title: 'Aql charxi', description: 'Testda 90% dan yuqori natija ko\'rsatdingiz', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
  { id: 'fast_responder', title: 'Yashin tezligi', description: 'Testni juda qisqa vaqt ichida yechdingiz', icon: Clock, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800' },
  { id: 'first_duel', title: 'Jangchi', description: 'Birinchi marotaba Duel da ishtirok etdingiz', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' },
  { id: '10_duel_wins', title: 'Yengilmas', description: 'Duelda 10 marta g\'alaba qozondingiz', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800' },
];

export const AchievementsView: React.FC<Props> = ({ currentUser }) => {
  const userAchievements = LocalDbService.getAchievements(currentUser.id).map(a => a.type);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4 py-4 text-center sm:text-left justify-center sm:justify-start">
         <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
            <Trophy size={28} />
         </div>
         <div className="text-left">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Yutuqlar doskasi</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Platformada ko'rsatgan faolligingiz uchun nishonlar.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {ALL_ACHIEVEMENTS.map(ach => {
          const isUnlocked = userAchievements.includes(ach.id);
          const Icon = ach.icon;
          return (
            <div key={ach.id} className={`relative overflow-hidden rounded-3xl p-5 border transition-all ${isUnlocked ? `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm` : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/50 opacity-60 grayscale'}`}>
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${ach.bg} ${ach.color} border ${ach.border}`}>
                  <Icon size={24} />
               </div>
               <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">{ach.title}</h3>
               <p className="text-[11px] text-slate-500 font-medium font-sans leading-relaxed mt-1">{ach.description}</p>
               
               {isUnlocked && (
                 <div className="absolute top-4 right-4 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded-full">
                   <Target size={14} />
                 </div>
               )}
            </div>
          )
        })}
      </div>
    </div>
  );
};
