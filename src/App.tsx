/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Phone, Compass, Sun, Moon, LogOut, FileCheck, Landmark,
  Award, HelpCircle, Activity, Globe, Send, UserCheck, Play, ArrowRight, Zap,
  Bell, CheckCheck, CheckCircle, XCircle, Sparkles
} from 'lucide-react';

import { Profile, Subject, TestSession, TestResult, DBNotification } from './types';
import { LocalDbService } from './db/localDb';
import { evaluateMistakes, updateUserStats, evaluateAchievements } from './lib/gameLogic';
import { sendTelegramNotification, sendAdminNotification } from './lib/telegramClient';

// Modular Component imports
import { AuthPage } from './components/AuthPage';
import { UserDashboard } from './components/UserDashboard';
import { QuizEngine } from './components/QuizEngine';
import { AdminPanel } from './components/AdminPanel';
import { ContactView } from './components/ContactView';
import { Certificate } from './components/Certificate';
import { UserProfileDropdown } from './components/UserProfileDropdown';
import { ProfilePage } from './components/ProfilePage';
import { MistakesView } from './components/MistakesView';
import { AchievementsView } from './components/AchievementsView';
import { StatisticsView } from './components/StatisticsView';
import { AIMentorView } from './components/AIMentorView';
import { DuelsView } from './components/DuelsView';
import { SettingsView } from './components/SettingsView';
import { SubjectsView } from './components/SubjectsView';
import { RankingsView } from './components/RankingsView';
import { HistoryView } from './components/HistoryView';

import { isTelegramMiniApp } from './lib/telegramClient';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  
  // Quiz states
  const [activeSession, setActiveSession] = useState<TestSession | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);

  // Router views
  const [activeView, setActiveView] = useState<string>('dashboard');

  // Notifications state
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);

  // Load theme and previous user/admin session if active
  useEffect(() => {
    // Local DB boot and backend synchronization
    const bootDbAndSync = async () => {
      // First run local initialization
      LocalDbService.initialize();
      // Sync with server persistent database
      await LocalDbService.syncWithBackend();

      // Recover User session if saved (Keep logged in)
      const savedUser = localStorage.getItem('otp_active_user');
      const urlParams = new URLSearchParams(window.location.search);
      const hasDuel = urlParams.has('duel');
      
      if (savedUser) {
        try {
          const userObj = JSON.parse(savedUser);
          setCurrentUser(userObj);
          if (hasDuel) {
            setActiveView('duels');
          }
        } catch (e) {}
      }
      
      const savedAdmin = localStorage.getItem('otp_active_admin');
      if (savedAdmin) {
        setAdminEmail(savedAdmin);
      }

      // Online real-time automatic synchronization
      setInterval(async () => {
        const hasPendingSync = !!(window as any).__pendingDbSync;
        if (!hasPendingSync) {
          await LocalDbService.syncWithBackend();
        }
      }, 5000);
    };

    bootDbAndSync();

    const handleDbSynced = () => {
      const savedUser = localStorage.getItem('otp_active_user');
      if (savedUser) {
        try {
          const userObj = JSON.parse(savedUser);
          const profiles = LocalDbService.getProfiles();
          const syncedUser = profiles.find(p => p.id === userObj.id);
          if (syncedUser) {
            setCurrentUser(syncedUser);
            localStorage.setItem('otp_active_user', JSON.stringify(syncedUser));
          }
        } catch (e) {}
      }
    };
    window.addEventListener('db_synced', handleDbSynced);

    // Recover Theme
    const savedTheme = localStorage.getItem('otp_theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    applyThemeClass(savedTheme);
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

  // Sync notifications state with local DB
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = () => {
      const list = LocalDbService.getNotifications(currentUser.id);
      setNotifications(list);
    };

    fetchNotifications();

    // Recheck notifications count periodically (every 4 seconds) so triggers are live
    const intervalId = setInterval(fetchNotifications, 4000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  const handleMarkAllNotificationsRead = () => {
    if (!currentUser) return;
    LocalDbService.markNotificationsRead(currentUser.id);
    setNotifications(LocalDbService.getNotifications(currentUser.id));
  };

  const handleMarkSingleNotificationRead = (notifId: string) => {
    LocalDbService.markSingleNotificationRead(notifId);
    if (currentUser) {
      setNotifications(LocalDbService.getNotifications(currentUser.id));
    }
  };

  // User auth triggers
  const handleAuthSuccess = (user: Profile) => {
    setCurrentUser(user);
    localStorage.setItem('otp_active_user', JSON.stringify(user));
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('duel')) {
      setActiveView('duels');
    } else {
      setActiveView('dashboard');
    }
  };

  // Administrative auth triggers
  const handleAdminAuthSuccess = (email: string) => {
    setAdminEmail(email);
    localStorage.setItem('otp_active_admin', email);
    setActiveView('dashboard');
  };

  const handleBackToUser = () => {
    setAdminEmail(null);
    localStorage.removeItem('otp_active_admin');
    setActiveView('dashboard');
  };

  const handleLogOut = () => {
    setCurrentUser(null);
    setAdminEmail(null);
    localStorage.removeItem('otp_active_user');
    localStorage.removeItem('otp_active_admin');
    setActiveView('dashboard');
  };

  const handleProfileUpdate = (updatedUser: Profile) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('otp_active_user', JSON.stringify(updatedUser));
  };

  // Launch test session workflow
  const handleStartExam = (
    subjectId: string, 
    testType: 20 | 30 | 50 | 100, 
    mixedSubjectIds: string[] | undefined, 
    isTimerEnabled: boolean = true, 
    timePerQuestion: number = 1,
    isExamMode: boolean = false
  ) => {
    if (!currentUser) return;

    const subjects = LocalDbService.getSubjects();
    let sub = subjects.find(s => s.id === subjectId);
    if (!sub && subjectId === 'mixed') {
      sub = {
        id: 'mixed',
        name: "Aralash Savollar (Tanlangan fanlar)",
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
      timeLeftSeconds: isTimerEnabled ? testType * timePerQuestion * 60 : null,
      answers: {},
      mixedSubjectIds,
      isExamMode
    };

    LocalDbService.saveSession(newSession);
    setActiveSubject(sub);
    setActiveSession(newSession);
    setActiveView('quiz');
  };

  // Quiz completion trigger
  const handleExamComplete = (
    score: number, 
    percentage: number, 
    durationSeconds: number,
    quizQuestions?: any[],
    quizAnswers?: Record<string, 'A' | 'B' | 'C' | 'D'>
  ) => {
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
      createdAt: new Date().toISOString(),
      questions: quizQuestions,
      answers: quizAnswers
    };

    LocalDbService.saveResult(newResult);

    // Check if new record for Admin notification
    const previousResults = LocalDbService.getResults().filter(r => r.userId === currentUser.id && r.id !== newResult.id);
    const hasBetter = previousResults.some(r => r.percentageScore >= percentage);
    const isNewRecord = !hasBetter && percentage > 0;
    if (isNewRecord) {
      sendAdminNotification(`🏆 <b>Yangi rekord natija!</b>\n\n• O'quvchi: <b>${currentUser.fullName}</b>\n• Fan: <b>${activeSubject.name}</b>\n• Natija: <b>${percentage}%</b> (${score}/${activeSession.testType} ta to'g'ri)\n• Vaqt: ${formats(durationSeconds)}`);
    }

    const sessionQuestions = quizQuestions || LocalDbService.getQuestions().filter(q => q.subjectId === activeSubject.id);
    const sessionWithAnswers = quizAnswers ? { ...activeSession, answers: quizAnswers } : activeSession;
    const mistakes = evaluateMistakes(sessionWithAnswers, sessionQuestions);
    mistakes.forEach(m => LocalDbService.saveMistake(m));

    const stats = updateUserStats(currentUser.id, false, false, false, percentage);
    const newlyUnlocked = evaluateAchievements(currentUser.id, stats, newResult);

    const ACHIEVEMENT_NAMES: Record<string, string> = {
      'first_test': 'Ilk qadam',
      '10_tests': 'O\'quvchi',
      '50_tests': 'Mutaxassis',
      '100_tests': 'Bilimdon',
      'accuracy_master': 'Aql charxi',
      'fast_responder': 'Yashin tezligi',
      'first_duel': 'Jangchi',
      '10_duel_wins': 'Yengilmas'
    };

    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(ach => {
        const title = ACHIEVEMENT_NAMES[ach.type] || ach.type;
        LocalDbService.addNotification('🏆 Yangi yutuq!', `Tabriklaymiz! Siz yangi "${title}" yutug'iga erishdingiz.`, 'success', currentUser.id);
        
        if (currentUser.telegramId) {
          sendTelegramNotification(currentUser.telegramId, `🏆 <b>Tabriklaymiz!</b>\n\nYangi yutuq qo'lga kiritildi: <b>${title}</b>\n\nDavom eting!`);
        }
      });
    }
    
    if (currentUser.telegramId) {
      const msg = `📝 <b>Test yakunlandi!</b>\n\n📚 Fan: ${activeSubject.name}\n📝 Test turi: ${activeSubject.totalQuestions} talik\n✅ To'g'ri javoblar: ${score}\n❌ Noto'g'ri javoblar: ${activeSubject.totalQuestions - score}\n📊 Natija: ${percentage}%\n⏱ Sarflangan vaqt: ${formats(durationSeconds)}\n\n<i>Platforma orqali natijani to'liq tahlil qilishingiz mumkin.</i>`;
      sendTelegramNotification(currentUser.telegramId, msg);
      
      // Request auto-mentor analysis for telegram
      fetch('/api/ai/mentor/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telegramId: currentUser.telegramId, 
          results: LocalDbService.getResults().filter(r => r.userId === currentUser.id),
          mistakes: LocalDbService.getMistakes(currentUser.id)
        })
      }).catch(()=>{});
    }

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
            <img 
              src="/logo.png" 
              alt="Online Imtihon Logo" 
              className="w-9 h-9 rounded-xl object-cover shadow-glow"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
                Online Imtihon
              </span>
              <span className="block text-[8px] font-sans tracking-tight text-blue-600 leading-none">O'quv Markazi</span>
            </div>
          </div>

          {/* Links menu elements */}
          {activeView !== 'quiz' && (
            <div className="flex items-center gap-4">
              <nav className="hidden sm:flex items-center gap-2 font-sans tracking-tight text-xs mr-4">
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

              {/* Status bar Admin login alert */}
              {adminEmail && (
                <span className="bg-amber-100 text-amber-800 font-sans tracking-tight text-[9px] font-bold px-2 py-1 rounded hidden sm:inline-block mr-2">
                  🔐 ADMIN FAOL
                </span>
              )}

              {/* Notifications Button & Dropdown */}
              {currentUser && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                    className="p-2 w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 transition-all active:scale-95 cursor-pointer mr-1.5 border border-slate-200/35 dark:border-slate-700/40 shadow-sm relative group"
                    aria-label="Bildirishnomalar"
                    title="Bildirishnomalar"
                  >
                    <Bell size={18} className={`transition-transform group-hover:scale-110 ${notifications.some(n => !n.isRead) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`} />
                    
                    {/* Badge Count */}
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold border-2 border-white dark:border-slate-900 animate-pulse">
                        {notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </button>

                  {showNotificationsDropdown && (
                    <>
                      {/* Invisible backdrop to dismiss dropdown on click away */}
                      <div 
                        className="fixed inset-0 z-40 cursor-default" 
                        onClick={() => setShowNotificationsDropdown(false)} 
                      />
                      
                      {/* Dropdown Container */}
                      <div className="fixed top-[72px] left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:-right-4 sm:mt-2.5 w-auto sm:w-96 max-w-sm mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden text-slate-850 dark:text-slate-100 animate-in fade-in slide-in-from-top-3 duration-250">
                        
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 select-none">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-sans">Bildirishnomalar</span>
                            {notifications.filter(n => !n.isRead).length > 0 && (
                              <span className="bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                                {notifications.filter(n => !n.isRead).length} yangi
                              </span>
                            )}
                          </div>
                          
                          {notifications.filter(n => !n.isRead).length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAllNotificationsRead();
                              }}
                              className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition focus:outline-none"
                            >
                              <CheckCheck size={13} />
                              Hammasini o'qildi qilish
                            </button>
                          )}
                        </div>

                        {/* List */}
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                          {notifications.length === 0 ? (
                            <div className="py-10 px-4 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2.5 select-none">
                              <Bell size={32} className="opacity-30 stroke-[1.5]" />
                              <p className="text-xs font-semibold leading-normal">Hozircha bildirishnomalar mavjud emas</p>
                            </div>
                          ) : (
                            notifications.map((n) => {
                              return (
                                <div
                                  key={n.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkSingleNotificationRead(n.id);
                                  }}
                                  className={`p-4 transition duration-150 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left relative flex items-start gap-3 select-none ${
                                    !n.isRead ? 'bg-blue-50/25 dark:bg-blue-950/15' : ''
                                  }`}
                                >
                                  {/* Notification Type Indicator Dot */}
                                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                                    n.type === 'success' ? 'bg-emerald-500 animate-pulse' :
                                    n.type === 'warning' ? 'bg-amber-500' :
                                    n.type === 'info' ? 'bg-blue-500' : 'bg-slate-400'
                                  }`} />
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className={`text-xs text-slate-900 dark:text-slate-100 ${!n.isRead ? 'font-bold' : 'font-semibold'}`}>
                                        {n.title}
                                      </p>
                                      <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 font-medium font-mono">
                                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal break-words font-medium">
                                      {n.message}
                                    </p>
                                    
                                    {!n.isRead && (
                                      <span className="absolute right-3 bottom-3 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Theme Toggle Button */}
              {currentUser && (
                <button
                  onClick={handleToggleTheme}
                  className="p-2 w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 transition-all active:scale-95 cursor-pointer mr-1 border border-slate-200/35 dark:border-slate-700/40 shadow-sm"
                  aria-label="Theme toggle"
                  title={theme === 'light' ? "Tungi rejim" : "Kunduzgi rejim"}
                >
                  {theme === 'light' ? (
                    <Moon size={18} className="text-slate-600 dark:text-slate-400" />
                  ) : (
                    <Sun size={18} className="text-amber-500 fill-amber-300/40" />
                  )}
                </button>
              )}

              {/* User Profile Dropdown */}
              {currentUser && (
                <UserProfileDropdown
                  currentUser={currentUser}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  onLogout={handleLogOut}
                  onNavigate={(view) => {
                    if (view === 'admin') {
                      handleAdminAuthSuccess(currentUser.email);
                    } else {
                      setActiveView(view);
                    }
                  }}
                />
              )}
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
                  <p className="text-slate-400 text-xs mt-2 font-sans tracking-tight">Imtihon natijalari muvaffaqiyatli saqlandi.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-premium space-y-6">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-glow">
                    <Award size={32} />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">Natijalar tahlili</h1>
                    <p className="text-xs text-slate-500 mt-1 font-sans tracking-tight">{currentResult.subjectName} | {currentResult.testType} talik test</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto font-sans tracking-tight text-left">
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
                      Tabriklaymiz! Siz fandan <b>sertifikat</b> olish chegarasini topshirdingiz (chegara: 60%).<br/>
                      <button
                        onClick={() => {
                          setShowCertificateModal(true);
                        }}
                        className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition duration-150 shadow-glow active:scale-95 text-xs inline-flex items-center gap-2"
                      >
                        <Award size={16} />
                        PDF Sertifikatni Ko'rish va Yuklab Olish
                      </button>
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
                    Asosiy sahifaga qaytish
                  </button>
                </div>

                {/* Visual Review of Questions and Correct/Incorrect Answers */}
                {currentResult.questions && currentResult.questions.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-left shadow-premium space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="text-left">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">Savollar tahlili</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Xato va to'g'ri javoblaringizni batafsil ko'rib chiqing.</p>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0">
                        Natija: {currentResult.correctAnswers} / {currentResult.testType}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {currentResult.questions.map((q: any, idx: number) => {
                        const userAnswer = currentResult.answers ? currentResult.answers[q.id] : undefined;
                        const isCorrect = userAnswer === q.correctAnswer;
                        const isUnanswered = !userAnswer;

                        return (
                          <div 
                            key={q.id}
                            className={`p-5 rounded-2xl border transition-all duration-150 ${
                              isUnanswered 
                                ? 'bg-slate-50/50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800/80' 
                                : isCorrect 
                                  ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30' 
                                  : 'bg-red-50/30 border-red-100 dark:bg-red-950/10 dark:border-red-900/30'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <span className={`text-xs font-black px-2.5 py-1 rounded shrink-0 ${
                                isUnanswered 
                                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' 
                                  : isCorrect 
                                    ? 'bg-emerald-100/85 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                                    : 'bg-red-100/85 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                              }`}>
                                {idx + 1}-Savol {isUnanswered ? "(Javobsiz)" : isCorrect ? "(To'g'ri)" : "(Xato)"}
                              </span>
                            </div>

                            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-3 leading-relaxed text-left">
                              {q.questionText}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                              {(['A', 'B', 'C', 'D'] as const).map((key) => {
                                const optionText = q.options[key];
                                const isCorrectOption = q.correctAnswer === key;
                                const isUserOption = userAnswer === key;

                                let borderStyle = "border-slate-150 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30";
                                let textColor = "text-slate-800 dark:text-slate-300";
                                let badgeColor = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                                let icon = null;

                                if (isCorrectOption) {
                                  borderStyle = "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40";
                                  textColor = "text-emerald-800 dark:text-emerald-400 font-bold";
                                  badgeColor = "bg-emerald-500 text-white";
                                  icon = <CheckCircle size={14} className="text-emerald-500 shrink-0" />;
                                } else if (isUserOption) {
                                  // This means user answered incorrectly because correct option is handled above
                                  borderStyle = "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40";
                                  textColor = "text-red-800 dark:text-red-400 font-bold";
                                  badgeColor = "bg-red-500 text-white";
                                  icon = <XCircle size={14} className="text-red-500 shrink-0" />;
                                }

                                return (
                                  <div 
                                    key={key} 
                                    className={`flex items-center justify-between p-3 rounded-xl border text-xs gap-3 text-left ${borderStyle}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${badgeColor}`}>
                                        {key}
                                      </span>
                                      <span className={textColor}>{optionText}</span>
                                    </div>
                                    {icon}
                                  </div>
                                );
                              })}
                            </div>

                            {q.explanation && (
                              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/55 rounded-xl border border-slate-100 dark:border-slate-850 text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-left flex gap-1.5 items-start">
                                <Sparkles size={14} className="text-blue-500 shrink-0 mt-0.5 animate-pulse" />
                                <div>
                                  <b className="text-slate-700 dark:text-slate-350">Izoh: </b>
                                  {q.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* MODAL Popup for Certificate viewer in active result tree */}
                {showCertificateModal && currentUser && (
                  <div className="fixed inset-0 z-50 bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="relative w-full max-w-4xl my-8 text-left">
                      {/* Close button */}
                      <button
                        onClick={() => setShowCertificateModal(false)}
                        className="absolute -top-12 right-0 bg-[#0F172A] hover:bg-slate-800 text-white p-2.5 rounded-xl shadow-premium cursor-pointer"
                      >
                        Yopish (X)
                      </button>
                      
                      <Certificate
                        fullName={currentUser.fullName}
                        subjectName={currentResult.subjectName}
                        percentage={currentResult.percentageScore}
                        testType={currentResult.testType}
                        date={new Date(currentResult.createdAt).toLocaleDateString()}
                        certificateNumber={currentResult.id.toUpperCase().replace('RES-', 'CERT-').substring(0, 14)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // If showing a contact aloqa page
          if (activeView === 'contact') {
            return <ContactView onNavigate={setActiveView} />;
          }

          // If Admin email is validated, load full administrative console dashboard
          if (adminEmail) {
            return <AdminPanel onLogOut={handleLogOut} onBackToUser={handleBackToUser} currentUser={currentUser} />;
          }

          // Additional Views from Dropdown
          if (currentUser) {
            if (activeView === 'profile') return <ProfilePage currentUser={currentUser} onNavigate={setActiveView} />;
            if (activeView === 'mistakes') return <MistakesView currentUser={currentUser} onNavigate={setActiveView} />;
            if (activeView === 'achievements') return <AchievementsView currentUser={currentUser} onNavigate={setActiveView} />;
            if (activeView === 'statistics') return <StatisticsView currentUser={currentUser} onNavigate={setActiveView} />;
            if (activeView === 'duels') return <DuelsView currentUser={currentUser} onNavigate={setActiveView} />;
            if (activeView === 'mentor') return <AIMentorView currentUser={currentUser} onNavigate={setActiveView} />;
            if (activeView === 'subjects') return <SubjectsView currentUser={currentUser} onStartExam={handleStartExam} onNavigate={setActiveView} />;
            if (activeView === 'rankings') return <RankingsView currentUser={currentUser} onNavigate={setActiveView} />;
            if (activeView === 'history') return <HistoryView currentUser={currentUser} onNavigate={setActiveView} />;
            if (activeView === 'settings') return (
              <SettingsView 
                currentUser={currentUser} 
                onProfileUpdate={handleProfileUpdate} 
                onLogOut={handleLogOut} 
                theme={theme} 
                onToggleTheme={handleToggleTheme} 
                onNavigate={setActiveView}
              />
            );
          }

          // If registered user is logged in, show User Main Dashboard
          if (currentUser) {
            return (
              <UserDashboard
                profile={currentUser}
                onStartExam={handleStartExam}
                onLogOut={handleLogOut}
                onNavigate={setActiveView}
                onAdminNavigation={(currentUser.role === 'admin' || currentUser.role === 'moderator' || currentUser.email === 'xusniddinku@gmail.com') ? () => handleAdminAuthSuccess(currentUser.email) : undefined}
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
