/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Telegraf } from 'telegraf';
import { initializeApp as initFirebaseApp } from 'firebase/app';
import { getFirestore as initFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data-store.json");

// Initialize Firebase in server side
let firestoreDb: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const firebaseApp = initFirebaseApp(firebaseConfig);
    firestoreDb = initFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase Firestore initialized in backend server correctly.");
  } else {
    console.warn("firebase-applet-config.json not found on server startup.");
  }
} catch (e) {
  console.error("Firebase initialization failed in server.ts:", e);
}

// Map for keeping conversational registration states
const registrationStates = new Map<number, { step: string }>();

// Define bot setup
let bot: Telegraf | null = null;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://test-platforma-v1.vercel.app/';

if (BOT_TOKEN) {
  bot = new Telegraf(BOT_TOKEN);
  
  bot.start(async (ctx) => {
    const payload = ctx.payload;
    const tgId = String(ctx.from.id);
    const tgUsername = ctx.from.username || '';

    // 1. Deep linking for account auto-linking: ?start=link_userId
    if (payload && payload.startsWith('link_')) {
      const userId = payload.replace('link_', '');
      try {
        if (firestoreDb) {
          const docRef = doc(firestoreDb, 'profiles', userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profileData = docSnap.data();
            await updateDoc(docRef, {
              telegramId: tgId,
              telegramUsername: tgUsername
            });
            ctx.reply(
              `🎉 <b>Muvaffaqiyatli bog'landi!</b>\n\nHurmatli <b>${profileData.fullName}</b>, sizning hisobingiz ushbu Telegram botga muvaffaqiyatli integratsiya qilindi.\n\nEndi imtihon duellari va yangi test natijalari tahlilini to'g'ridan-to'g'ri shu bot orqali qabul qilasiz!`,
              {
                parse_mode: 'HTML',
                reply_markup: {
                  keyboard: [
                    [{ text: '📱 Mini App ni ochish' }],
                    [{ text: '👤 Ro\'yxatdan o\'tish' }, { text: 'ℹ️ Yordam' }]
                  ],
                  resize_keyboard: true
                }
              }
            );
          } else {
            ctx.reply(`❌ Foydalanuvchi topilmadi. Hisob ID ko'rsatkichi noto'g'ri.`);
          }
        } else {
          ctx.reply(`❌ Tizimda xatolik: Ma'lumotlar bazasi ulanmagan.`);
        }
      } catch (err: any) {
        console.error("Link account error:", err);
        ctx.reply(`❌ Ulanishda xatolik: ${err.message}`);
      }
      return;
    }

    // 1b. Deep linking for Duel auto-register or entry: ?start=duel_CODE
    if (payload && payload.startsWith('duel_')) {
      const duelCode = payload.replace('duel_', '');
      try {
        if (firestoreDb) {
          // Check if this user already exists under this telegramId
          const q = query(collection(firestoreDb, 'profiles'), where('telegramId', '==', tgId));
          const querySnap = await getDocs(q);
          
          let profile: any = null;
          if (!querySnap.empty) {
            profile = querySnap.docs[0].data();
          }

          if (profile) {
            // User exists! Add them to the duel players list and redirect
            const duelDocRef = doc(firestoreDb, 'duels', duelCode);
            const duelSnap = await getDoc(duelDocRef);
            if (duelSnap.exists()) {
              const duelData = duelSnap.data();
              const players = { ...(duelData.players || {}) };
              if (!players[profile.id] && Object.keys(players).length < 2) {
                players[profile.id] = {
                  userId: profile.id,
                  fullName: profile.fullName,
                  ready: false,
                  score: 0,
                  answersCount: 0,
                  timeSpentSecs: 0,
                  joinedAt: new Date().toISOString(),
                  answers: {}
                };
                await updateDoc(duelDocRef, { players });
              }
            }

            const customAppUrl = MINI_APP_URL.includes('?') 
              ? `${MINI_APP_URL}&duel=${duelCode}` 
              : `${MINI_APP_URL}?duel=${duelCode}`;

            ctx.reply(
              `⚔️ <b>Duel taklifnomasi qabul qilindi!</b>\n\nHurmatli <b>${profile.fullName}</b>, sizni <b>${duelCode}</b> raqamli duelga taklif qilishgan.\n\nSiz allaqachon tizimda ro'yxatdan o'tgansiz! Quyidagi tugmani bosib srazi duel maydoniga kiring.`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '⚔️ Duel maydoniga kirish', web_app: { url: customAppUrl } }]
                  ]
                }
              }
            );
          } else {
            // Non-registered user! Prompt for name in conversational manner
            registrationStates.set(ctx.from.id, { step: `awaiting_fullname_for_duel_${duelCode}` });
            ctx.reply(
              `⚔️ <b>Sizni duelga taklif etishdi!</b>\n\nSiz <b>${duelCode}</b> kodli duelga qo'shilmoqchisiz. Ammo siz hali platformada ro'yxatdan o'tmagansiz.\n\nTizimdan bir zumda ro'yxatdan o'tish uchun iltimos, to'liq <b>Ism va Familiyangizni</b> kiriting (so'ngra bitta tugma bilan duelga kirasiz):`,
              { parse_mode: 'HTML' }
            );
          }
        } else {
          ctx.reply(`❌ Tizimda xatolik: Ma'lumotlar bazasi ulanmagan.`);
        }
      } catch (err: any) {
        console.error("Duel start error:", err);
        ctx.reply(`❌ Bir zumda duelga ulanishda xatolik yuz berdi.`);
      }
      return;
    }

    // 2. Default Start
    ctx.reply(
      `Assalomu alaykum, <b>${ctx.from.first_name}</b>!\n\n🎓 <b>Online Imtihon va Duel Platformasining</b> rasmiy botiga xush kelibsiz!\n\nUshbu bot sizga o'zbek tilida xizmat qiladi. Siz quyidagi qulayliklarga ega bo'lasiz:\n• Fanlar bo'yicha imtihonlar topshirish\n• Do'stlar va raqiblar bilan real-vaqtdagi ⚔️ Duellar\n• Sun'iy intellektga asoslangan 🤖 AI Mentor tahlili\n• Doimiy 🏆 Turnirlar hamda Reyting jadvali\n\n👇 Quyidagi tugmalardan birini bosing:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: '📱 Mini App ni ochish' }],
            [{ text: '👤 Ro\'yxatdan o\'tish' }, { text: 'ℹ️ Yordam' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: false
        }
      }
    );
  });
  
  const getInlineBtn = (label: string) => ({
    reply_markup: {
      inline_keyboard: [
        [{ text: label, web_app: { url: MINI_APP_URL } }]
      ]
    }
  });

  bot.command('profile', (ctx) => {
    ctx.reply(
      `👤 <b>Foydalanuvchi Profili</b>\n\nProfilingiz tafsilotlari, umumiy XP ballaringiz, yutuqlaringiz va hisobingiz parametrlarini ko'rish uchun quyidagi tugmani bosing:`,
      {
        parse_mode: 'HTML',
        ...getInlineBtn('👤 Profilni ochish')
      }
    );
  });

  bot.command('result', (ctx) => {
    ctx.reply(
      `📊 <b>So'nggi test natijasi</b>\n\nSiz topshirgan eng so'nggi test natijasi va uning tahlilini ko'rish uchun quyidagi tugma orqali o'ting:`,
      {
        parse_mode: 'HTML',
        ...getInlineBtn('📊 Natijalarni ko\'rish')
      }
    );
  });

  bot.command('results', (ctx) => {
    ctx.reply(
      `📚 <b>Barcha test natijalari</b>\n\nBarcha ishlangan testlar tarixi, to'g'ri/noto'g'ri javoblar va foiz darajalarini ko'rish uchun quyidagi tugmani bosing:`,
      {
        parse_mode: 'HTML',
        ...getInlineBtn('📚 Imtihonlar tarixi')
      }
    );
  });

  bot.command('ranking', (ctx) => {
    ctx.reply(
      `🏆 <b>Foydalanuvchilar Top Reytingi</b>\n\nEng yuqori natijaga ega bo'lgan top professional foydalanuvchilar reytingi bilan tanishish uchun quyidagi tugmani bosing:`,
      {
        parse_mode: 'HTML',
        ...getInlineBtn('🏆 Reyting jadvali')
      }
    );
  });

  bot.command('leaderboard', (ctx) => {
    ctx.reply(
      `🏆 <b>Foydalanuvchilar Top Reytingi</b>\n\nEng yuqori natijaga ega bo'lgan top professional foydalanuvchilar reytingi bilan tanishish uchun quyidagi tugmani bosing:`,
      {
        parse_mode: 'HTML',
        ...getInlineBtn('🏆 Reyting jadvali')
      }
    );
  });

  bot.command('achievements', (ctx) => {
    ctx.reply(
      `🏅 <b>Sizning yutuqlaringiz</b>\n\nErishilgan unvonlar, haftalik seriyalar va ochilgan barcha medal va sovrinlarni ko'rish uchun bosing:`,
      {
        parse_mode: 'HTML',
        ...getInlineBtn('🏅 Yutuqlarni ko\'rish')
      }
    );
  });

  bot.command('duel', (ctx) => {
    ctx.reply(
      `⚔️ <b>Duellar va Bellashuvlar Maydoni</b>\n\nBoshqa faol ishtirokchilar bilan real-vaqt rejimida bilimingizni sinab ko'ring, ELO reytingingizni oshiring:\n\n🔥 Tezkor matchlar va do'stona chaqiriqlar sizni kutmoqda!`,
      {
        parse_mode: 'HTML',
        ...getInlineBtn('⚔️ Bellashuvga kirish')
      }
    );
  });

  bot.command('help', (ctx) => {
    ctx.reply(
      `ℹ️ <b>Mavjud buyruqlar ro'yxati:</b>\n\n/start - Botni ishga tushirish\n/register - Bot orqali tezkor ro'yxatdan o'tish\n/profile - profilingizni ko'rish\n/result - oxirgi test natijasi\n/results - barcha test natijalari tarixi\n/ranking - top o'quvchilar ro'yxati\n/leaderboard - yetakchilar doskasi\n/achievements - erishilgan yutuqlar\n/duel - duellar maydoni\n/help - yordam xabari\n\n<i>Barcha funksiyalar Mini App-da to'liq integratsiya qilingan.</i>`,
      { parse_mode: 'HTML' }
    );
  });

  // Hears & Registration helpers
  const checkHasAccount = async (tgId: string) => {
    if (!firestoreDb) return null;
    try {
      const q = query(collection(firestoreDb, 'profiles'), where('telegramId', '==', tgId));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        return querySnap.docs[0].data();
      }
    } catch (e) {
      console.error("checkHasAccount error:", e);
    }
    return null;
  };

  const startRegistration = async (ctx: any) => {
    const tgId = String(ctx.from.id);
    const existing = await checkHasAccount(tgId);
    if (existing) {
      ctx.reply(
        `😊 <b>Siz allaqachon ro'yxatdan o'tgansiz!</b>\n\n👤 <b>Profilingiz:</b>\n• F.I.SH: <b>${existing.fullName}</b>\n• Login: <code>${existing.login}</code>\n\nSiz Mini App-ni ochganingizda avtomatik ravishda profilingizga kirib ketasiz!`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📱 Mini App ni ochish', web_app: { url: MINI_APP_URL } }]
            ]
          }
        }
      );
      return;
    }

    registrationStates.set(ctx.from.id, { step: 'awaiting_fullname' });
    ctx.reply(
      `📝 <b>Platformada yangi o'quvchi ro'yxatdan o'tishi</b>\n\nIltimos, to'liq <b>Ism va Familiyangizni</b> kiriting (F.I.SH, masalan: <i>Husniddin Xoldorov</i>):`,
      { parse_mode: 'HTML' }
    );
  };

  bot.command('register', async (ctx) => {
    await startRegistration(ctx);
  });

  bot.hears('👤 Ro\'yxatdan o\'tish', async (ctx) => {
    await startRegistration(ctx);
  });

  bot.hears('📱 Mini App ni ochish', (ctx) => {
    ctx.reply(
      `Siz quyidagi tugma orqali imtihon va duel maydoniga o'tishingiz mumkin. Agar profilingiz bog'langan bo'lsa, tizim sizni avtomatik taniydi!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Mini App ni ochish', web_app: { url: MINI_APP_URL } }]
          ]
        }
      }
    );
  });

  bot.hears('ℹ️ Yordam', (ctx) => {
    ctx.reply(
      `🎓 <b>Online Imtihon va Duel Platformasi</b>\n\nSiz bu yerda turli fanlardan qiziqarli testlar topshirishingiz, do'stlaringiz va tizimdagi boshqa foydalanuvchilar bilan ⚔️ Duellarda bellashib o'z reytingingizni oshirishingiz mumkin!\n\n💡 <b>Mavjud buyruqlar:</b>\n/start - Ishga tushirish\n/register - Ro'yxatdan o'tish\n/profile - Profilni ko'rish\n/help - Yozma yordam olish`,
      { parse_mode: 'HTML' }
    );
  });

  bot.on('text', async (ctx, next) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;
    const state = registrationStates.get(userId);

    // If it is a known command or keyboard trigger, delegate forward
    if (text.startsWith('/') || ['📱 Mini App ni ochish', '👤 Ro\'yxatdan o\'tish', 'ℹ️ Yordam'].includes(text)) {
      return next();
    }

    if (state && state.step.startsWith('awaiting_fullname_for_duel_')) {
      const duelCode = state.step.replace('awaiting_fullname_for_duel_', '');
      if (text.length < 3) {
        ctx.reply("⚠️ Ism-familiyangiz juda qisqa. Iltimos, kamida 3 ta harfdan iborat to'liq ism-familiyangizni yuboring:");
        return;
      }

      registrationStates.delete(userId);
      const generatedPassword = Math.random().toString(36).slice(-6); // 6 random chars
      
      // Sanitized login based on username or ID
      let login = ctx.from.username || `usr_${userId}`;
      login = login.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (login.length < 3) login = `usr_${userId}`;

      const newProfile = {
        id: `usr-tg-${userId}`,
        login: login,
        fullName: text,
        password: generatedPassword,
        email: '',
        phone: '',
        xp: 200, // starting bonus
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        telegramId: String(userId),
        telegramUsername: ctx.from.username || '',
        role: 'student'
      };

      try {
        if (firestoreDb) {
          // 1. Create Profile Document in Firestore
          await setDoc(doc(firestoreDb, 'profiles', newProfile.id), newProfile);
          
          // Welcome notification
          const notifId = `notif-tg-${Date.now()}`;
          await setDoc(doc(firestoreDb, 'notifications', notifId), {
            id: notifId,
            title: "Xush kelibsiz!",
            message: "Telegram bot orqali muvaffaqiyatli ro'yxatdan o'tdingiz va duelga taklif etildingiz!",
            type: "success",
            userId: newProfile.id,
            read: false,
            createdAt: new Date().toISOString()
          });

          // 2. Automatically register user into the duel players map in Firestore
          const duelDocRef = doc(firestoreDb, 'duels', duelCode);
          const duelSnap = await getDoc(duelDocRef);
          if (duelSnap.exists()) {
            const duelData = duelSnap.data();
            const players = { ...(duelData.players || {}) };
            
            // Check if slot available
            if (!players[newProfile.id] && Object.keys(players).length < 2) {
              players[newProfile.id] = {
                userId: newProfile.id,
                fullName: newProfile.fullName,
                ready: false,
                score: 0,
                answersCount: 0,
                timeSpentSecs: 0,
                joinedAt: new Date().toISOString(),
                answers: {}
              };
              await updateDoc(duelDocRef, { players });
            }
          }

          const customAppUrl = MINI_APP_URL.includes('?') 
            ? `${MINI_APP_URL}&duel=${duelCode}` 
            : `${MINI_APP_URL}?duel=${duelCode}`;

          ctx.reply(
            `🎉 <b>Muvaffaqiyatli ro'yxatdan o'tdingiz hamda duelga qo'shildingiz!</b>\n\n📋 <b>Sizning kirish ma'lumotlaringiz:</b>\n• Login: <code>${newProfile.login}</code>\n• Kalit so'z (parol): <code>${generatedPassword}</code>\n• Ism: <b>${newProfile.fullName}</b>\n\n👇 Quyidagi tugmani bosib, <b>srazi duelga kiring!</b> Tizim profilingizni avtomatik taniydi.`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '⚔️ Srazi Duel maydoniga kirish', web_app: { url: customAppUrl } }]
                ]
              }
            }
          );
        } else {
          ctx.reply("❌ Tizim xatosi: Ma'lumotlar bazasi ulanmagan.");
        }
      } catch (err: any) {
        console.error("Bot registration process failed:", err);
        ctx.reply(`❌ Ro'yxatdan o'tishda xatolik yuz berdi: ${err.message}`);
      }
      return;
    }

    if (state && state.step === 'awaiting_fullname') {
      if (text.length < 3) {
        ctx.reply("⚠️ Ism-familiyangiz juda qisqa. Iltimos, kamida 3 ta harfdan iborat to'liq ism-familiyangizni yuboring:");
        return;
      }

      registrationStates.delete(userId);
      const generatedPassword = Math.random().toString(36).slice(-6); // 6 random chars
      
      // Sanitized login based on username or ID
      let login = ctx.from.username || `usr_${userId}`;
      login = login.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (login.length < 3) login = `usr_${userId}`;

      const newProfile = {
        id: `usr-tg-${userId}`,
        login: login,
        fullName: text,
        password: generatedPassword,
        email: '',
        phone: '',
        xp: 200, // starting bonus
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        telegramId: String(userId),
        telegramUsername: ctx.from.username || '',
        role: 'student'
      };

      try {
        if (firestoreDb) {
          await setDoc(doc(firestoreDb, 'profiles', newProfile.id), newProfile);
          
          // Welcome notification
          const notifId = `notif-tg-${Date.now()}`;
          await setDoc(doc(firestoreDb, 'notifications', notifId), {
            id: notifId,
            title: "Xush kelibsiz!",
            message: "Telegram bot orqali muvaffaqiyatli ro'yxatdan o'tdingiz. Tizimdan foydalanishni boshlang!",
            type: "success",
            userId: newProfile.id,
            read: false,
            createdAt: new Date().toISOString()
          });

          ctx.reply(
            `🎉 <b>Muvaffaqiyatli ro'yxatdan o'tdingiz!</b>\n\nPlatformada siz uchun yangi profil yaratildi:\n\n📋 <b>Tizimga kirish ma'lumotlari:</b>\n• Login: <code>${newProfile.login}</code>\n• Maxfiy kalit (parol): <code>${generatedPassword}</code>\n• Ism: <b>${newProfile.fullName}</b>\n\n👇 Quyidagi tugmani bosib, Mini App orqali to'g'ridan-to'g'ri o'yin/testga kiring! Tizim profilingizni avtomatik taniydi.`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                keyboard: [
                  [{ text: '📱 Mini App ni ochish' }],
                  [{ text: '👤 Ro\'yxatdan o\'tish' }, { text: 'ℹ️ Yordam' }]
                ],
                resize_keyboard: true
              }
            }
          );
        } else {
          ctx.reply("❌ Tizim xatosi: Ma'lumotlar bazasi ulanmagan.");
        }
      } catch (err: any) {
        console.error("Bot registration process failed:", err);
        ctx.reply(`❌ Ro'yxatdan o'tishda xatolik yuz berdi: ${err.message}`);
      }
      return;
    }

    return next();
  });
  
  // Start bot non-blocking
  bot.launch().catch(e => console.error("Telegram bot error:", e));
  
  // Enable graceful stop
  process.once('SIGINT', () => bot?.stop('SIGINT'));
  process.once('SIGTERM', () => bot?.stop('SIGTERM'));
}

async function startServer() {
  const app = express();
  
  // Set json size limits for larger batch uploads
  app.use(express.json({ limit: "15mb" }));

  // API Route: GET current server-side database
  app.get("/api/db/data", (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        return res.json({ success: true, data: parsed });
      } else {
        return res.json({ success: true, data: null });
      }
    } catch (error) {
      console.error("Failed to read server DB:", error);
      return res.status(500).json({ success: false, error: "Database reading error" });
    }
  });

  // API Route: POST store synchronized database state
  app.post("/api/db/save", (req, res) => {
    try {
      const { payload } = req.body;
      if (!payload) {
        return res.status(400).json({ success: false, error: "Payload parameters missing" });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), "utf-8");
      return res.json({ success: true });
    } catch (error) {
      console.error("Failed to write server DB:", error);
      return res.status(500).json({ success: false, error: "Database saving error" });
    }
  });

  app.post("/api/telegram/send", async (req, res) => {
    try {
      const { telegramId, message } = req.body;
      if (!telegramId || !message) {
        return res.status(400).json({ success: false, error: "Missing telegramId or message" });
      }
      if (bot) {
        await bot.telegram.sendMessage(telegramId, message, { parse_mode: 'HTML' });
        return res.json({ success: true });
      } else {
        return res.status(500).json({ success: false, error: "Telegram bot is not configured on server" });
      }
    } catch (error: any) {
      console.error("Failed to send telegram message:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/notify", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, error: "Missing message" });
      }
      const adminId = process.env.ADMIN_TELEGRAM_ID || "1654414811";
      if (bot) {
        await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' });
        return res.json({ success: true });
      } else {
        return res.status(500).json({ success: false, error: "Telegram bot is not configured on server" });
      }
    } catch (error: any) {
      console.error("Failed to send admin notification:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/ai/mentor", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: "Ai kaliti sozlanmagan" });
      }
      
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      
      const { results, mistakes } = req.body;

      let prompt = `Sen tajribali o'qituvchi va ustozsan (AI Mentor). O'quvchining quyidagi ma'lumotlarini tahlil qilib unga o'zbek tilida motivatsion va foydali maslahatlar ber.\n\n`;
      prompt += "So'nggi test natijalari: \n" + JSON.stringify(results.map((r: any) => ({ fn: r.subjectName, tr: r.correctAnswers, xt: r.wrongAnswers, foiz: r.percentageScore }))) + "\n\n";
      prompt += "Xato ishlangan savollar ro'yxati: \n" + JSON.stringify(mistakes.map((m: any) => ({ sf: m.subjectName, sv: m.questionText }))) + "\n\n";
      prompt += "Tahlilni quyidagi tartibda ber:\n1. Kuchli tomonlar va yaxshi natijalar haqida motivatsiya.\n2. Qaysi fanlar yoki mavzularda muammolar bo'layotgani haqida xulosa.\n3. Ularni yaxshilash uchun 3-4 ta aniq qadamli maslahat.\nMatn Markdown formatida, ko'rinishi chiroyli bo'lsin.";

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      return res.json({ success: true, text: response.text });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: "Tahlil qilishda xatolik yuz berdi" });
    }
  });

  app.post("/api/ai/mentor/auto", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { telegramId, results, mistakes } = req.body;
      if (!apiKey || !telegramId || !bot) return res.json({ success: false });

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      let prompt = `Sen AI Mentorsan. Dastur foydalanuvchisi oxirgi testini yakunladi. Natijalar: ${JSON.stringify(results.slice(0, 3))} . O'zbek tilida atigi 3 gap bilan tahlil va bitta aniq maslahat yozib ber.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      bot.telegram.sendMessage(telegramId, `🤖 <b>AI Mentor Tahlili</b>\n\n${response.text}`, { parse_mode: 'HTML' }).catch(() => {});
      return res.json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false });
    }
  });

  // Vite development integration or server production files compression
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running synchronized at http://localhost:${PORT}`);
  });
}

startServer();
