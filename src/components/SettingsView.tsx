import React, { useState } from 'react';
import { Profile } from '../types';
import { LocalDbService } from '../db/localDb';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, Save, RefreshCw, 
  Trash2, Bell, Sparkles, Smartphone, ShieldCheck, Sun, Moon, 
  Info, AlertTriangle, CheckCircle, ChevronRight, Settings, Languages
} from 'lucide-react';
import { getTelegramUser } from '../lib/telegramClient';

interface SettingsViewProps {
  currentUser: Profile;
  onProfileUpdate: (updated: Profile) => void;
  onLogOut: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

type TabType = 'account' | 'telegram' | 'preferences' | 'security';

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  currentUser, 
  onProfileUpdate, 
  onLogOut,
  theme,
  onToggleTheme 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('account');
  
  // Account settings form state
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [login, setLogin] = useState(currentUser.login || '');
  
  // Security/Password state
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  // Telegram binding state
  const [telegramId, setTelegramId] = useState(currentUser.telegramId || '');
  const [telegramUsername, setTelegramUsername] = useState(currentUser.telegramUsername || '');

  // Experience state
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('setting_compact_mode') === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('setting_sound_enabled') !== 'false';
  });
  const [autoSaveSetting, setAutoSaveSetting] = useState(() => {
    return localStorage.getItem('setting_autosave') !== 'false';
  });

  // Action messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg("F.I.SH maydoni bo'sh bo'lishi mumkin emas.");
      return;
    }
    if (!login.trim()) {
      setErrorMsg("Login maydoni bo'sh bo'lishi mumkin emas.");
      return;
    }

    // Check if login already exists for another user
    const otherUsers = LocalDbService.getProfiles().filter(p => p.id !== currentUser.id);
    if (otherUsers.some(u => u.login.toLowerCase() === login.trim().toLowerCase())) {
      setErrorMsg("Ushbu login band qilingan. Iltimos boshqasini tanlang.");
      return;
    }

    const updatedProfile: Profile = {
      ...currentUser,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      login: login.trim()
    };

    try {
      LocalDbService.saveProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      
      // Save log audit
      LocalDbService.addLog(currentUser.id, updatedProfile.fullName, "Profil yangilanishi", "Foydalanuvchi ma'lumotlarini tahrirladi");
      
      setSuccessMsg("Hisob ma'lumotlari muvaffaqiyatly saqlandi!");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg("Saqlashda xatolik yuz berdi: " + err.message);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (!newPassword.trim()) {
      setPasswordMessage({ text: "Yangi parolni kiriting", type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "Yangi parollar mos kelmadi", type: 'error' });
      return;
    }

    // Verify current password if user has password set
    if (currentUser.password && currentUser.password !== currentPassword) {
      setPasswordMessage({ text: "Joriy parol noto'g'ri kiritildi", type: 'error' });
      return;
    }

    const updatedProfile: Profile = {
      ...currentUser,
      password: newPassword
    };

    try {
      LocalDbService.saveProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      
      // Save logs
      LocalDbService.addLog(currentUser.id, currentUser.fullName, "Parol o'zgartirildi", "Foydalanuvchi tizim parolini yangiladi");
      
      setPasswordMessage({ text: "Parol muvaffaqiyatli saqlandi!", type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage({ text: '', type: '' }), 4000);
    } catch (err: any) {
      setPasswordMessage({ text: "Parolni o'zgartirishda xatolik: " + err.message, type: 'error' });
    }
  };

  const handleLinkTelegramAuto = () => {
    const tgUser = getTelegramUser();
    if (tgUser) {
      const updated: Profile = {
        ...currentUser,
        telegramId: String(tgUser.id),
        telegramUsername: tgUser.username || ''
      };
      LocalDbService.saveProfile(updated);
      onProfileUpdate(updated);
      setTelegramId(String(tgUser.id));
      setTelegramUsername(tgUser.username || '');
      setSuccessMsg('Telegram akkauntingiz muvaffaqiyatli ulandi!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert("Bu funksiya asosan Telegram Mini App ichida ishlaydi. Iltimos bot orqali kiring, yoki quyidagi qo'lda bog'lash maydonidan foydalaning.");
    }
  };

  const handleSaveTelegramManual = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const updated: Profile = {
      ...currentUser,
      telegramId: telegramId.trim() || undefined,
      telegramUsername: telegramUsername.trim() || undefined
    };

    try {
      LocalDbService.saveProfile(updated);
      onProfileUpdate(updated);
      
      LocalDbService.addLog(currentUser.id, currentUser.fullName, "Telegram bog'lash", `Telegram sozlamalari yangilandi. ID: ${telegramId}`);
      
      setSuccessMsg("Telegram integratsiya ma'lumotlari saqlandi!");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg("O'zgarishlarni saqlashda xatolik: " + err.message);
    }
  };

  const handleTogglePreference = (type: 'compact' | 'sound' | 'autosave') => {
    if (type === 'compact') {
      const next = !compactMode;
      setCompactMode(next);
      localStorage.setItem('setting_compact_mode', String(next));
    } else if (type === 'sound') {
      const next = !soundEnabled;
      setSoundEnabled(next);
      localStorage.setItem('setting_sound_enabled', String(next));
    } else if (type === 'autosave') {
      const next = !autoSaveSetting;
      setAutoSaveSetting(next);
      localStorage.setItem('setting_autosave', String(next));
    }
  };

  const handleClearHistory = () => {
    if (confirm("Haqiqatan ham barcha test natijalaringiz tarixini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!")) {
      LocalDbService.clearUserResults(currentUser.id);
      
      // Log Action
      LocalDbService.addLog(currentUser.id, currentUser.fullName, "Tarixni tozalash", "Foydalanuvchi o'zining barcha test natijalarini tozaladi");
      
      alert("Sizning barcha ishlangan test natijalaringiz tozalandi.");
      window.location.reload();
    }
  };

  const handleClearMistakes = () => {
    if (confirm("Haqiqatan ham barcha xatolar tahlili tarixini o'chirib tashlamoqchimisiz?")) {
      LocalDbService.clearUserMistakes(currentUser.id);
      
      alert("Xatolar jurnali tozalandi.");
    }
  };

  const handleDeleteAccount = () => {
    const doubleCheck = prompt("Hisobni o'chirish uchun parolingizni yoki 'OCHIRISH' so'zini kiriting:");
    if (doubleCheck === 'OCHIRISH' || (currentUser.password && doubleCheck === currentUser.password)) {
      if (confirm("Sizning akkauntingiz, unvonlaringiz, XP ballaringiz va barcha yozuvlaringiz butunlay o'chib ketadi. Davom ettirasizmi?")) {
        LocalDbService.deleteProfile(currentUser.id);
        
        // Remove results & mistakes
        LocalDbService.clearUserResults(currentUser.id);
        LocalDbService.clearUserMistakes(currentUser.id);

        alert("Hisobingiz muvaffaqiyatli o'chirildi.");
        onLogOut();
      }
    } else if (doubleCheck !== null) {
      alert("Tasdiqlash kodi yoki parol xato.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-scale-up" id="settings-view-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-left border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-600">⚙️</span> Tizim Sozlamalari
          </h1>
          <p className="text-xs text-slate-500 mt-1">Loyiha sozlamalari, shaxsiy hisob parametrlari, integratsiyalar va interfeys interaktivligi</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg px-2.5 py-1">v2.1 Stable</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start text-left">
        {/* Settings Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1 bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'account' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
            }`}
          >
            <User size={15} />
            <span>Hisob Ma'lumotlari</span>
          </button>
          
          <button
            onClick={() => setActiveTab('telegram')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'telegram' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
            }`}
          >
            <Smartphone size={15} />
            <span>Telegram Bot</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'preferences' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sparkles size={15} />
            <span>Qulaylik va Interfeys</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'security' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Xavfsizlik va Tizim</span>
          </button>
        </div>

        {/* Settings Workspace Container */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-premium relative min-h-[450px]">
          
          {/* Status Messages */}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-emerald-800 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-pulse">
              <CheckCircle size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl text-red-800 dark:text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB: ACCOUNT INFO */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Foydalanuvchi Profili</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Tizimda ko'rinadigan shaxsiy ma'lumotlar va login parametrlari</p>
              </div>

              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">F.I.SH (To'liq ismingiz)</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-9 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                        placeholder="Masalan, Husniddin Xoldorov"
                        required
                      />
                    </div>
                  </div>

                  {/* Login (Username) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Login (Tizimga kirish nomi)</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-9 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                        placeholder="Login user"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Telefon Raqami (Aloqa)</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-9 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                        placeholder="+998 90 123 45 67"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Elektron Pochta</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-9 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                        placeholder="namuna@gmail.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition duration-150 active:scale-95 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>O'zgarishlarni Saqlash</span>
                  </button>
                </div>
              </form>

              {/* SECURITY SECTION IN TAB ACCOUNT FOR COHESION */}
              <div className="border-t border-slate-100 dark:border-slate-800/50 pt-5 mt-4">
                <div className="border-b border-slate-100 dark:border-slate-800/50 pb-3 mb-4">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Sizning Parolingiz</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tizimga kirish xavfsizligini oshirish uchun parolni o'zgartiring</p>
                </div>

                {passwordMessage.text && (
                  <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 mb-4 ${
                    passwordMessage.type === 'success' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400' 
                      : 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-400'
                  }`}>
                    <Info size={14} />
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Current Password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Joriy Parol</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-9 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                          placeholder="Joriy parolingiz"
                        />
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Yangi Parol</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-9 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                          placeholder="Kamida 4 ta belgi"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tasdiqlang</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-9 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                          placeholder="Yangi parolni qayta kiriting"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Parolniyangilash
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: TELEGRAM INTEGRATION */}
          {activeTab === 'telegram' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="text-blue-500" size={18} /> Telegram Integratsiyasi
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Test natijalari hamda bellashuv bildirishnomalarini Telegram orqali olish</p>
              </div>

              {/* Bot advertisement & Tutorial */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/60 dark:border-blue-900/50 p-5 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">🤖 Platformaning rasmiy Telegram boti bilan ishlash</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Bizning maxsus Telegram botimiz orqali siz har gal test yoki duel yakunlangganda <b>avtomatlashgan batafsil tahliliy xabarlarni</b> to'g'ridan-to'g'ri o'zingizning Telegramingizga bepul olishingiz mumkin.
                </p>
                
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleLinkTelegramAuto}
                    className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <span>🛡️ Mini App orqali Avto ulash</span>
                  </button>
                  <a
                    href="https://t.me/OnlineImtihonDuelBot" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/80 font-bold py-2 px-4 rounded-xl transition cursor-pointer"
                  >
                    <span>💬 Botni Telegramda ochish</span>
                  </a>
                </div>
              </div>

              {/* Description Steps */}
              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-400 max-w-2xl">
                <p className="font-bold text-slate-800 dark:text-slate-200">Qo'lda ulanish bosqichlari:</p>
                <ol className="list-decimal pl-5 space-y-1.5 font-medium">
                  <li>Telegram @OnlineImtihonDuelBot ga kiring va <b>/start</b> buyrug'ini bosing.</li>
                  <li>Telegramda o'z ID raqamingizni aniqlang (yoki bot orqali avtomatik profil ochganda ko'ring).</li>
                  <li>Ushbu ID raqamini pastdagi <b>Telegram User ID</b> maydoniga kiriting va Saqlang.</li>
                </ol>
              </div>

              <form onSubmit={handleSaveTelegramManual} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Telegram User ID */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ID Raqamingiz (Telegram ID)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">ID</span>
                      <input
                        type="text"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-9 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                        placeholder="Masalan: 1654414811"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400">Sonlardan iborat joriy Telegram profilingizning unikal identifikatori</p>
                  </div>

                  {/* Telegram Username */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Telegram Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">@</span>
                      <input
                        type="text"
                        value={telegramUsername}
                        onChange={(e) => setTelegramUsername(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-8 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                        placeholder="Telegram nikiz"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400">Sizning @ bilan boshlanuvchi telegram taxallusingiz</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition duration-150 active:scale-95 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Telegramni Saqlash</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="text-blue-500" size={18} /> Qulaylik va Interaktivlik
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Vizuallikni, tizim ko'rinishini hamda interaktiv funksiyalarni sozlang</p>
              </div>

              {/* Option Cards */}
              <div className="space-y-4">
                
                {/* Theme toggle Row */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl">
                  <div className="space-y-0.5 text-left pr-4">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      {theme === 'light' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-indigo-400" />}
                      Tungi rejim (Dark Mode)
                    </p>
                    <p className="text-[9px] text-slate-500">Tizim dizaynining umumiy rangi va mavzusini tungi rejimga o'tkazish</p>
                  </div>
                  <button
                    onClick={onToggleTheme}
                    className="px-3.5 py-1.5 text-[10px] font-bold bg-white border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    {theme === 'light' ? 'Tungi rejimga o\'tish' : 'Kunduzgi rejimga o\'tish'}
                  </button>
                </div>

                {/* Compact Mode Row */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl">
                  <div className="space-y-0.5 text-left pr-4">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Zichroq tartib (Compact UI)</p>
                    <p className="text-[9px] text-slate-500">Dizayn bo'shliqlarini kichraytirib, ma'lumotlarni zichroq ko'rsatish</p>
                  </div>
                  <button
                    onClick={() => handleTogglePreference('compact')}
                    className={`w-12 h-6 rounded-full p-0.5 transition duration-200 ease-in-out cursor-pointer ${compactMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition duration-200 ease-in-out transform ${compactMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Sound effect toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl">
                  <div className="space-y-0.5 text-left pr-4">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Tovush effektlari (Sound FX)</p>
                    <p className="text-[9px] text-slate-500">Tugmalar bosilganda, to'g'ri/noto'g'ri javoblarda tovush chiqarish</p>
                  </div>
                  <button
                    onClick={() => handleTogglePreference('sound')}
                    className={`w-12 h-6 rounded-full p-0.5 transition duration-200 ease-in-out cursor-pointer ${soundEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition duration-200 ease-in-out transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Autosave Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl">
                  <div className="space-y-0.5 text-left pr-4">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Avtomatik saqlash (Autosave)</p>
                    <p className="text-[9px] text-slate-500">Imtihon jarayonlari va vaqt oralig'ini har minutda server bilan sinxronlash</p>
                  </div>
                  <button
                    onClick={() => handleTogglePreference('autosave')}
                    className={`w-12 h-6 rounded-full p-0.5 transition duration-200 ease-in-out cursor-pointer ${autoSaveSetting ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition duration-200 ease-in-out transform ${autoSaveSetting ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Language section placeholder */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl">
                  <div className="space-y-0.5 text-left pr-4">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Languages size={14} className="text-blue-500" />
                      Interfeys tili (Language)
                    </p>
                    <p className="text-[9px] text-slate-500">Hozirgi vaqtda faqat O'zbek tili to'liq faol. Kengaytirish rejalashtirilmoqda.</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">O'zbekcha</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY & DESTRUCTION */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="text-red-500 shrink-0" size={18} /> Tizim Faoliyati va Tozalashlar
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Sizning shaxsiy tarixingiz va hisobingizni xavfsiz boshqarish paneli</p>
              </div>

              {/* Dynamic Warning Card */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100/80 dark:border-yellow-900/40 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" size={16} />
                <div className="text-left">
                  <p className="text-xs font-bold text-yellow-800 dark:text-yellow-400">Ehtiyot bo'ling!</p>
                  <p className="text-[10px] text-yellow-700 dark:text-yellow-400 mt-1 font-medium leading-relaxed">
                    Ushbu bo'limdagi amallarni ortga qaytarib bo'lmaydi. Barcha o'chirilgan natijalar, unvonlar va tahliliy jurnallar butunlay lokal va bulutli bazalardan chiqib ketadi.
                  </p>
                </div>
              </div>

              {/* Options Column */}
              <div className="space-y-4">
                {/* Clear Results History */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                  <div className="text-left space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Imtihonlar tarixini tozalash</p>
                    <p className="text-[9px] text-slate-500">Hozirgacha topshirgan barcha test natihali tarixingizni tozalash</p>
                  </div>
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/20 text-[10px] font-bold rounded-xl transition cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Tarixni tozalash</span>
                  </button>
                </div>

                {/* Clear Mistakes History */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                  <div className="text-left space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Xatolar jurnallari tahlilini tozalash</p>
                    <p className="text-[9px] text-slate-500">Test davomida xato ishlagan va yig'ilib qolgan savollar bazasini tozalash</p>
                  </div>
                  <button
                    onClick={handleClearMistakes}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-[10px] font-bold rounded-xl transition cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Xatolarni tiklash</span>
                  </button>
                </div>

                {/* Delete Entire Account */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-100/60 dark:border-red-900/20 bg-red-500/[0.02] dark:bg-red-500/[0.01] rounded-2xl">
                  <div className="text-left space-y-0.5">
                    <p className="text-xs font-bold text-red-600 dark:text-red-500">Akkauntni butunlay o'chirish</p>
                    <p className="text-[9px] text-red-400">Loyiha platformasidan profilingizni va jami XP balingizni abadiy o'chirish</p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-xl transition active:scale-95 shadow-md shadow-red-500/10 cursor-pointer"
                  >
                    Hisobni o'chirish
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
