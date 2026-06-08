import React, { useState } from 'react';
import { Mistake } from '../types';
import { LocalDbService } from '../db/localDb';
import { BookX, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  currentUser: any;
}

export const MistakesView: React.FC<Props> = ({ currentUser }) => {
  const [mistakes, setMistakes] = useState<Mistake[]>(LocalDbService.getMistakes(currentUser.id));

  const handleDelete = (id: string) => {
    LocalDbService.deleteMistake(id);
    setMistakes(LocalDbService.getMistakes(currentUser.id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
         <div className="w-14 h-14 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
            <BookX size={28} />
         </div>
         <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Xato ishlangan savollar</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Siz xato javob bergan barcha savollar arxivi.</p>
         </div>
      </div>

      {mistakes.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <CheckCircle size={48} className="mx-auto text-emerald-500 opacity-50 mb-4" />
          <p className="text-lg font-bold text-slate-900 dark:text-white">Ajoyib! Hech qanday xato yo'q.</p>
          <p className="text-sm text-slate-500 mt-2">Testlarni a'lo darajada yechmoqdasiz.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map(m => (
            <div key={m.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden group">
               <div className="flex justify-between items-start mb-4">
                 <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded tracking-widest uppercase">
                   {m.subjectName}
                 </span>
                 <button onClick={() => handleDelete(m.id)} className="text-slate-400 hover:text-red-500 transition border border-transparent hover:border-red-100 dark:hover:border-red-900/30 rounded p-1">
                   O'chirish
                 </button>
               </div>
               <h3 className="font-medium text-slate-900 dark:text-slate-100 leading-relaxed text-sm">{m.questionText}</h3>
               <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-700 dark:text-red-400">
                    <XCircle size={14} />
                    <span className="font-medium truncate">Sizning javobingiz: {m.options[m.selectedAnswer as keyof typeof m.options]}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle size={14} />
                    <span className="font-medium truncate">To'g'ri javob: {m.options[m.correctAnswer as keyof typeof m.options]}</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
