/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Phone, CheckCircle, Mail, MessageSquare, Send, Globe } from 'lucide-react';
import { LocalDbService } from '../db/localDb';

export const ContactView: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const fullName = (target.querySelector('input[type="text"]') as HTMLInputElement)?.value || '';
    const email = (target.querySelector('input[type="email"]') as HTMLInputElement)?.value || '';
    const message = (target.querySelector('textarea') as HTMLTextAreaElement)?.value || '';

    // Send Real Telegram Alert
    LocalDbService.sendTelegramNotification(
      `✉️ YANGI MUROJAAT QABUL QILINDI!\n\n👤 Foydalanuvchi: ${fullName}\n📧 Email: ${email}\n💬 Xabar: ${message}`
    );

    alert("Xabaringiz muvaffaqiyatli jo'natildi! Tez orada mutaxassislarimiz bog'lanishadi.");
    target.reset();
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4" id="contact-view">
      {/* Page header */}
      <div className="text-center mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">ALQA BO'LIMI</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 select-none">
          Biz Bilan Aloqa
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base">
          Tizim bo'yicha taklif, savol yoki muammolar yuzasidan istalgan vaqtda murojaat qilishingiz mumkin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Contact details */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Kontakt Ma'lumotlari</h2>
            
            <div className="space-y-4">
              {/* Telephone */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Telefon raqamimiz</p>
                  <a href="tel:+998955865859" className="text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:text-blue-600 transition">+998-95-586-58-59</a>
                </div>
              </div>

              {/* Telegram link */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Send size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Telegram qo'llab-quvvatlash</p>
                  <a href="https://t.me/MrKholdorov" target="_blank" rel="noopener noreferrer" className="text-sm font-extrabold text-slate-850 dark:text-slate-250 hover:text-blue-600 transition">@MrKholdorov</a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Elektron pochta</p>
                  <a href="mailto:xusniddinku@gmail.com" className="text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:text-blue-600 transition">xusniddinku@gmail.com</a>
                </div>
              </div>

              {/* Working hours */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Ish vaqtlarimiz</p>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Dushanba - Yakshanba, 24/7 Rejimida</p>
                </div>
              </div>
            </div>
          </div>

          {/* Slogan */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-glow space-y-2">
            <h3 className="font-bold text-base">Biz sizni tinglaymiz</h3>
            <p className="text-xs text-blue-100 leading-relaxed">
              Tizimimiz oliy darajada ishlashi va imtihon materiallarining ishonchliligini doimiy monitoring qilamiz. Biz bilan aloqaga chiqishdan tortinmang!
            </p>
          </div>
        </div>

        {/* Dynamic feedback form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Murojaat Jo'natish</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">To'liq ismingiz (F.I.SH)</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                placeholder="Masalan: Abdulla Qodiriy"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Elektron pochta manzilingiz</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                placeholder="Masalan: abdulla@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Xabar matni</label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white resize-none"
                placeholder="Fikr, taklif yoki savolingizni batafsil yozing..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-150 shadow-glow flex items-center justify-center gap-2 active:scale-95"
            >
              <MessageSquare size={16} />
              Xabarni Yuborish
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
