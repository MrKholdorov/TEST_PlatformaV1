/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock, Phone, User, LogIn, ArrowRight, Star, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Profile } from '../types';
import { LocalDbService } from '../db/localDb';
import { getTelegramUser, sendAdminNotification } from '../lib/telegramClient';

interface AuthPageProps {
  onAuthSuccess: (user: Profile) => void;
  onAdminAuthSuccess: (email: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess,
  onAdminAuthSuccess
}) => {
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [loginForm, setLoginForm] = useState({
    login: '',
    password: '',
    rememberMe: true
  });

  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Check if we have telegram user on mount
  useEffect(() => {
    const tgUser = getTelegramUser();
    if (tgUser) {
      // Auto login based on telegram id
      const profiles = LocalDbService.getProfiles();
      const found = profiles.find(p => p.telegramId === String(tgUser.id));
      if (found) {
        if (found.isBlocked) {
           alert("Akkaunt bloklangan.");
           return;
        }
        
        const updated = {
          ...found,
          lastLogin: new Date().toISOString()
        };
        LocalDbService.saveProfile(updated);
        onAuthSuccess(updated);
      }
    }
  }, []);

  const handleTgRegister = () => {
    const tgUser = getTelegramUser();
    if (tgUser) {
      setRegisterForm({
        ...registerForm,
        fullName: `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim(),
      });
      setIsLoginMode(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profiles = LocalDbService.getProfiles();
    const found = profiles.find(p => 
      p.login.toLowerCase() === loginForm.login.toLowerCase() ||
      (p.email && p.email.toLowerCase() === loginForm.login.toLowerCase())
    );

    if (!found) {
      alert("Xatolik: Bunday login yoki elektron pochta bilan o'quvchi ro'yxatdan o'tmagan!");
      return;
    }

    // Strict Account Blocking Check
    if (found.isBlocked) {
      alert("⚠️ KIRISH JADVALI RAD ETILDI: Ushbu o'quvchi profili administrator tomonidan vaqtincha bloklangan yoki kirishi cheklangan!");
      LocalDbService.addLog(found.id, found.fullName, "Kirish urinishi rad etildi", "Bloklangan akkauntdan tizimga kirishga harakat qildi.");
      return;
    }

    // Strict Password Validation
    if (found.password && found.password !== loginForm.password) {
      alert("Xatolik: Kiritilgan maxfiy parol noto'g'ri!");
      return;
    }

    alert(`Xush kelibsiz, ${found.fullName}!`);
    
    // Update last login
    const updated = {
      ...found,
      lastLogin: new Date().toISOString()
    };
    LocalDbService.saveProfile(updated);
    LocalDbService.addLog(found.id, found.fullName, "Tizimga kirish", "Muvaffaqiyatli parol orqali kirildi.");

    onAuthSuccess(updated);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      alert("Xatolik: Parollar bir-biriga mos kelmadi! Iltimos, ikkala parolni ham bir xil kiriting.");
      return;
    }

    if (registerForm.password.length < 6) {
      alert("Xatolik: Parol uzunligi kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    const profiles = LocalDbService.getProfiles();

    // Enforce unique emails
    const isEmailTaken = profiles.some(p => p.email.toLowerCase() === registerForm.email.toLowerCase());
    if (isEmailTaken) {
      alert("Xatolik: Ushbu elektron pochta manzili bilan allaqachon ro'yxatdan o'tilgan!");
      return;
    }

    // Generates a simple slugified unique login based on emailprefix
    const generatedLogin = registerForm.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || `usr_${Date.now()}`;
    const loginTaken = profiles.some(p => p.login.toLowerCase() === generatedLogin);
    const finalLogin = loginTaken ? `${generatedLogin}${Math.floor(Math.random() * 1000)}` : generatedLogin;

    const newUser: Profile = {
      id: `usr-${Date.now()}`,
      login: finalLogin,
      fullName: registerForm.fullName,
      email: registerForm.email,
      phone: '',
      password: registerForm.password,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      xp: 150, // Initial welcoming score
      telegramId: getTelegramUser() ? String(getTelegramUser().id) : undefined,
      telegramUsername: getTelegramUser() ? getTelegramUser().username : undefined
    };

    LocalDbService.saveProfile(newUser);
    LocalDbService.addNotification("Xush kelibsiz!", "Platformada muvaffaqiyatli hisob ochildi. Faningizni tanlang va testlarni boshlang!", "success", newUser.id);
    LocalDbService.addLog(newUser.id, newUser.fullName, "Ro'yxatdan o'tish", "Yangi foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi.");
    
    // Auto-alert Telegram hook for Admin
    sendAdminNotification(`👤 <b>Yangi foydalanuvchi ro'yxatdan o'tdi</b>\n\n• F.I.SH: <b>${newUser.fullName}</b>\n• Login: <code>${newUser.login}</code>\n• Email: ${newUser.email}\n• Parol: <code>${newUser.password}</code>`);

    alert("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
    onAuthSuccess(newUser);
  };

  return (
    <div className="w-full max-w-5xl mx-auto min-h-[70vh] flex flex-col md:flex-row items-stretch justify-center gap-8 py-8 px-4" id="auth-page-view">
      
      {/* Branding Column Panel */}
      <div className="md:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-premium relative overflow-hidden text-left min-h-[400px]">
        {/* Abstract lights background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/25 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/25 rounded-full filter blur-3xl opacity-30"></div>

        <div className="space-y-4">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-12 h-12 rounded-xl object-contain" 
            referrerPolicy="no-referrer"
          />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">INTERAKTIV AKADEMIYA</span>
          <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight">
            Professional Online Test Tizimi
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Bilimingizni tezkorlik bilan sinang, shaxsiy tahlillar paneli orqali xatolaringiz ustida ishlang hamda rasmiy sertifikatlarga ega bo’ling!
          </p>
        </div>

        {/* Feature listings */}
        <div className="space-y-3 mt-6">
          {[
            "Quizizz uslubidagi interaktiv sinovlar",
            "Avtomatlashtirilgan o'quv dasturi dinamikasi",
            "Yuklab olinadigan PDF sertifikatlar",
            "Real vaqtdagi milliy reyting tizimi"
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-blue-150">
              <Star className="text-amber-400 fill-amber-400 shrink-0" size={14} />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Technical Footer citation */}
        <div className="text-[10px] text-blue-200/50 mt-6 font-sans tracking-tight">
          Online Imtihon platform v1.8 (Node production build)
        </div>
      </div>

      {/* Forms column block */}
      <div className="md:w-1/2 flex flex-col justify-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-premium w-full">
          
          {/* Header selectors */}
          <div className="flex gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl mb-6">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition duration-150 cursor-pointer ${isLoginMode ? 'bg-[#0F172A] text-white dark:bg-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Tizimga kirish
            </button>
            <button
              onClick={() => {
                setIsLoginMode(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition duration-150 cursor-pointer ${!isLoginMode ? 'bg-[#0F172A] text-white dark:bg-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Ro'yxatdan o'tish
            </button>
          </div>

          {/* Telegram User Hook Banner */}
          {getTelegramUser() && (
            <div className="mb-6 p-4 bg-blue-50/80 dark:bg-blue-950/25 border border-blue-100/70 dark:border-blue-900/45 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div>
                <p className="text-xs font-bold text-blue-800 dark:text-blue-400">🤖 Telegram akkauntingiz aniqlandi</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-semibold">
                  Ismingiz: <b>{getTelegramUser().first_name} {getTelegramUser().last_name || ''}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={handleTgRegister}
                className="text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shrink-0 transition cursor-pointer"
              >
                📝 Ma'lumotlarni to'ldirish
              </button>
            </div>
          )}

          {/* Form Content: LOGIN MODE */}
          {isLoginMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Foydalanuvchi logini yoki Email manzili</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginForm.login}
                    onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Masalan: jasur_imtihon yoki jasur@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Maxfiy parol</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Keep me logged in checkbox representation */}
              <div className="flex items-center justify-between text-xs font-medium">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={loginForm.rememberMe}
                    onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                    className="rounded text-blue-600 border-slate-300 dark:bg-slate-800"
                  />
                  <span>Meni tizimda eslab qolish</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert("Parolni qayta tiklash havolasi xusniddinku@gmail.com manzilida jo'natildi. Iltimos pochtingizni tekshiring.")}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Kalitni unutdingizmi?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-150 shadow-premium flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                id="btn-login-submit"
              >
                <LogIn size={16} />
                Tizimga kirish
              </button>
            </form>
          ) : (
            /* Form Content: SIGNUP MODE */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">To'liq ism-sharif (F.I.Sh - Sertifikat uchun)</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Masalan: Karimova Zilola Bahromovna"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Elektron pochta manzili</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Masalan: zilola@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Maxfiy parol</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Kamida 6 ta belgi"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Parolni tasdiqlash</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Parolni qayta tasdiqlang"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-150 shadow-premium flex items-center justify-center gap-2 active:scale-95 cursor-pointer text-xs"
                id="btn-register-submit"
              >
                Ro'yxatdan o'tish
              </button>
            </form>
          )}

          {/* Separation line */}
          <div className="relative my-6 ">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-250 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-405 text-slate-400 font-bold">FAqat ro'yxatdan o'tganlar uchun</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
