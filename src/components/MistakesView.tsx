import React, { useState } from 'react';
import { Mistake } from '../types';
import { LocalDbService } from '../db/localDb';
import { BookX, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

interface Props {
  currentUser: any;
  onNavigate: (view: any) => void;
}

export const MistakesView: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const [mistakes, setMistakes] = useState<Mistake[]>(LocalDbService.getMistakes(currentUser.id));

  const handleDelete = (id: string) => {
    LocalDbService.deleteMistake(id);
    setMistakes(LocalDbService.getMistakes(currentUser.id));
  };

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
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <BookX size={24} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Xato ishlangan savollar</h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">Siz xato javob bergan barcha savollar arxivi</p>
            </div>
          </div>
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
                 <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded tracking-widest uppercase font-mono">
                   {m.subjectName}
                 </span>
                 <button onClick={() => handleDelete(m.id)} className="text-xs font-bold text-red-500 hover:text-red-650 dark:text-red-400 dark:hover:text-red-350 transition px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer">
                   O'chirish
                 </button>
               </div>
               <h3 className="font-semibold text-slate-950 dark:text-slate-105 leading-relaxed text-sm select-text">{m.questionText}</h3>
               <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100/45 dark:border-red-900/20 text-red-700 dark:text-red-400">
                    <XCircle size={14} className="shrink-0" />
                    <span className="font-medium select-text">Sizning javobingiz: {m.options[m.selectedAnswer as keyof typeof m.options]}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100/45 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle size={14} className="shrink-0" />
                    <span className="font-medium select-text">To'g'ri javob: {m.options[m.correctAnswer as keyof typeof m.options]}</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
