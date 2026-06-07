/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Phone, Compass, Sun, Moon, LogOut, FileCheck, Landmark,
  Award, HelpCircle, Activity, Globe, Send, UserCheck, Play, ArrowRight, Zap 
} from 'lucide-react';

import { Profile, Subject, TestSession, TestResult } from './types';
import { LocalDbService } from './db/localDb';

// Modular Component imports
import { AuthPage } from './components/AuthPage';
import { UserDashboard } from './components/UserDashboard';
import { QuizEngine } from './components/QuizEngine';
import { AdminPanel } from './components/AdminPanel';
import { ContactView } from './components/ContactView';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  
  // Quiz states
  const [activeSession, setActiveSession] = useState<TestSession | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);

  // Router views
  const [activeView, setActiveView] = useState<'dashboard' | 'contact' | 'quiz' | 'result'>('dashboard');

  // Load theme and previous user/admin session if active
  useEffect(() => {
    // Local DB bootstrap
    LocalDbService.initialize();

    // Recover Theme
    const savedTheme = localStorage.getItem('otp_theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    applyThemeClass(savedTheme);

    // Recover User session if saved (Remember me logic)
    const savedUser = localStorage.getItem('otp_active_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    const savedAdmin = localStorage.getItem('otp_active_admin');
    if (savedAdmin) {
      setAdminEmail(savedAdmin);
    }
  }, []);

  const applyThemeClass = (t: 'light' | 'dark') => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('otp_theme', next);
    applyThemeClass(next);
  };

  // User auth triggers
  const handleAuthSuccess = (user: Profile) => {
    setCurrentUser(user);
    localStorage.setItem('otp_active_user', JSON.stringify(user));
    setActiveView('dashboard');
  };

  // Administrative Google auth triggers
  const handleAdminAuthSuccess = (email: string) => {
    setAdminEmail(email);
    localStorage.setItem('otp_active_admin', email);
    // Unset user to avoid layouts overlays clashes
    setCurrentUser(null);
    localStorage.removeItem('otp_active_user');
    setActiveView('dashboard');
  };

  const handleLogOut = () => {
    setCurrentUser(null);
    setAdminEmail(null);
    localStorage.removeItem('otp_active_user');
    localStorage.removeItem('otp_active_admin');
    setActiveView('dashboard');
  };

  // Launch test session workflow
  const handleStartExam = (subjectId: string, testType: 20 | 30 | 50 | 100) => {
    if (!currentUser) return;

    const subjects = LocalDbService.getSubjects();
    let sub = subjects.find(s => s.id === subjectId);
    if (!sub && subjectId === 'mixed') {
      sub = {
        id: 'mixed',
        name: "Aralash Savollar (Barcha fanlar)",
        icon: 'Sparkles',
        description: "Barcha mavjud fanlar doirasida aralash tasodifiy test sinovi.",
        totalQuestions: LocalDbService.getQuestions().length,
        progress: 0
      };
    }
    if (!sub) return;

    const newSession: TestSession = {
      id: `session-${Date.now()}`,
      userId: currentUser.id,
      subjectId,
      testType,
      startedAt: new Date().toISOString(),
      score: 0,
      isCompleted: false,
      timeLeftSeconds: testType * 60, // 1 min per question
      answers: {}
    };

    LocalDbService.saveSession(newSession);
    setActiveSubject(sub);
    setActiveSession(newSession);
    setActiveView('quiz');
  };

  // Quiz completion trigger
  const handleExamComplete = (score: number, percentage: number, durationSeconds: number) => {
    if (!currentUser || !activeSubject || !activeSession) return;

    const formats = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const newResult: TestResult = {
      id: `res-${Date.now()}`,
      sessionId: activeSession.id,
      userId: currentUser.id,
      subjectName: activeSubject.name,
      testType: activeSession.testType,
      correctAnswers: score,
      wrongAnswers: activeSession.testType - score,
      percentageScore: percentage,
      completionTimeSeconds: durationSeconds,
      completionTimeFormatted: formats(durationSeconds),
      createdAt: new Date().toISOString()
    };

    LocalDbService.saveResult(newResult);

    // Boost XP score of student for completing tests
    const updatedUser = {
      ...currentUser,
      xp: (currentUser.xp || 0) + (score * 20) + (percentage >= 60 ? 100 : 0) // correct answer = 20XP, passing bonus = 100XP
    };
    LocalDbService.saveProfile(updatedUser);
    setCurrentUser(updatedUser);
    localStorage.setItem('otp_active_user', JSON.stringify(updatedUser));

    // Clear active temporary session
    const finalSession = {
      ...activeSession,
      isCompleted: true
    };
    LocalDbService.saveSession(finalSession);

    // Save final result to local view states
    setCurrentResult(newResult);
    setActiveSession(null);
    setActiveView('result');
  };

  // Layout template render
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-850 dark:text-slate-100 flex flex-col transition duration-300">
      
      {/* Enterprise Top Navigation bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          
          {/* Logo vector icon */}
          <div 
            onClick={() => {
              if (activeView !== 'quiz') {
                setActiveView('dashboard');
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-glow">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
                Online Imtihon
              </span>
              <span className="block text-[8px] font-mono text-blue-600 leading-none">O'quv Markazi</span>
            </div>
          </div>

          {/* Links menu elements */}
          {activeView !== 'quiz' && (
            <div className="flex items-center gap-4">
              <nav className="hidden sm:flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3.5 py-2 rounded-xl transition ${activeView === 'dashboard' ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  📚 Fanlar va Testlar
                </button>
                <button
                  onClick={() => setActiveView('contact')}
                  className={`px-3.5 py-2 rounded-xl transition ${activeView === 'contact' ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  📞 Biz bilan aloqa
                </button>
              </nav>

              {/* Theme selector + session tags */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleTheme}
                  className="p-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 rounded-xl transition duration-150 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer shrink-0"
                  id="btn-theme-toggle"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                {/* Status bar Admin login alert */}
                {adminEmail && (
                  <span className="bg-amber-100 text-amber-800 font-mono text-[9px] font-bold px-2 py-1 rounded hidden sm:inline-block">
                    🔐 ADMIN FAOL
                  </span>
                )}
              </div>
            </div>
          )}

        </div>
      </header>

      {/* Main Container screen area */}
      <main className="flex-grow flex items-center justify-center">
        
        {/* Router flow controls */}
        {(() => {
          // If taking an active quiz exam
          if (activeView === 'quiz' && activeSession && activeSubject) {
            return (
              <QuizEngine
                session={activeSession}
                subject={activeSubject}
                onComplete={handleExamComplete}
                onCancel={() => {
                  setActiveSession(null);
                  setActiveView('dashboard');
                }}
              />
            );
          }

          // If showing a Quiz completed result summary
          if (activeView === 'result' && currentResult) {
            return (
              <div className="w-full max-w-2xl px-4 py-8 text-center space-y-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#10B981] bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full">SINOV MUVOFIQYATLI TOPSHIRILDI</span>
                  <p className="text-slate-400 text-xs mt-2 font-mono">Imtihon natijalari muvaffaqiyatli saqlandi.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-premium space-y-6">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-glow">
                    <Award size={32} />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">Natijalar tahlili</h1>
                    <p className="text-xs text-slate-500 mt-1 font-mono">{currentResult.subjectName} | {currentResult.testType} talik test</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto font-mono text-left">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">To'g'ri javoblar</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{currentResult.correctAnswers} ta</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Noto'g'ri javoblar</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{currentResult.wrongAnswers} ta</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Yig'ilgan foiz</p>
                      <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">{currentResult.percentageScore}%</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Sarflangan vaqt</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{currentResult.completionTimeFormatted}</p>
                    </div>
                  </div>

                  {/* Warning banner of score passing indicator */}
                  {currentResult.percentageScore >= 60 ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs py-3 px-4 rounded-xl leading-relaxed">
                      Tabriklaymiz! Siz fandan <b>sertifikat</b> olish chegarasini topshirdingiz (chegara: 60%). Shaxsiy profilingiz orqali sertifikat yuklab olishingiz mumkin.
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs py-3 px-4 rounded-xl leading-relaxed">
                      Afsuski, sertifikat olish uchun foiz darajangiz yetarli emas (kerakli ball: 60%+). Iltimos, yana bir bor urinib ko'ring!
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setCurrentResult(null);
                      setActiveView('dashboard');
                    }}
                    className="w-full bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition duration-150 shadow-premium active:scale-95 text-xs"
                    id="btn-return-dashboard"
                  >
                    Mening Dashboardga qaytish
                  </button>
                </div>
              </div>
            );
          }

          // If showing a contact aloqa page
          if (activeView === 'contact') {
            return <ContactView />;
          }

          // If Admin email is validated, load full administrative console dashboard
          if (adminEmail) {
            return <AdminPanel onLogOut={handleLogOut} />;
          }

          // If registered user is logged in, show User Main Dashboard
          if (currentUser) {
            return (
              <UserDashboard
                profile={currentUser}
                onStartExam={handleStartExam}
                onLogOut={handleLogOut}
              />
            );
          }

          // Default: Access Auth register/login page
          return (
            <AuthPage
              onAuthSuccess={handleAuthSuccess}
              onAdminAuthSuccess={handleAdminAuthSuccess}
            />
          );
        })()}

      </main>

      {/* Footer section with direct credits */}
      <footer className="bg-white/50 dark:bg-slate-950/20 border-t border-slate-200 dark:border-slate-800/80 py-6 select-none mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Online Imtihon Platformasi. Barcha huquqlar himoyalangan.</p>
          <div className="flex gap-4 font-bold">
            <a href="tel:+998955865859" className="hover:text-blue-600 transition">Aloqa: +998-95-586-58-59</a>
            <a href="https://t.me/MrKholdorov" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition">Telegram</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
