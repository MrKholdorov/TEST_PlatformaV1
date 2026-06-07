/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Phone, User, LogIn, ArrowRight, Star, AlertCircle } from 'lucide-react';
import { Profile } from '../types';
import { LocalDbService } from '../db/localDb';

interface AuthPageProps {
  onAuthSuccess: (user: Profile) => void;
  onAdminAuthSuccess: (email: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess,
  onAdminAuthSuccess
}) => {
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [loginForm, setLoginForm] = useState({
    login: '',
    password: '',
    rememberMe: true
  });

  const [registerForm, setRegisterForm] = useState({
    login: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    termsAccepted: true
  });

  // Google OAuth modal emulator state
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>('xusniddinku@gmail.com');
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<boolean>(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profiles = LocalDbService.getProfiles();
    const found = profiles.find(p => p.login.toLowerCase() === loginForm.login.toLowerCase());

    if (!found) {
      alert("Xatolik: Bunday login bilan o'quvchi ro'yxatdan o'tmagan!");
      return;
    }

    // Since we don't store plain password encryption, we accept simple matches or simulation
    // In a real DB this is hashed.
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
    const profiles = LocalDbService.getProfiles();

    // Enforce unique logins
    const isLoginTaken = profiles.some(p => p.login.toLowerCase() === registerForm.login.toLowerCase());
    if (isLoginTaken) {
      alert("Xatolik: Ushu login band! Iltimos boshqa variant tanlang.");
      return;
    }

    const newUser: Profile = {
      id: `usr-${Date.now()}`,
      login: registerForm.login,
      fullName: registerForm.fullName,
      email: registerForm.email,
      phone: registerForm.phone,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      xp: 150 // Initial welcoming score
    };

    LocalDbService.saveProfile(newUser);
    LocalDbService.addNotification("Xush kelibsiz!", "Platformada muvaffaqiyatli hisob ochildi. Faningizni tanlang va testlarni boshlang!", "success", newUser.id);
    LocalDbService.addLog(newUser.id, newUser.fullName, "Ro'yxatdan o'tish", "Yangi foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi.");
    
    // Auto-alert Telegram hook
    LocalDbService.sendTelegramNotification(`🆕 YANGI FOYDALANUVChI RO'YXATDAN O'TDI!\n\n👤 F.I.SH: ${newUser.fullName}\n📞 Telefon: ${newUser.phone}\n📧 Email: ${newUser.email}`);

    alert("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
    onAuthSuccess(newUser);
  };

  const handleGoogleOAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = googleEmailInput.trim().toLowerCase();

    // Restrict Admin email access strictly to xusniddinku@gmail.com
    if (email === 'xusniddinku@gmail.com') {
      setShowGoogleModal(false);
      setAccessDeniedMessage(false);
      alert("Google Admin tasdiqlandi! Admin panelga xush kelibsiz.");
      onAdminAuthSuccess(email);
    } else {
      setAccessDeniedMessage(true);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto min-h-[70vh] flex flex-col md:flex-row items-stretch justify-center gap-8 py-8 px-4" id="auth-page-view">
      
      {/* Branding Column Panel */}
      <div className="md:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-premium relative overflow-hidden text-left min-h-[400px]">
        {/* Abstract lights background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/25 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/25 rounded-full filter blur-3xl opacity-30"></div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-premium">
            <ShieldCheck size={26} className="text-white" />
          </div>
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
        <div className="text-[10px] text-blue-200/50 mt-6 font-mono">
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
              Kirish (Log In)
            </button>
            <button
              onClick={() => {
                setIsLoginMode(false);
                setAccessDeniedMessage(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition duration-150 cursor-pointer ${!isLoginMode ? 'bg-[#0F172A] text-white dark:bg-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Roy'xatdan o'tish (Sign Up)
            </button>
          </div>

          {/* Form Content: LOGIN MODE */}
          {isLoginMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Foydalanuvchi Logini (Login)</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginForm.login}
                    onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Masalan: jasur_imtihon"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Maxfiy kalit (Password)</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="••••••••"
                  />
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
                Profilga Tizimga kirish
              </button>
            </form>
          ) : (
            /* Form Content: SIGNUP MODE */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">Foydalanuvchi Logini (unikal bo'lishi shart)</label>
                <input
                  type="text"
                  required
                  value={registerForm.login}
                  onChange={(e) => setRegisterForm({ ...registerForm, login: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  placeholder="Masalan: doston_dev"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">To'liq Familiya Ism Sharh (F.I.SH * Hujjat uchun)</label>
                <input
                  type="text"
                  required
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  placeholder="Masalan: Karimova Zilola Bahromovna"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">Elektron pochta manzili (Email)</label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  placeholder="Masalan: zilola@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">Telefon raqam (SMS/Xabar uchun)</label>
                <input
                  type="tel"
                  required
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  placeholder="Masalan: +998-95-586-58-59"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">Maxfiy kalitparol</label>
                <input
                  type="password"
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  placeholder="Kamida 6 xonali"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-150 shadow-premium flex items-center justify-center gap-2 active:scale-95 cursor-pointer text-xs"
                id="btn-register-submit"
              >
                Muvaffaqiyatli Ro'yxatdan o'tish
              </button>
            </form>
          )}

          {/* Separation line */}
          <div className="relative my-6 ">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-250 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-405 text-slate-400 font-bold">ADMINISTRATOR TIZIMI</span>
            </div>
          </div>

          {/* Secondary Admin Google OAuth Action */}
          <button
            onClick={() => {
              setAccessDeniedMessage(false);
              setShowGoogleModal(true);
            }}
            className="w-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
            id="btn-google-oauth-launch"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.71 0 3.275.61 4.5 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.9 0 9.802-4.15 9.802-9.973 0-.6-.051-1.185-.152-1.74l-9.65-.002z" />
            </svg>
            Google OAuth orqali kirish (Admin)
          </button>
        </div>
      </div>

      {/* ADMIN GOOGLE OAUTH POPUP MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-premium text-left animate-scale-up space-y-4">
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="text-blue-600" size={20} />
                  Google Sign-In Console
                </h3>
                <p className="text-xs text-slate-400">Google OAuth 2.0 sertifikatlangan tasdiq xizmati</p>
              </div>
              <button 
                onClick={() => {
                  setShowGoogleModal(false);
                  setAccessDeniedMessage(false);
                }} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                X
              </button>
            </div>

            <form onSubmit={handleGoogleOAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Elektron pochta (Google Email)</label>
                <input
                  type="email"
                  required
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  placeholder="Masalan: xusniddinku@gmail.com"
                />
              </div>

              {/* Ruxsat berilmagan warning banner */}
              {accessDeniedMessage && (
                <div className="flex gap-2 items-start bg-red-50 text-red-700 border border-red-150 p-3 rounded-xl dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 animate-pulse">
                  <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold">Ruxsat berilmagan</h4>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      Siz kiritgan elektron pochta administrator ruxsatiga ega emas! Ushbu tizim faqat <b>xusniddinku@gmail.com</b> uchun cheklangan.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 shadow-glow flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                Profilni Tasdiqlash
              </button>
            </form>

            <span className="block text-[10px] text-slate-400 leading-normal border-t border-slate-100 dark:border-slate-900 pt-3">
              Hisob orqali davom etish Google OAuth API shaxsiy xavfsizlik va cookies talablariga mos ravishda amalga oshiriladi.
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
