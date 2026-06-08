/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Telegraf } from 'telegraf';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data-store.json");

// Define bot setup
let bot: Telegraf | null = null;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://test-platforma-v1.vercel.app/';

if (BOT_TOKEN) {
  bot = new Telegraf(BOT_TOKEN);
  
  bot.start((ctx) => {
    ctx.reply(
      `Assalomu alaykum, <b>${ctx.from.first_name}</b>!\n\n🎓 <b>Online Imtihon va Duel Platformasining</b> rasmiy botiga xush kelibsiz!\n\nUshbu bot sizga o'zbek tilida xizmat qiladi. Siz quyidagi qulayliklarga ega bo'lasiz:\n• Fanlar bo'yicha imtihonlar topshirish\n• Do'stlar va raqiblar bilan real-vaqtdagi ⚔️ Duellar\n• Sun'iy intellektga asoslangan 🤖 AI Mentor tahlili\n• Doimiy 🏆 Turnirlar hamda Reyting jadvali\n\n👇 Quyidagi tugmani bosing va o'yinni boshlang!`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Mini App ni ochish', web_app: { url: MINI_APP_URL } }]
          ]
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
      `ℹ️ <b>Mavjud buyruqlar ro'yxati:</b>\n\n/start - Botni ishga tushirish\n/profile - profilingizni ko'rish\n/result - oxirgi test natijasi\n/results - barcha test natijalari tarixi\n/ranking - top o'quvchilar ro'yxati\n/leaderboard - yetakchilar doskasi\n/achievements - erishilgan yutuqlar\n/duel - duellar maydoni\n/help - yordam xabari\n\n<i>Barcha funksiyalar Mini App-da to'liq integratsiya qilingan.</i>`,
      { parse_mode: 'HTML' }
    );
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
