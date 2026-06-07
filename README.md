# 🎓 Online Imtihon va Test Platformasi (O'quv Markazi)

Ushbu loyiha zamonaviy va professional **Online Imtihon va Test Tizimi** bo'lib, o'quvchilar uchun interaktiv test topshirish, real-vaqtda o'z bilimlarini milliy reytingda tahlil qilish va PDF-sertifikatlarni yuklab olish imkoniyatini taqdim etadi.

Loyihaning vizual dizayni oliy darajada, yuqori kontrastli va ko'zni charchatmaydigan **Enterprise Premium** uslubida sozlangan bo'lib, eng so'nggi **Tailwind CSS** va zamonaviy UI printsiplariga asoslangan.

---

## 🚀 Tezkori Start (Mahalliy Ishga tushirish)

Loyiha to'liq **TypeScript (Vite + React)** stacki yordamida yasalgan. Mahalliy kompyuteringizda ishga tushirish uchun quyidagi bosqichlarni bajaring:

1. **Kutubxonalarni o'rnatish:**
   ```bash
   npm install
   ```
2. **Loyihani ishga tushirish (Development rejimi):**
   ```bash
   npm run dev
   ```
3. **Loyihani ishlab chiqarishga tayyorlash (Production build):**
   ```bash
   npm run build
   ```

---

## 🌍 GitHub-ga yuklash va Vercel-ga deploy qilish yo'riqnomasi

Ushbu dastur to'liq serverless va client-side doirada yasalgani bois **Vercel** platformasiga yuklash juda oddiy va 100% mutlaqo bepul.

### 1-Qadam: Loyihani GitHub-ga yuklash

Agar lokal kompyuteringizda bo'lsangiz, quyidagi buyruqlarni ketma-ket bajaring:

```bash
# Git-ni loyiha ichida faollashtirish
git init

# Barcha fayllarni kiritish (.gitignore avtomatik ravishda keraksiz papkalarni chetlab o'tadi)
git add .

# Ilk commit-ni amalga oshirish
git commit -m "feat: Online Imtihon platformasi mukammal nashri"

# GitHub-da yangi repository ochib, uning manzilini ulang
git remote add origin https://github.com/FOYDALANUVCHI_NOMI/REPOS_NOMI.git

# Main branch-ni o'rnatib, kodni yuklang
git branch -M main
git push -u origin main
```

### 2-Qadam: Vercel-ga bepul deploy qilish

1. [Vercel.com](https://vercel.com/) saytida hisobingizga kiring yoki ro'yxatdan o'ting (buning uchun o'zingizning GitHub hisobingizdan foydalanish tavsiya qilinadi).
2. Panelda **"Add New"** tugmasini bosib, **"Project"** bo'limini tanlang.
3. GitHub hisobingizni vercelga bog'lang va hozirgina yuklagan `REPOS_NOMI` loyihangizni **Import** qiling.
4. Framework sozlamalarida **Vite** avtomatik aniqlanadi. Loyihani sozlamalariga tegmasdan to'g'ridan-to'g'ri **Deploy** tugmasini bosing.
5. Tayyor! Vercel sizga bepul `https://...vercel.app` ko'rinishidagi havola taqdim etadi.

---

## 🛠️ Interaktiv Backendlar konfiguratsiyasi

Ushbu tizim o'z ichiga ikkita mukammal backend va tizim integratsiyasini qamrab olgan:

### A) 📢 Telegram Bot Integratsiyasi (Haqiqiy Vaqtda Xabarnomalar)
Platformamiz orqali har safar yangi foydalanuvchi ro'yxatdan o'tganda, testlar yakunlanganda (agar ball 90%dan oshsa) yoki mijozlar aloqa xabari qoldirganda Telegram guruh yoki kanalingizga zudlik bilan bildirishnomalar yuboriladi.

**Telegram-ni sozlash yo'li:**
1. Telegramda `@BotFather` orqali yangi bot yarating va uning `API Token` kalitini oling.
2. Bot yuborishi kerak bo'lgan guruh yoki shaxsiy suhbatning `Chat ID` raqamini oling (masalan `@raw_data_bot` orqali olishingiz mumkin).
3. Sayt platformasiga kiring ➔ **Google Admin** orqali kiring (`xusniddinku@gmail.com` emaili orqali) ➔ **Telegram Sozlamalari** menyusiga o'ting va API token hamda Chat ID manzilingizni kiriting.
4. Shundan so'ng barcha foydalanuvchilar faolligi real vaqtda haqiqiy botingiz orqali Telegram kanalingizga yuklanadi!

### B) ⚡ SQL hamda Supabase / PostgreSQL Emulator Console
Admin bo'limida **"Tizim Ma'lumotlar Bazasi va Terminali"** o'rnatilgan. Ushbu bo'limda siz xuddi haqiqiy Supabase tizimidagidek:
* Jadvallar monitoringi (profiles, subjects, test_results, rankings vs.) amalga oshirishingiz.
* Maxsus SQL klaviaturalari orqali jadvallarga so'rov yuborishingiz (masalan: `SELECT * FROM profiles ORDER BY xp DESC;`).
* Ma'lumotlarni bir klikda zaxira nusxa shaklida (Backup Instant SQL) eksport qilishingiz mumkin.

---

## 📂 Loyihaning Strukturaviy Tuzilishi

Loyiha modullarga ajratilgan bo'lib, har bir fayl aniq mas'uliyat doirasiga ega:

* 📄 `/src/types.ts` — Tizim bo'yicha profil, test natijalari va jadvallar uchun TypeScript interfeyslari va turlari.
* 🗄️ `/src/db/localDb.ts` — Brauzer ichidagi ma'lumotlar bazasi xizmati (`LocalStorage` asosida). To'liq offlayn ishlash, Telegram Fetch sorovlari va savollar importi (Bulk Question Parsing) drayveri.
* 🖥️ `/src/components/`
  * `AuthPage.tsx` — Login, ro'yxatdan o'tish va Google OAuth Admin emulyatori.
  * `UserDashboard.tsx` — Shaxsiy profil paneli, fanlarni tanlash rejimi, imtihon ko'rsatgichlar tahlili hamda reyting peshqadamlar jadvali.
  * `QuizEngine.tsx` — Test sinovlari jarayoni (Quizizz interaktiv vaqt o'lchov datchiklari, foiz hisoblagich, savollar monitoringi).
  * `AdminPanel.tsx` — Fanlar boshqaruvi, savollar qo'shish, Bulk import qilish tahrirlovchisi va Telegram konfiguratsiyalari.
  * `AdminEmulatorConsole.tsx` — Supabase SQL terminali va Backup nusxa olish tizimi.
  * `Certificate.tsx` — Imtihondan o'tgan o'quvchilarga avtomatik ravishda PDF/Rasm formatida yuklab olinadigan QR-kodli, milliy muhrli ramziy sertifikat generatori.
  * `ContactView.tsx` — Telegram bilan bog'langan, foydalanuvchilar doimiy xabar yuborishi mumkin bo'lgan aloqa sahifasi.

---

## 💎 Muhim Xususiyatlari:

* **Sinxronizatsiya:** Vercelda deploy qilganingizda ham barcha ma'lumotlar xavfsiz ravishda xrom yoki har qanday brauzerning mahalliy saqlash omborida saqlanadi, qayta yuklanganda yo'qolib ketmaydi.
* **Responsive:** Barcha o'lchamdagi mobil telefonlar, planshetlar va noutbuklarga 100% moslashgan (Fully Adaptive responsive design).
* **High Performance:** Vercel CDN orqali loyiha juda tez, silliq va ishonchli yuklanadi.
