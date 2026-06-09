import React, { useState, useEffect } from 'react';
import { LocalDbService } from '../db/localDb';
import { Brain, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import Markdown from 'react-markdown';

interface Props {
  currentUser: any;
  onNavigate: (view: any) => void;
}

export const AIMentorView: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState('');

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    
    try {
      const results = LocalDbService.getResults().filter(r => r.userId === currentUser.id).slice(0, 15);
      const mistakes = LocalDbService.getMistakes(currentUser.id).slice(0, 20);
      
      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results, mistakes })
      });
      
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.text);
      } else {
        setError(data.error || 'Serverda xatolik yuz berdi. Iltimos keyinroq urinib ko\'ring.');
      }
    } catch (e) {
      setError('Internetga ulanishda xatolik yuz berdi or API ruxsatsiz ishlamoqda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    // eslint-disable-next-line
  }, []);

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
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Brain size={24} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-sans">AI Mentor</h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">Sun'iy intellekt orqali shaxsiy tahlil va maslahatlar</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Natijalaringiz tahlil qilinmoqda...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-6 rounded-3xl text-center text-red-600">
           <AlertCircle className="mx-auto mb-4 opacity-70" size={32} />
           <p className="font-medium text-sm">{error}</p>
           <button onClick={fetchAnalysis} className="mt-4 px-6 py-2 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/80 rounded-xl text-xs font-bold transition">Qayta urinish</button>
        </div>
      ) : analysis ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm prose prose-sm prose-slate dark:prose-invert max-w-none">
           <div className="markdown-body">
             <Markdown>{analysis}</Markdown>
           </div>
           
           <div className="mt-8 text-center pt-8 border-t border-slate-100 dark:border-slate-800">
             <button onClick={fetchAnalysis} className="px-6 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition inline-flex items-center gap-2">
                Qayta tahlil qilish
             </button>
           </div>
        </div>
      ) : (
        <div className="py-24 text-center text-slate-500">
           <p>Tahlil qilish uchun yetarli ma'lumot yo'q. Dastlab testlarni ishlang.</p>
        </div>
      )}
    </div>
  );
};
