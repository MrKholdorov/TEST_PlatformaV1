/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Plus, Edit2, Trash2, Upload, Send, FileText, Database, ShieldCheck, 
  HelpCircle, Settings, Smartphone, ArrowLeft, RefreshCw, Eye, Sparkles, Filter 
} from 'lucide-react';
import { Subject, Question, Profile, TestResult, TelegramConfig } from '../types';
import { LocalDbService } from '../db/localDb';
import { AdminEmulatorConsole } from './AdminEmulatorConsole';
import { DynamicIcon } from './DynamicIcon';

interface AdminPanelProps {
  onLogOut: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogOut }) => {
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  
  // Stats
  const [stats, setStats] = useState({
    usersCount: 0,
    subjectsCount: 0,
    questionsCount: 0,
    resultsCount: 0
  });

  // Subjects Management
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubj, setNewSubj] = useState({ name: '', icon: 'BookOpen', description: '' });
  const [editSubjId, setEditSubjId] = useState<string | null>(null);

  // Questions Management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [newQuest, setNewQuest] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D'
  });

  // Bulk Import state
  const [bulkText, setBulkText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ imported: number; duplicates: number; errors: number } | null>(null);

  // Users audit state
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [auditUserResults, setAuditUserResults] = useState<TestResult[]>([]);
  const [selectedAuditUser, setSelectedAuditUser] = useState<Profile | null>(null);

  // Telegram Config
  const [tgConfig, setTgConfig] = useState<TelegramConfig>({ botToken: '', chatId: '', notificationsEnabled: false });

  useEffect(() => {
    loadData();
  }, [activeMenu, selectedSubjectId]);

  const loadData = () => {
    const listSubj = LocalDbService.getSubjects();
    const listQuest = LocalDbService.getQuestions();
    const listUsers = LocalDbService.getProfiles();
    const listResults = LocalDbService.getResults();

    setStats({
      usersCount: listUsers.length,
      subjectsCount: listSubj.length,
      questionsCount: listQuest.length,
      resultsCount: listResults.length
    });

    setSubjects(listSubj);
    setUsersList(listUsers);

    // Default subject key selection if empty
    if (!selectedSubjectId && listSubj.length > 0) {
      setSelectedSubjectId(listSubj[0].id);
    }

    // Filter questions based on selected subject
    const filteredQ = listQuest.filter(q => q.subjectId === (selectedSubjectId || (listSubj[0]?.id)));
    setQuestions(filteredQ);

    // Telegram
    setTgConfig(LocalDbService.getTelegramConfig());
  };

  // Create or Update Subject Action
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubj.name.trim()) return;

    if (editSubjId) {
      const existing = subjects.find(s => s.id === editSubjId);
      if (existing) {
        LocalDbService.saveSubject({
          ...existing,
          name: newSubj.name,
          icon: newSubj.icon,
          description: newSubj.description
        });
      }
      setEditSubjId(null);
    } else {
      LocalDbService.saveSubject({
        id: `subj-${Date.now()}`,
        name: newSubj.name,
        icon: newSubj.icon,
        description: newSubj.description,
        totalQuestions: 0,
        progress: 0
      });
    }

    setNewSubj({ name: '', icon: 'BookOpen', description: '' });
    loadData();
    alert("Fan ma'lumotlari muvaffaqiyatli saqlandi!");
  };

  const handleEditSubjectTrigger = (sub: Subject) => {
    setEditSubjId(sub.id);
    setNewSubj({ name: sub.name, icon: sub.icon, description: sub.description });
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm("DIQQAT: Ushbu fanni o'chirsangiz, fanga tegishli bo'lgan barcha test savollari ham butunlay yo'q qilinadi! Davom etamizmi?")) {
      LocalDbService.deleteSubject(id);
      loadData();
    }
  };

  // Create Question Action
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const subjId = selectedSubjectId || subjects[0]?.id;
    if (!subjId) {
      alert("Xatolik: Avval fan yaratishingiz shart!");
      return;
    }

    const questionText = newQuest.questionText.trim();
    if (!questionText) return;

    LocalDbService.saveQuestion({
      id: `q-${Date.now()}`,
      subjectId: subjId,
      questionText,
      options: {
        A: newQuest.optionA,
        B: newQuest.optionB,
        C: newQuest.optionC,
        D: newQuest.optionD
      },
      correctAnswer: newQuest.correctAnswer
    });

    setNewQuest({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A'
    });

    loadData();
    alert("Yangi test savoli muvaffaqiyatli kiritildi!");
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm("Savolni o'chirishni tasdiqlaysizmi?")) {
      LocalDbService.deleteQuestion(id);
      loadData();
    }
  };

  // Bulk Import Action
  const handleBulkImport = () => {
    const subjId = selectedSubjectId || subjects[0]?.id;
    if (!subjId) {
      alert("Xatolik: Avval joriy fanni tanlang!");
      return;
    }

    if (!bulkText.trim()) {
      alert("Iltimos, import fayl ko'rinishida matn kiriting!");
      return;
    }

    const status = LocalDbService.bulkImportQuestions(subjId, bulkText);
    setImportStatus(status);
    setBulkText('');
    loadData();
  };

  // Audit user historic results
  const handleAuditUser = (user: Profile) => {
    setSelectedAuditUser(user);
    const results = LocalDbService.getResults().filter(r => r.userId === user.id);
    setAuditUserResults(results);
  };

  // Save Telegram config
  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    LocalDbService.saveTelegramConfig(tgConfig);
    alert("Telegram bildirishnoma sozlamalari muvaffaqiyatli saqlandi! Bot test xabari yuborishga tayyor.");
    LocalDbService.sendTelegramNotification("🔔 Sozlamalar muvaffaqiyatli yangilandi! Tizim bildirishnomalari endi ushbu guruhga yuboriladi.");
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-4 text-left" id="admin-panel-view">
      
      {/* Top Banner Administration Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-premium relative overflow-hidden">
        {/* Abstract lines background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full filter blur-3xl opacity-50"></div>
        
        <div className="space-y-1 z-10">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">ADMINISTRATOR MULOQOT XONASI</span>
          <h1 className="text-xl sm:text-3xl font-black">Online Imtihon Boshqaruv Ofisi</h1>
          <p className="text-xs text-slate-400 leading-normal max-w-xl">
            Tizimdagi barcha fanlarni tahrirlang, TXT formatda yangi testlarni ommaviy yuklang, foydalanuvchilar harakatlarini real vaqtda auditing qiling.
          </p>
        </div>

        <button
          onClick={onLogOut}
          className="bg-red-656 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl text-xs transition duration-150 active:scale-95 shadow-premium cursor-pointer z-10"
          id="btn-admin-logout"
        >
          Admin Chiqish (Log Out)
        </button>
      </div>

      {/* Stripe-like high precision metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Jami O'quvchilar", value: stats.usersCount, sub: "SaaS a'zolari", icon: Users, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40" },
          { label: "Mavjud Fanlar", value: stats.subjectsCount, sub: "Darslik yo'nalishlar", icon: FileText, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Savollar Bazasi", value: stats.questionsCount, sub: "Sinov savollari", icon: HelpCircle, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40" },
          { label: "Topshirilgan Testlar", value: stats.resultsCount, sub: "Natijalar jadvali", icon: BarChart3, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-premium flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none mt-1">{item.value}</p>
                <p className="text-[10px] text-slate-500 font-medium">{item.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigations sidebar structure and details */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Admin Page Tabs Selectors */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-premium space-y-1">
          <h3 className="font-bold text-[10px] text-slate-400 tracking-widest uppercase px-3 pb-3 border-b border-slate-50 dark:border-slate-800 mb-2">MULOQOT MENYULARI</h3>
          {[
            { id: 'dashboard', label: '📊 Admin Dashboard' },
            { id: 'subjects', label: '📚 Fanlarni tuzatish' },
            { id: 'questions', label: '❓ Savollar drayveri' },
            { id: 'import', label: '📥 Ommaviy Import' },
            { id: 'users', label: '👥 O\'quvchilar Analizi' },
            { id: 'db_console', label: '🗄️ Postgres Server' },
            { id: 'telegram', label: '🔔 Telegram Shlyuzi' }
          ].map(menu => (
            <button
              key={menu.id}
              onClick={() => setActiveMenu(menu.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold text-xs transition duration-150 cursor-pointer ${activeMenu === menu.id ? 'bg-[#0F172A] text-white dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {menu.label}
            </button>
          ))}
        </div>

        {/* Workspace content section */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* MENU: Admin Dashboard (Logs list / statistics) */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6 animate-scale-up">
              {/* Daily system Logs representation */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-mono">🪵 REAL VAQTDAGI AKTIVLIK LOG JADVALI (Log Audit)</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">O'quvchilar va tizim harakatlarining audit yozuvlari</p>
                  </div>
                  <button
                    onClick={() => {
                      loadData();
                      alert("Aktivlik jurnali yangilandi!");
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition cursor-pointer"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {LocalDbService.getLogs().map((log) => (
                    <div 
                      key={log.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-mono"
                    >
                      <div className="space-y-0.5">
                        <p className="text-slate-800 dark:text-slate-300 font-bold truncate max-w-sm">
                          👤 {log.fullName}: <span className="text-blue-600 dark:text-blue-400 font-extrabold">{log.action}</span>
                        </p>
                        <p className="text-[10px] text-slate-500">{log.details}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-slate-400">IP: {log.ipAddress}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MENU: Subjects management */}
          {activeMenu === 'subjects' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-scale-up">
              {/* Form column */}
              <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-premium">
                <h3 className="font-bold text-sm text-slate-905 dark:text-white border-b border-slate-100 dark:border-slate-805 pb-3 mb-4 font-mono">
                  {editSubjId ? '✏️ FANNI TAHRIRLASH' : '➕ YANGI FAN QO\'SHISh'}
                </h3>
                
                <form onSubmit={handleSaveSubject} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Fan nomi</label>
                    <input
                      type="text"
                      required
                      value={newSubj.name}
                      onChange={(e) => setNewSubj({ ...newSubj, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="Masalan: Fizika"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Icon nomi (Lucide library)</label>
                    <select
                      value={newSubj.icon}
                      onChange={(e) => setNewSubj({ ...newSubj, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                    >
                      {['BookOpen', 'Calculator', 'Compass', 'Languages', 'Award', 'Settings', 'Smartphone', 'Eye'].map(ic => (
                        <option key={ic} value={ic}>{ic}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Fan haqida sharh</label>
                    <textarea
                      rows={3}
                      value={newSubj.description}
                      onChange={(e) => setNewSubj({ ...newSubj, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs resize-none"
                      placeholder="Qisqacha ta'rif yozing..."
                    />
                  </div>

                  <div className="flex gap-2">
                    {editSubjId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditSubjId(null);
                          setNewSubj({ name: '', icon: 'BookOpen', description: '' });
                        }}
                        className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        Bekor qilish
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-glow"
                    >
                      Saqlash
                    </button>
                  </div>
                </form>
              </div>

              {/* List column */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-premium">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 font-mono">📚 MAVJUD FANLAR RO'YXATI</h3>
                <div className="space-y-2">
                  {subjects.map(s => (
                    <div 
                      key={s.id} 
                      className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-850 rounded-xl hover:shadow-premium transition"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-9 h-9 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                          <DynamicIcon name={s.icon} size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight">{s.name}</p>
                          <p className="text-[10px] text-slate-450 mt-0.5">Savollar jami: <span className="font-bold font-mono">{s.totalQuestions} ta</span></p>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditSubjectTrigger(s)}
                          className="p-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 dark:bg-yellow-950/20 dark:hover:bg-yellow-900/40 rounded-lg transition cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(s.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-656 bg-red-600/10 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/40 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MENU: Question driver editing */}
          {activeMenu === 'questions' && (
            <div className="space-y-6 animate-scale-up">
              {/* Category select block & Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-premium">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white font-mono">❓ TEST SAVOLI QO'SHISH VA FILTRI</h3>
                  
                  <div className="flex gap-2 items-center text-xs">
                    <span className="font-mono">Fannini tanlang:</span>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-805 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono font-black"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.totalQuestions} ta savol)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <form onSubmit={handleSaveQuestion} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Savol matni (Question text)</label>
                    <textarea
                      required
                      rows={2}
                      value={newQuest.questionText}
                      onChange={(e) => setNewQuest({ ...newQuest, questionText: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs resize-none"
                      placeholder="Savolingizni aniq qilib kiriting..."
                    />
                  </div>

                  {/* Options layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <div key={opt}>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Variant {opt}</label>
                        <input
                          type="text"
                          required
                          value={(newQuest as any)[`option${opt}`]}
                          onChange={(e) => setNewQuest({ ...newQuest, [`option${opt}`]: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                          placeholder={`Variant ${opt} javobi...`}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">To'g'ri javob</label>
                    <select
                      value={newQuest.correctAnswer}
                      onChange={(e) => setNewQuest({ ...newQuest, correctAnswer: e.target.value as any })}
                      className="w-28 px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono font-bold"
                    >
                      {['A', 'B', 'C', 'D'].map(key => (
                        <option key={key} value={key}>Variant {key}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 shadow-premium active:scale-95"
                  >
                    Test savolini bazaga qo'shish
                  </button>
                </form>
              </div>

              {/* Questions table list */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-premium">
                <h3 className="font-bold text-sm text-slate-805 dark:text-white border-b border-slate-100 dark:border-slate-805 pb-3 mb-4 font-mono">📋 FILTERLANGAN FAN SAVOLLARI ({questions.length} ta savol)</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {questions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">Fanda hali savollar kiritilmagan...</p>
                  ) : (
                    questions.map((q, idx) => (
                      <div 
                        key={q.id} 
                        className="p-3 border border-slate-100 dark:border-slate-850 rounded-xl hover:shadow-premium transition flex justify-between gap-4 items-center"
                      >
                        <div>
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            {idx + 1}. {q.questionText}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400 font-mono">
                            <span>A: {q.options.A}</span>
                            <span>B: {q.options.B}</span>
                            <span>C: {q.options.C}</span>
                            <span>D: {q.options.D}</span>
                            <span className="text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded ml-1">✓ {q.correctAnswer}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/40 rounded-lg transition shrink-0 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MENU: Bulk upload questions */}
          {activeMenu === 'import' && (
            <div className="space-y-6 animate-scale-up">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-premium text-left space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white font-mono">📥 YUKLASH TIZIMI (BULK IMPORT TEST)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Xavfsiz va aniqlangan formatlar orqali ommaviy savollarni kiritish</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="text-xs">
                    <span className="font-bold font-mono">Import qilinadigan fan yo'nalishi:</span>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg outline-none text-xs font-mono font-bold"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Formats Info banner */}
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-[10px] leading-relaxed text-blue-700 dark:text-blue-400 space-y-1">
                    <p className="font-bold">QO'LLAB QUVVATLANADIGAN FORMATLAR:</p>
                    <p><b>Qolip 1:</b> Savollar chiziqchalar bilan. Javob: A belgisi bilan tagida turadi.</p>
                    <p><b>Qolip 2:</b> Savollar orasida <span className="font-mono">"++++"</span> ko'rinishda ajratish.</p>
                    <p><b>Qolip 3:</b> To'g'ri variant oxirida panjara belgi <span className="font-mono">"#"</span> bilam keladi.</p>
                  </div>
                </div>

                {/* Import Text area */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500">Matnli hujjat nusxasini (TXT / DOC / DOCX matnini) kiriting:</label>
                  <textarea
                    rows={8}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full p-4 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono resize-none leading-relaxed"
                    placeholder="Masalan:

Informatika fani nimani o'rganadi?
A) Kompyuter va dasturlash#
B) Hayvonot dunyosini
C) Astronomiya qonunlarini
D) Tabiat hodisalarini

++++

Skaning qurilmasining vazifasi nima?
A) Ma'lumotlarni qog'ozga chiqarish
B) Tasvirni kompyuterga kiritish
C) To'g'ri javob yo'q
D) Ovoz chiqarish
Javob: B"
                  />
                </div>

                {/* Import actions */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-slate-400 font-mono">Tizim formatlarni bir zumda silliq ajratadi.</span>
                  <button
                    onClick={handleBulkImport}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition duration-150 shadow-glow flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Upload size={14} />
                    Hujjatlarni Import Qilish
                  </button>
                </div>

                {/* Import counter result status view */}
                {importStatus && (
                  <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Mavajjad kiritilgan</p>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{importStatus.imported} ta</p>
                    </div>
                    <div className="text-center border-l border-r border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Dublikat (Mavjud)</p>
                      <p className="text-xl font-black text-amber-500 mt-1">{importStatus.duplicates} ta</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Xatolik topildi</p>
                      <p className="text-xl font-black text-red-500 mt-1">{importStatus.errors} ta</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MENU: Users list directory analyses */}
          {activeMenu === 'users' && (
            <div className="space-y-6 animate-scale-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                {/* User selection column */}
                <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-premium space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 font-mono">👥 TIZIM O'QUVChILARI</h3>
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {usersList.map(usr => (
                      <div
                        key={usr.id}
                        onClick={() => handleAuditUser(usr)}
                        className={`p-2.5 rounded-lg text-left cursor-pointer transition ${selectedAuditUser?.id === usr.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-350'}`}
                      >
                        <p className="text-xs truncate">{usr.fullName}</p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">Phone: {usr.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit detail column */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-premium space-y-4 min-h-[350px]">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 font-mono">📊 FOYDALANUVCHI SINOVLAR TARIXI AUDITING</h3>
                  
                  {!selectedAuditUser ? (
                    <p className="text-xs text-slate-400 text-center py-10">Auditing qilish uchun chap tomondagi ro'yxatdan o'quvchini tanlang.</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Contact metadata */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3 rounded-xl text-xs text-slate-500 font-mono">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">F.I.SH:</p>
                          <p className="font-bold text-slate-800 dark:text-slate-300 mt-0.5">{selectedAuditUser.fullName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Oxirgi kirish:</p>
                          <p className="font-bold text-slate-800 dark:text-slate-300 mt-0.5">{new Date(selectedAuditUser.lastLogin).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Email:</p>
                          <p className="font-bold text-slate-805 dark:text-slate-300 mt-0.5">{selectedAuditUser.email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">XP (Ball):</p>
                          <p className="font-bold text-blue-600 mt-0.5">{selectedAuditUser.xp} XP</p>
                        </div>
                      </div>

                      {/* Result listing */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-600">Topshirilgan test natijalari:</h4>
                        {auditUserResults.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">O'quvchi hali biror marta imtihon sinovlarida qatnashmagan.</p>
                        ) : (
                          auditUserResults.map(res => (
                            <div 
                              key={res.id}
                              className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl flex justify-between items-center text-xs font-mono"
                            >
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-300">{res.subjectName}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Sana: {new Date(res.createdAt).toLocaleDateString()} | Turi: {res.testType} talik</p>
                              </div>
                              <div className="flex gap-4 items-center">
                                <span className="text-slate-450 text-[10px]">{res.completionTimeFormatted}</span>
                                <span className={`font-bold text-sm ${res.percentageScore >= 60 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {res.percentageScore}%
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* MENU: Database Relational Postgres Emulator Console */}
          {activeMenu === 'db_console' && (
            <div className="animate-scale-up">
              <AdminEmulatorConsole />
            </div>
          )}

          {/* MENU: Telegram Notification System Config */}
          {activeMenu === 'telegram' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium text-left space-y-4 animate-scale-up">
              <div className="border-b border-slate-105 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-mono">🔔 TELEGRAM INTEGRATSIYA SHLYUZI</h3>
                <p className="text-xs text-slate-405 mt-0.5">Yangi o'quvchi qo'shilishi yoki yuqori natijalar haqida ogohlantirish</p>
              </div>

              <form onSubmit={handleSaveTelegram} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-505 dark:text-slate-400 font-bold mb-1">Telegram Bot Token (HTTP API) kodi</label>
                  <input
                    type="text"
                    required
                    value={tgConfig.botToken}
                    onChange={(e) => setTgConfig({ ...tgConfig, botToken: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    placeholder="Masalan: 583948592:AAG849-mock_key"
                  />
                </div>

                <div>
                  <label className="block text-slate-505 dark:text-slate-400 font-bold mb-1">Telegram Chat ID (Guruh yoki Kanal ID)</label>
                  <input
                    type="text"
                    required
                    value={tgConfig.chatId}
                    onChange={(e) => setTgConfig({ ...tgConfig, chatId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    placeholder="Masalan: -1002930492"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tg-enabled-cb"
                    checked={tgConfig.notificationsEnabled}
                    onChange={(e) => setTgConfig({ ...tgConfig, notificationsEnabled: e.target.checked })}
                    className="rounded text-blue-600 border-slate-300"
                  />
                  <label htmlFor="tg-enabled-cb" className="text-slate-650 cursor-pointer">
                    Telegram bildirishnomalarini faollashtirish
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-750 text-white font-bold py-3 px-6 rounded-xl transition duration-150 shadow-glow flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Send size={14} />
                  Sozlamalarni saqlash va sinov aloqasini o'rnatish
                </button>
              </form>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-xl flex gap-3 items-start text-[11px] leading-relaxed text-slate-500">
                <Smartphone size={18} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#0F172A] dark:text-white">Isloh etish bo'yicha:</h4>
                  <p className="mt-0.5">
                    Tizim orqali rasmiy Telegram bot integratsiyasini faollashtirish uchun botingizni maxsus guruhga <b>Administrator</b> qilib qo’shing, so'ngra sozlamalar tugmasini saqlang.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
