import React, { useState, useEffect } from 'react';
import { BookOpen, ArrowLeft, Sparkles, ArrowRight, ShieldAlert, Trophy } from 'lucide-react';
import { Subject, Profile, TestResult } from '../types';
import { LocalDbService } from '../db/localDb';
import { DynamicIcon } from './DynamicIcon';

interface SubjectsViewProps {
  currentUser: Profile;
  onStartExam: (subjectId: string, testType: 20 | 30 | 50 | 100, mixedSubjectIds: string[] | undefined, isTimerEnabled: boolean, timePerQuestion: number) => void;
  onNavigate: (view: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  currentUser,
  onStartExam,
  onNavigate
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<20 | 30 | 50 | 100>(20);
  const [activeSubjectForExam, setActiveSubjectForExam] = useState<Subject | null>(null);
  const [selectedMixedSubjects, setSelectedMixedSubjects] = useState<string[]>([]);
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(true);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(1);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const loadData = () => {
    const listSubj = LocalDbService.getSubjects();
    const myResults = LocalDbService.getResults().filter(r => r.userId === currentUser.id);

    // Populate each subject's progress & last score
    const Enriched = listSubj.map(sub => {
      const subResults = myResults.filter(r => r.subjectName === sub.name);
      if (subResults.length > 0) {
        const last = subResults[subResults.length - 1];
        const best = Math.max(...subResults.map(r => r.percentageScore));
        return {
          ...sub,
          lastScore: last.percentageScore,
          progress: best
        };
      }
      return sub;
    });

    setSubjects(Enriched);
    setResults(myResults);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-5 px-4 text-left space-y-6 animate-in fade-in duration-300" id="subjects-standalone-view">
      {/* Standalone Elegant Header in Subject lists */}
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
              <BookOpen className="text-blue-600 dark:text-blue-400" size={24} /> Test Topshirish
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">O'zingizga mos fanni tanlang va sinov jarayonini boshlang</p>
          </div>
        </div>
      </div>

      {/* Premium Mixed Subject Featured Section */}
      <div 
        onClick={() => {
          const virtualMixedSubject = {
            id: 'mixed',
            name: "Aralash Savollar (Tanlangan fanlar)",
            icon: 'Sparkles',
            description: "O'zingiz tanlagan fanlardan aralash test rejimi.",
            totalQuestions: LocalDbService.getQuestions().length,
            progress: results.filter(r => r.subjectName === "Aralash Savollar (Tanlangan fanlar)").length > 0 
              ? Math.max(...results.filter(r => r.subjectName === "Aralash Savollar (Tanlangan fanlar)").map(r => r.percentageScore)) 
              : 0
          };
          setSelectedMixedSubjects(subjects.map(s => s.id));
          setActiveSubjectForExam(virtualMixedSubject);
        }}
        className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-3xl p-6 shadow-premium cursor-pointer group hover:shadow-glow transition-all duration-300 border border-white/5"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl transform translate-x-12 -translate-y-12 shrink-0 group-hover:scale-110 transition duration-300"></div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl text-left">
            <span className="inline-flex items-center gap-1.5 bg-white/10 text-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-md uppercase tracking-wider">
              <Sparkles size={10} className="animate-spin text-amber-300" /> SUPER INOVATSIYA
            </span>
            <h3 className="font-extrabold text-xl sm:text-2xl tracking-tight leading-none text-slate-100">
              Barcha fanlardan aralash imtihon topshirish
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Matematika, Ona tili va adabiyot, Ingliz tili va Tarix fanlarining barcha savollaridan tuzilgan universal test sinovi. Haqiqiy bilimingizni umumiy imtihon reytingida sinab ko'ring!
            </p>
          </div>
          
          <div className="flex flex-col items-start md:items-end shrink-0 gap-1.5">
            <span className="text-xs text-blue-200/80 font-medium">Umumiy savollar</span>
            <span className="text-2xl font-black font-display tracking-tight text-white bg-white/10 px-4 py-1.5 rounded-xl backdrop-blur-md">
              {LocalDbService.getQuestions().length} ta bazada
            </span>
          </div>
        </div>

        <div className="relative mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-100 font-medium">
          <p>
            O'rtacha natijangiz: <span className="font-bold underline text-white font-sans tracking-tight">
              {results.filter(r => r.subjectName === "Aralash Savollar (Tanlangan fanlar)").length > 0 
                ? `${Math.max(...results.filter(r => r.subjectName === "Aralash Savollar (Tanlangan fanlar)").map(r => r.percentageScore))}%` 
                : "Hali topshirilmagan"}
            </span>
          </p>
          <span className="inline-flex items-center gap-1 font-bold text-white group-hover:translate-x-1 transition duration-155">
            Imtihonni Tanlash va Boshlash <ArrowRight size={14} />
          </span>
        </div>
      </div>

      {/* Grid of separate subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            onClick={() => setActiveSubjectForExam(sub)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition shadow-premium hover:shadow-premium cursor-pointer group flex flex-col justify-between duration-200"
          >
            <div>
              {/* Icon & title */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition shrink-0">
                  <DynamicIcon name={sub.icon} size={20} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-sans tracking-tight text-slate-400 font-bold uppercase">Savollar soni</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans tracking-tight">{sub.totalQuestions} ta</span>
                </div>
              </div>

              <h3 className="font-bold text-base text-slate-950 dark:text-white leading-tight group-hover:text-blue-600 transition">
                {sub.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 lines-2 leading-relaxed">
                {sub.description}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Oxirgi natijangiz: <span className="font-bold text-slate-600 dark:text-slate-300">{sub.lastScore ? `${sub.lastScore}%` : 'Hali topshirilmagan'}</span></span>
                <span className="font-bold text-blue-600 dark:text-blue-400">Eng yuqori: {sub.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${sub.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EXAM CONFIGURATION MODAL */}
      {activeSubjectForExam && (
        <div className="fixed inset-0 z-50 bg-[#000000]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-premium text-left animate-scale-up space-y-6">
            
            {/* Header */}
            <div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <DynamicIcon name={activeSubjectForExam.icon} size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {activeSubjectForExam.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">Imtihonga mos savollar sonini tanlang:</p>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[20, 30, 50, 100].map((length) => (
                <button
                  key={length}
                  onClick={() => setSelectedExamType(length as any)}
                  className={`p-3 rounded-2xl border text-center transition duration-150 cursor-pointer ${selectedExamType === length ? 'bg-blue-50 text-blue-600 border-blue-500 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 ring-4 ring-blue-500/10' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-100'}`}
                >
                  <p className="text-lg font-black font-sans tracking-tight leading-none">{length}</p>
                  <p className="text-[10px] font-bold uppercase mt-1">Savolli test</p>
                  <p className="text-[9px] font-sans tracking-tight whitespace-nowrap text-slate-400">{length} daqiqa vaqt</p>
                </button>
              ))}
            </div>

            {/* Mixed Subject Optimization */}
            {activeSubjectForExam.id === 'mixed' && (
              <div className="space-y-2 mt-4">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Qaysi fanlardan savol tushsin?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                   {subjects.map(sub => (
                     <label key={sub.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                       <input 
                         type="checkbox" 
                         className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" 
                         checked={selectedMixedSubjects.includes(sub.id)}
                         onChange={(e) => {
                           if (e.target.checked) {
                             setSelectedMixedSubjects(prev => [...prev, sub.id]);
                           } else {
                             setSelectedMixedSubjects(prev => prev.filter(id => id !== sub.id));
                           }
                         }}
                       />
                       <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{sub.name}</span>
                     </label>
                   ))}
                </div>
              </div>
            )}

            {/* Timer Settings */}
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Vaqt chegarasi (taymer) bilan ishlash</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isTimerEnabled} onChange={(e) => setIsTimerEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {isTimerEnabled && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">1 ta savol uchun vaqt (daqiqa): {timePerQuestion}</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="1" 
                    value={timePerQuestion} 
                    onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-bold">
                    <span>1 daq</span>
                    <span>5 daq</span>
                  </div>
                </div>
              )}
            </div>

            {/* Info and Warning */}
            <div className="flex gap-2 items-start bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 text-slate-400 mt-6">
              <ShieldAlert size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                {isTimerEnabled ? `Tizimda har bir savol uchun ${timePerQuestion} daqiqa vaqt ajratiladi.` : 'Siz timersiz rejimni tanladingiz. Vaqt chegaralanmagan.'} Imtihon boshlagach orqaga qaytib bo'lmaydi. Savollar tasodifiy tushadi.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => setActiveSubjectForExam(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  const subId = activeSubjectForExam.id;
                  if (subId === 'mixed' && selectedMixedSubjects.length === 0) {
                     alert("Iltimos, hech bo'lmaganda bitta fanni tanlang.");
                     return;
                  }
                  setActiveSubjectForExam(null);
                  onStartExam(subId, selectedExamType, selectedMixedSubjects, isTimerEnabled, timePerQuestion);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 shadow-glow cursor-pointer"
              >
                Imtihonni boshlash
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
