/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Profile, 
  Subject, 
  Question, 
  TestSession, 
  TestResult, 
  Ranking, 
  DBNotification, 
  ActivityLog,
  TelegramConfig
} from '../types';

import { db } from './firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, getDocs, getDoc } from 'firebase/firestore';


// Seed initial subjects
const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-1',
    name: "Ona tili va adabiyot",
    icon: 'BookOpen',
    description: "Grammatika, adabiy asarlar va so'z boyligi bo'yicha testlar.",
    totalQuestions: 25,
    progress: 0
  },
  {
    id: 'subj-2',
    name: "Matematika",
    icon: 'Calculator',
    description: "Algebra, geometriya, mantiqiy misollar va tenglamalar.",
    totalQuestions: 25,
    progress: 0
  },
  {
    id: 'subj-3',
    name: "Tarix",
    icon: 'Compass',
    description: "O'zbekiston va jahon tarixi, muhim voqealar va sanalar.",
    totalQuestions: 25,
    progress: 0
  },
  {
    id: 'subj-4',
    name: "Ingliz tili",
    icon: 'Languages',
    description: "Grammar, Vocabulary, Reading and Listening comprehension.",
    totalQuestions: 25,
    progress: 0
  }
];

// Seed initial questions to provide a fully functional test base
const INITIAL_QUESTIONS: Question[] = [
  // Ona Tili
  {
    id: 'q-ot-1',
    subjectId: 'subj-1',
    questionText: "Fonetika bo'limida nima o'rganiladi?",
    options: {
      A: "Grammatika va tinish belgilari",
      B: "Nutq tovushlari va ularning talaffuzi",
      C: "So'z turkumlari va ularning yasalishi",
      D: "Gap bo'laklari va urg'u"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-ot-2',
    subjectId: 'subj-1',
    questionText: "Asosiy so'z turkumlari nechta?",
    options: {
      A: "6 ta",
      B: "9 ta",
      C: "5 ta",
      D: "8 ta"
    },
    correctAnswer: 'A'
  },
  {
    id: 'q-ot-3',
    subjectId: 'subj-1',
    questionText: "Qaysi qatorda faqat o'zlashma so'zlar berilgan?",
    options: {
      A: "Kitob, daftar, maktab",
      B: "Ona, ota, uka",
      C: "Bug'doy, arpa, non",
      D: "Olov, suv, havo"
    },
    correctAnswer: 'A'
  },
  {
    id: 'q-ot-4',
    subjectId: 'subj-1',
    questionText: "O'zbek tiliga davlat tili maqomi qachon berilgan?",
    options: {
      A: "1989-yil 21-oktabrda",
      B: "1991-yil 31-avgustda",
      C: "1992-yil 8-dekabrda",
      D: "1990-yil 20-iyunda"
    },
    correctAnswer: 'A'
  },
  {
    id: 'q-ot-5',
    subjectId: 'subj-1',
    questionText: "Sinonim so'zlar qatorini toping.",
    options: {
      A: "Katta - kichik",
      B: "Chiroyli - xunuk",
      C: "Go'zal - suluv",
      D: "Baland - past"
    },
    correctAnswer: 'C'
  },
  {
    id: 'q-ot-6',
    subjectId: 'subj-1',
    questionText: "Ravish so'z turkumi qanday so'roqlarga javob bo'ladi?",
    options: {
      A: "Kim? Nima?",
      B: "Qanday? Qay darajada? Qachon?",
      C: "Nechta? Qancha?",
      D: "Nima qildi? Nima qilyapti?"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-ot-7',
    subjectId: 'subj-1',
    questionText: "'Xamsa' asarining muallifi kim?",
    options: {
      A: "Zahiriddin Muhammad Bobur",
      B: "Alisher Navoiy",
      C: "Abdulla Qodiriy",
      D: "Erkin Vohidov"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-ot-8',
    subjectId: 'subj-1',
    questionText: "O'zbek alifbosida nechta unli tovush bor?",
    options: {
      A: "10 ta",
      B: "6 ta",
      C: "5 ta",
      D: "12 ta"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-ot-9',
    subjectId: 'subj-1',
    questionText: "Sifatdosh qaysi qo'shimcha yordamida yasaladi?",
    options: {
      A: "-gan, -digan, -ar",
      B: "-gach, -guncha, -gali",
      C: "-mak, -ish, -uv",
      D: "-ib, -a, -y"
    },
    correctAnswer: 'A'
  },
  {
    id: 'q-ot-10',
    subjectId: 'subj-1',
    questionText: "Birinchi o'zbek romani qaysi va uning muallifi kim?",
    options: {
      A: "'Kecha va kunduz', Cho'lpon",
      B: "'O'tkan kunlar', Abdulla Qodiriy",
      C: "'Mehrobdan chayon', Abdulla Qodiriy",
      D: "'Navoiy', Oybek"
    },
    correctAnswer: 'B'
  },

  // Matematika
  {
    id: 'q-m-1',
    subjectId: 'subj-2',
    questionText: "Agar x + 12 = 35 bo'lsa, x ni toping.",
    options: {
      A: "20",
      B: "23",
      C: "15",
      D: "25"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-m-2',
    subjectId: 'subj-2',
    questionText: "To'g'ri to'rtburchakning bo'yi 8 sm, eni 5 sm. Uning yuzi necha sm kvadrat?",
    options: {
      A: "26 sm kv",
      B: "40 sm kv",
      C: "13 sm kv",
      D: "35 sm kv"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-m-3',
    subjectId: 'subj-2',
    questionText: "Yulduzcha o'rniga qaysi son keladi: 3, 6, 12, 24, *?",
    options: {
      A: "36",
      B: "48",
      C: "30",
      D: "50"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-m-4',
    subjectId: 'subj-2',
    questionText: "Bo'lishni bajaring: 144 : 12.",
    options: {
      A: "11",
      B: "12",
      C: "14",
      D: "10"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-m-5',
    subjectId: 'subj-2',
    questionText: "Tub sonlar qatorini ko'rsating.",
    options: {
      A: "1, 2, 3, 4, 5",
      B: "2, 3, 5, 7, 11",
      C: "4, 6, 8, 9, 10",
      D: "3, 9, 15, 21, 27"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-m-6',
    subjectId: 'subj-2',
    questionText: "Sinfda 30 ta o'quvchi bor. Ularning 60%i qizlar. Sinfda nechta qiz bola bor?",
    options: {
      A: "15 ta",
      B: "18 ta",
      C: "12 ta",
      D: "20 ta"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-m-7',
    subjectId: 'subj-2',
    questionText: "Uchburchak burchaklarining yig'indisi necha gradusga teng?",
    options: {
      A: "90 gradus",
      B: "180 gradus",
      C: "360 gradus",
      D: "270 gradus"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-m-8',
    subjectId: 'subj-2',
    questionText: "Sonning kvadratini toping: 15 kv.",
    options: {
      A: "205",
      B: "225",
      C: "195",
      D: "250"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-m-9',
    subjectId: 'subj-2',
    questionText: "Yig'indini hisoblang: 0.25 + 0.75.",
    options: {
      A: "1.0",
      B: "0.50",
      C: "1.25",
      D: "0.99"
    },
    correctAnswer: 'A'
  },
  {
    id: 'q-m-10',
    subjectId: 'subj-2',
    questionText: "Doiraning radiusi 4 sm bo'lsa, diametri necha sm?",
    options: {
      A: "2 sm",
      B: "8 sm",
      C: "16 sm",
      D: "12 sm"
    },
    correctAnswer: 'B'
  },

  // Tarix
  {
    id: 'q-t-1',
    subjectId: 'subj-3',
    questionText: "Amir Temur qachon va qayerda tug'ilgan?",
    options: {
      A: "1336-yil 9-aprelda Xorazmda",
      B: "1336-yil 9-aprelda Keshda (Shahrisabz)",
      C: "1346-yil 9-aprelda Buxoroda",
      D: "1330-yil 9-aprelda Samarqandda"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-t-2',
    subjectId: 'subj-3',
    questionText: "Buyuk ipak yo'li qaysi davlatlarni bog'lagan?",
    options: {
      A: "Xitoy va O'rta yer dengizi davlatlarini",
      B: "Hindiston va Rossiyani",
      C: "Misr va Gretsiyani",
      D: "Yaponiya va Amerikani"
    },
    correctAnswer: 'A'
  },
  {
    id: 'q-t-3',
    subjectId: 'subj-3',
    questionText: "Mirzo Ulug'bek qaysi sohada jahonshumul kashfiyotlar qilgan?",
    options: {
      A: "Kimyo va tibbiyot",
      B: "Astronomiya va matematika",
      C: "Adabiyot va falsafa",
      D: "Geografiya va biologiya"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-t-4',
    subjectId: 'subj-3',
    questionText: "O'zbekiston Respublikasi Mustaqilligi qachon e'lon qilingan?",
    options: {
      A: "1991-yil 1-sentabrda",
      B: "1991-yil 31-avgustda",
      C: "1992-yil 8-dekabrda",
      D: "1990-yil 20-iyunda"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-t-5',
    subjectId: 'subj-3',
    questionText: "Al-Xorazmiy qaysi ilmiy tushunchaga asos solgan?",
    options: {
      A: "Geometriya",
      B: "Algoritm va Algebra",
      C: "Tibbiyot qonunlari",
      D: "Astronomik jadvallar"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-t-6',
    subjectId: 'subj-3',
    questionText: "Sohibqiron Amir Temur asos solgan davlat qaysi daryolar oralig'ida joylashgan?",
    options: {
      A: "Nil va Furot",
      B: "Amudaryo va Sirdaryo (Movarounnahr)",
      C: "Volga va Dnepr",
      D: "Ganga va Hind"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-t-7',
    subjectId: 'subj-3',
    questionText: "O'zbekiston Respublikasi Konstitutsiyasi qachon qabul qilingan?",
    options: {
      A: "1991-yil 1-sentabr",
      B: "1992-yil 8-dekabr",
      C: "1993-yil 10-dekabr",
      D: "1990-yil 20-iyun"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-t-8',
    subjectId: 'subj-3',
    questionText: "Jaloliddin Manguberdi qaysi davlat hukmdori bo'lgan?",
    options: {
      A: "Qoraxoniylar",
      B: "Xorazmshohlar davlati",
      C: "G'aznaviylar",
      D: "Temuriylar"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-t-9',
    subjectId: 'subj-3',
    questionText: "Qadimgi Turon xalqlarining mifologik va diniy kitobi qaysi?",
    options: {
      A: "Injil",
      B: "Avesto",
      C: "Tavrot",
      D: "Qur'on"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-t-10',
    subjectId: 'subj-3',
    questionText: "Temuriylar renessansi deb ataluvchi yuksalish davri qaysi asrlarga to'g'ri keladi?",
    options: {
      A: "XI-XII asrlar",
      B: "XIV-XV asrlar",
      C: "IX-X asrlar",
      D: "XVII-XVIII asrlar"
    },
    correctAnswer: 'B'
  },

  // Ingliz tili
  {
    id: 'q-i-1',
    subjectId: 'subj-4',
    questionText: "Which of the following is an auxiliary verb?",
    options: {
      A: "Apple",
      B: "Do",
      C: "Quickly",
      D: "Beautiful"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-i-2',
    subjectId: 'subj-4',
    questionText: "Choose the correct pronoun: '___ is my best friend.'",
    options: {
      A: "They",
      B: "She",
      C: "Us",
      D: "Them"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-i-3',
    subjectId: 'subj-4',
    questionText: "Complete: 'If I ___ rich, I would buy a yacht.'",
    options: {
      A: "am",
      B: "were",
      C: "was",
      D: "have been"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-i-4',
    subjectId: 'subj-4',
    questionText: "What is the synonym of 'Quick'?",
    options: {
      A: "Slow",
      B: "Fast",
      C: "Heavy",
      D: "Lazy"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-i-5',
    subjectId: 'subj-4',
    questionText: "Identify the correct verb tense: 'She has been writing for hours.'",
    options: {
      A: "Present Continuous",
      B: "Present Perfect Continuous",
      C: "Past Perfect",
      D: "Simple Future"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-i-6',
    subjectId: 'subj-4',
    questionText: "Complete: 'She went to the store ___ buy some milk.'",
    options: {
      A: "for",
      B: "to",
      C: "at",
      D: "by"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-i-7',
    subjectId: 'subj-4',
    questionText: "What is the antonym of 'Generous'?",
    options: {
      A: "Kind",
      B: "Stingy",
      C: "Polite",
      D: "Rich"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-i-8',
    subjectId: 'subj-4',
    questionText: "Choose the correct spelling:",
    options: {
      A: "Recieve",
      B: "Receive",
      C: "Receve",
      D: "Reciefe"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-i-9',
    subjectId: 'subj-4',
    questionText: "What does 'Break a leg' mean?",
    options: {
      A: "To have an accident",
      B: "Good luck",
      C: "To feel angry",
      D: "To perform badly"
    },
    correctAnswer: 'B'
  },
  {
    id: 'q-i-10',
    subjectId: 'subj-4',
    questionText: "Passive Voice: 'The cat chased the mouse.'",
    options: {
      A: "The mouse was chased by the cat.",
      B: "The mouse is chased by the cat.",
      C: "The cat was chased by the mouse.",
      D: "The mouse is being chased by the cat."
    },
    correctAnswer: 'A'
  }
];

const SEED_QUESTIONS = INITIAL_QUESTIONS;

// Seed initial rankings/leaderboard entries with realistic high-end stats
const SEED_RANKINGS: Ranking[] = [
  // 100 Questions
  { id: 'rk-1', userId: 'usr-1', fullName: "Abdumajid Rahmonov", subjectName: "Matematika", testType: 100, score: 98, percentage: 98, completionTimeSeconds: 4200, completionTimeFormatted: "70:00", updatedAt: "2026-06-05T12:00:00Z" },
  { id: 'rk-2', userId: 'usr-2', fullName: "Zilola To'rayeva", subjectName: "Ona tili va adabiyot", testType: 100, score: 95, percentage: 95, completionTimeSeconds: 4920, completionTimeFormatted: "82:00", updatedAt: "2026-06-06T15:24:00Z" },
  { id: 'rk-3', userId: 'usr-3', fullName: "Jasur Mamadaliyev", subjectName: "Tarix", testType: 100, score: 92, percentage: 92, completionTimeSeconds: 5100, completionTimeFormatted: "85:00", updatedAt: "2026-06-07T09:12:00Z" },
  { id: 'rk-4', userId: 'usr-4', fullName: "Nozima Kamolova", subjectName: "Ingliz tili", testType: 100, score: 90, percentage: 90, completionTimeSeconds: 3800, completionTimeFormatted: "63:20", updatedAt: "2026-06-07T11:45:00Z" },

  // 50 Questions
  { id: 'rk-5', userId: 'usr-1', fullName: "Abdumajid Rahmonov", subjectName: "Matematika", testType: 50, score: 49, percentage: 98, completionTimeSeconds: 1800, completionTimeFormatted: "30:00", updatedAt: "2026-06-05T12:00:00Z" },
  { id: 'rk-6', userId: 'usr-2', fullName: "Zilola To'rayeva", subjectName: "Ona tili va adabiyot", testType: 50, score: 48, percentage: 96, completionTimeSeconds: 2200, completionTimeFormatted: "36:40", updatedAt: "2026-06-06T15:24:00Z" },
  { id: 'rk-7', userId: 'usr-5', fullName: "Doston Xalilov", subjectName: "Matematika", testType: 50, score: 46, percentage: 92, completionTimeSeconds: 2100, completionTimeFormatted: "35:00", updatedAt: "2026-06-06T18:00:00Z" },

  // 30 Questions
  { id: 'rk-8', userId: 'usr-3', fullName: "Jasur Mamadaliyev", subjectName: "Tarix", testType: 30, score: 30, percentage: 100, completionTimeSeconds: 1200, completionTimeFormatted: "20:00", updatedAt: "2026-06-07T09:12:00Z" },
  { id: 'rk-9', userId: 'usr-6', fullName: "Shahlo Ubaydullayeva", subjectName: "Ingliz tili", testType: 30, score: 29, percentage: 96, completionTimeSeconds: 1350, completionTimeFormatted: "22:30", updatedAt: "2026-06-07T14:30:00Z" },
  { id: 'rk-10', userId: 'usr-4', fullName: "Nozima Kamolova", subjectName: "Ingliz tili", testType: 30, score: 27, percentage: 90, completionTimeSeconds: 1100, completionTimeFormatted: "18:20", updatedAt: "2026-06-07T11:45:00Z" },

  // 20 Questions
  { id: 'rk-11', userId: 'usr-2', fullName: "Zilola To'rayeva", subjectName: "Ona tili va adabiyot", testType: 20, score: 20, percentage: 100, completionTimeSeconds: 650, completionTimeFormatted: "10:50", updatedAt: "2026-06-06T15:24:00Z" },
  { id: 'rk-12', userId: 'usr-1', fullName: "Abdumajid Rahmonov", subjectName: "Matematika", testType: 20, score: 19, percentage: 95, completionTimeSeconds: 580, completionTimeFormatted: "09:40", updatedAt: "2026-06-05T12:30:00Z" },
  { id: 'rk-13', userId: 'usr-7', fullName: "Sardorbek Olimov", subjectName: "Tarix", testType: 20, score: 18, percentage: 90, completionTimeSeconds: 710, completionTimeFormatted: "11:50", updatedAt: "2026-06-07T15:15:00Z" },
  { id: 'rk-14', userId: 'usr-8', fullName: "Guli Rustamova", subjectName: "Ona tili va adabiyot", testType: 20, score: 17, percentage: 85, completionTimeSeconds: 820, completionTimeFormatted: "13:40", updatedAt: "2026-06-07T16:05:00Z" }
];

const SEED_PROFILES: Profile[] = [
  { id: 'usr-1', login: 'abdumajid', fullName: "Abdumajid Rahmonov", email: "abdumajid@gmail.com", phone: "+998-90-123-45-67", lastLogin: "2026-06-07T18:00:00Z", createdAt: "2026-05-01T08:00:00Z", xp: 4500 },
  { id: 'usr-2', login: 'zilola', fullName: "Zilola To'rayeva", email: "zilola@gmail.com", phone: "+998-94-456-78-90", lastLogin: "2026-06-07T15:24:00Z", createdAt: "2026-05-10T09:30:00Z", xp: 3800 },
  { id: 'usr-3', login: 'jasur', fullName: "Jasur Mamadaliyev", email: "jasur@gmail.com", phone: "+998-93-789-12-34", lastLogin: "2026-06-07T10:00:00Z", createdAt: "2026-05-12T14:15:00Z", xp: 2900 },
  { id: 'usr-4', login: 'nozima', fullName: "Nozima Kamolova", email: "nozima@gmail.com", phone: "+998-97-234-56-78", lastLogin: "2026-06-07T11:45:00Z", createdAt: "2026-05-15T10:45:00Z", xp: 2700 },
  { id: 'usr-5', login: 'doston', fullName: "Doston Xalilov", email: "doston@gmail.com", phone: "+998-91-345-67-89", lastLogin: "2026-06-06T18:00:00Z", createdAt: "2026-05-20T11:20:00Z", xp: 2100 },
  { id: 'usr-6', login: 'shahlo', fullName: "Shahlo Ubaydullayeva", email: "shahlo@gmail.com", phone: "+998-99-987-65-43", lastLogin: "2026-06-07T14:30:00Z", createdAt: "2026-05-22T16:40:00Z", xp: 1800 },
  { id: 'usr-7', login: 'sardor', fullName: "Sardorbek Olimov", email: "sardor@gmail.com", phone: "+998-90-999-88-77", lastLogin: "2026-06-07T15:15:00Z", createdAt: "2026-05-25T13:00:00Z", xp: 1500 },
  { id: 'usr-8', login: 'guli', fullName: "Guli Rustamova", email: "guli@gmail.com", phone: "+998-95-555-44-33", lastLogin: "2026-06-07T16:05:00Z", createdAt: "2026-05-28T15:50:00Z", xp: 1200 }
];

const SEED_NOTIFICATIONS: DBNotification[] = [
  { id: 'notif-1', title: "Xush kelibsiz!", message: "Online Imtihon va Test Tizimiga xush kelibsiz. Bilimingizni sinab ko'ring va natijalarni yaxshilang!", isRead: false, createdAt: "2026-06-01T10:00:00Z", type: 'system' },
  { id: 'notif-2', title: "Yangi imtihon turi", message: "Tarix fanidan 100 talik super testlar bazasi yangilandi!", isRead: false, createdAt: "2026-06-06T14:00:00Z", type: 'info' },
  { id: 'notif-3', title: "Haftalik Reyting Savashlari", message: "Hafta yakunida eng ko'p ball to'plagan 3 kishiga maxsus sovg'alar topshiriladi.", isRead: true, createdAt: "2026-06-05T09:00:00Z", type: 'warning' }
];

const SEED_LOGS: ActivityLog[] = [
  { id: 'log-1', userId: 'usr-1', fullName: "Abdumajid Rahmonov", action: "Tizimga kirish", details: "Muvaffaqiyatli login qilindi", ipAddress: "195.200.41.67", createdAt: "2026-06-07T18:00:00Z" },
  { id: 'log-2', userId: 'usr-2', fullName: "Zilola To'rayeva", action: "Test yakunladi", details: "Ona tili va adabiyot (20 talik) - Score: 100%", ipAddress: "195.200.41.98", createdAt: "2026-06-06T15:24:00Z" },
  { id: 'log-3', userId: 'usr-3', fullName: "Jasur Mamadaliyev", action: "Yangi ro'yxatdan o'tish", details: "Muvaffaqiyatli hisob ochildi", ipAddress: "84.54.91.135", createdAt: "2026-05-12T14:15:00Z" }
];

const DEFAULT_TG_CONFIG: TelegramConfig = {
  botToken: "7193859345:AAF_829H9XNkd239K3h2_mock_key",
  chatId: "-1002930492039",
  notificationsEnabled: true
};

export class LocalDbService {
  private static initKey(key: string, initialData: any) {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(initialData));
    }
  }

  static initialize() {
    // Migration: Clean existing duplicate questions containing 'q-auto' from previous version
    const currentRaw = localStorage.getItem('otp_questions');
    if (currentRaw) {
      try {
        const list = JSON.parse(currentRaw);
        if (list.some((q: any) => q.id.includes('q-auto'))) {
          const filtered = list.filter((q: any) => !q.id.includes('q-auto'));
          localStorage.setItem('otp_questions', JSON.stringify(filtered));
        }
      } catch (_) {}
    }

    this.initKey('otp_profiles', SEED_PROFILES);
    this.initKey('otp_subjects', INITIAL_SUBJECTS);
    this.initKey('otp_questions', SEED_QUESTIONS);
    this.initKey('otp_sessions', []);
    this.initKey('otp_results', []);
    this.initKey('otp_rankings', SEED_RANKINGS);
    this.initKey('otp_notifications', SEED_NOTIFICATIONS);
    this.initKey('otp_activity_logs', SEED_LOGS);
    this.initKey('otp_telegram_config', DEFAULT_TG_CONFIG);
    this.initKey('otp_mistakes', []);
    this.initKey('otp_achievements', []);
    this.initKey('otp_user_stats', []);
    this.initKey('otp_duels', []);
  }

  // Generic Getters
  private static get<T>(key: string): T[] {
    this.initialize();
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private static set(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  static getPayload() {
    return {
      otp_profiles: localStorage.getItem('otp_profiles') ? JSON.parse(localStorage.getItem('otp_profiles')!) : [],
      otp_subjects: localStorage.getItem('otp_subjects') ? JSON.parse(localStorage.getItem('otp_subjects')!) : [],
      otp_questions: localStorage.getItem('otp_questions') ? JSON.parse(localStorage.getItem('otp_questions')!) : [],
      otp_sessions: localStorage.getItem('otp_sessions') ? JSON.parse(localStorage.getItem('otp_sessions')!) : [],
      otp_results: localStorage.getItem('otp_results') ? JSON.parse(localStorage.getItem('otp_results')!) : [],
      otp_rankings: localStorage.getItem('otp_rankings') ? JSON.parse(localStorage.getItem('otp_rankings')!) : [],
      otp_notifications: localStorage.getItem('otp_notifications') ? JSON.parse(localStorage.getItem('otp_notifications')!) : [],
      otp_activity_logs: localStorage.getItem('otp_activity_logs') ? JSON.parse(localStorage.getItem('otp_activity_logs')!) : [],
      otp_telegram_config: localStorage.getItem('otp_telegram_config') ? JSON.parse(localStorage.getItem('otp_telegram_config')!) : {},
      otp_mistakes: localStorage.getItem('otp_mistakes') ? JSON.parse(localStorage.getItem('otp_mistakes')!) : [],
      otp_achievements: localStorage.getItem('otp_achievements') ? JSON.parse(localStorage.getItem('otp_achievements')!) : [],
      otp_user_stats: localStorage.getItem('otp_user_stats') ? JSON.parse(localStorage.getItem('otp_user_stats')!) : [],
      otp_duels: localStorage.getItem('otp_duels') ? JSON.parse(localStorage.getItem('otp_duels')!) : []
    };
  }

  static async syncWithBackend(): Promise<void> {
    if ((window as any).__firebaseSynced) return;
    (window as any).__firebaseSynced = true;

    try {
      // Check if DB has been seeded already
      const configDocRef = doc(db, 'config', 'setup');
      const configSnap = await getDoc(configDocRef);
      if (!configSnap.exists()) {
        console.log("Firestore is empty, seeding with initial local data...");
        const payload = this.getPayload();
        
        const pushBatch = async (items: any[], colName: string) => {
          for (const item of items) {
             if (item && item.id) await setDoc(doc(db, colName, item.id), item);
          }
        };
        
        await pushBatch(payload.otp_profiles, 'profiles');
        await pushBatch(payload.otp_subjects, 'subjects');
        await pushBatch(payload.otp_questions, 'questions');
        await pushBatch(payload.otp_sessions, 'sessions');
        await pushBatch(payload.otp_results, 'results');
        await pushBatch(payload.otp_rankings, 'rankings');
        await pushBatch(payload.otp_notifications, 'notifications');
        await pushBatch(payload.otp_activity_logs, 'activity_logs');
        await pushBatch(payload.otp_mistakes, 'mistakes');
        await pushBatch(payload.otp_achievements, 'achievements');
        await pushBatch(payload.otp_user_stats, 'user_stats');
        await pushBatch(payload.otp_duels, 'duels');
        await setDoc(doc(db, 'config', 'telegram'), payload.otp_telegram_config);

        // Mark database as seeded config
        await setDoc(configDocRef, { seeded: true, createdAt: new Date().toISOString() });
      }
    } catch (e) {
      console.warn("Failed to seed Firebase initial data:", e);
    }

    // Set up realtime sync
    const collectionsMap = [
      { key: 'otp_profiles', name: 'profiles' },
      { key: 'otp_subjects', name: 'subjects' },
      { key: 'otp_questions', name: 'questions' },
      { key: 'otp_sessions', name: 'sessions' },
      { key: 'otp_results', name: 'results' },
      { key: 'otp_rankings', name: 'rankings' },
      { key: 'otp_notifications', name: 'notifications' },
      { key: 'otp_activity_logs', name: 'activity_logs' },
      { key: 'otp_mistakes', name: 'mistakes' },
      { key: 'otp_achievements', name: 'achievements' },
      { key: 'otp_user_stats', name: 'user_stats' },
      { key: 'otp_duels', name: 'duels' }
    ];

    collectionsMap.forEach(col => {
      onSnapshot(collection(db, col.name), (snapshot) => {
        const items = snapshot.docs.map(d => d.data());
        localStorage.setItem(col.key, JSON.stringify(items));
        window.dispatchEvent(new Event('db_synced'));
      });
    });

    onSnapshot(doc(db, 'config', 'telegram'), (docSnap) => {
      if (docSnap.exists()) {
        localStorage.setItem('otp_telegram_config', JSON.stringify(docSnap.data()));
        window.dispatchEvent(new Event('db_synced'));
      }
    });
  }

  // Profiles
  static getProfiles(): Profile[] {
    return this.get<Profile>('otp_profiles');
  }

  static deleteProfile(id: string): void {
    const profiles = this.getProfiles();
    this.set('otp_profiles', profiles.filter(p => p.id !== id));
  }

  static saveProfile(profile: Profile): void {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    this.set('otp_profiles', profiles);
    setDoc(doc(db, 'profiles', profile.id), profile).catch(e => console.warn(e));
  }

  // Subjects
  static getSubjects(): Subject[] {
    return this.get<Subject>('otp_subjects');
  }

  static saveSubject(subject: Subject): void {
    const subjects = this.getSubjects();
    const index = subjects.findIndex(s => s.id === subject.id);
    if (index >= 0) {
      subjects[index] = subject;
    } else {
      subjects.push(subject);
    }
    this.set('otp_subjects', subjects);
    setDoc(doc(db, 'subjects', subject.id), subject).catch(e => console.warn(e));
    this.sendTelegramNotification(`📚 Yangi fan qo'shildi!\nFan nomi: ${subject.name}\nSavollar soni: ${subject.totalQuestions}`);
  }

  static deleteSubject(id: string): void {
    const subjects = this.getSubjects().filter(s => s.id !== id);
    this.set('otp_subjects', subjects);
    deleteDoc(doc(db, 'subjects', id)).catch(e => console.warn(e));
    
    // Also delete associated questions
    const questions = this.getQuestions();
    const remaining = questions.filter(q => q.subjectId !== id);
    const deletedQ = questions.filter(q => q.subjectId === id);
    this.set('otp_questions', remaining);
    deletedQ.forEach(q => {
      deleteDoc(doc(db, 'questions', q.id)).catch(e => console.warn(e));
    });
  }

  // Questions
  static getQuestions(): Question[] {
    return this.get<Question>('otp_questions');
  }

  static saveQuestion(question: Question): void {
    const questions = this.getQuestions();
    const index = questions.findIndex(q => q.id === question.id);
    if (index >= 0) {
      questions[index] = question;
    } else {
      questions.push(question);
    }
    this.set('otp_questions', questions);
    setDoc(doc(db, 'questions', question.id), question).catch(e => console.warn(e));

    // Update subject total question count
    this.updateSubjectCount(question.subjectId);
  }

  static deleteQuestion(id: string): void {
    const questions = this.getQuestions();
    const q = questions.find(item => item.id === id);
    const updated = questions.filter(item => item.id !== id);
    this.set('otp_questions', updated);
    deleteDoc(doc(db, 'questions', id)).catch(e => console.warn(e));
    if (q) {
      this.updateSubjectCount(q.subjectId);
    }
  }

  private static updateSubjectCount(subjectId: string) {
    const count = this.getQuestions().filter(q => q.subjectId === subjectId).length;
    const subjects = this.getSubjects();
    const idx = subjects.findIndex(s => s.id === subjectId);
    if (idx >= 0) {
      subjects[idx].totalQuestions = count;
      this.set('otp_subjects', subjects);
      setDoc(doc(db, 'subjects', subjectId), subjects[idx]).catch(e => console.warn(e));
    }
  }

  // Test Sessions
  static getSessions(): TestSession[] {
    return this.get<TestSession>('otp_sessions');
  }

  static saveSession(session: TestSession): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    this.set('otp_sessions', sessions);
    setDoc(doc(db, 'sessions', session.id), session).catch(e => console.warn(e));
  }

  static getActiveSession(userId: string): TestSession | undefined {
    return this.getSessions().find(s => s.userId === userId && !s.isCompleted);
  }

  // Test Results
  static getResults(): TestResult[] {
    return this.get<TestResult>('otp_results');
  }

  static saveResult(result: TestResult): void {
    const results = this.getResults();
    results.push(result);
    this.set('otp_results', results);
    setDoc(doc(db, 'results', result.id), result).catch(e => console.warn(e));

    // Enter into activities log
    const user = this.getProfiles().find(p => p.id === result.userId);
    if (user) {
      this.addLog(
        user.id,
        user.fullName,
        "Imtihon topshirildi",
        `Fan: ${result.subjectName}, Test: ${result.testType} talik, Natija: ${result.percentageScore}% (${result.correctAnswers}/${result.testType})`
      );

      // Add to high score ranking
      this.updateRankings(user.id, user.fullName, result);
    }
  }

  private static updateRankings(userId: string, fullName: string, result: TestResult) {
    const rankings = this.get<Ranking>('otp_rankings');
    // Check if user has a higher ranking for this specific subject and test type
    const existingIdx = rankings.findIndex(r => 
      r.userId === userId && 
      r.subjectName === result.subjectName && 
      r.testType === result.testType
    );

    const score = result.correctAnswers;
    const isNewHigh = existingIdx === -1 || rankings[existingIdx].score < score || (rankings[existingIdx].score === score && rankings[existingIdx].completionTimeSeconds > result.completionTimeSeconds);

    if (isNewHigh) {
      const entry: Ranking = {
        id: `rk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId,
        fullName,
        subjectName: result.subjectName,
        testType: result.testType as any,
        score,
        percentage: result.percentageScore,
        completionTimeSeconds: result.completionTimeSeconds,
        completionTimeFormatted: result.completionTimeFormatted,
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        rankings[existingIdx] = entry;
      } else {
        rankings.push(entry);
      }

      this.set('otp_rankings', rankings);
      setDoc(doc(db, 'rankings', entry.id), entry).catch(e => console.warn(e));

      // If achievement of high score, trigger Telegram notification!
      if (result.percentageScore >= 90) {
        this.sendTelegramNotification(
          `🏆 YANGI YUQORI NATIJA!\n👤 O'quvchi: ${fullName}\n📚 Fan: ${result.subjectName}\n📊 Test turi: ${result.testType} talik\n✅ Natija: ${result.percentageScore}%\n⏱️ Vaqt: ${result.completionTimeFormatted}`
        );
      }
    }
  }

  static getRankings(): Ranking[] {
    return this.get<Ranking>('otp_rankings');
  }

  // Notifications
  static getNotifications(userId?: string): DBNotification[] {
    const all = this.get<DBNotification>('otp_notifications');
    if (!userId) return all;
    return all.filter(n => !n.userId || n.userId === userId);
  }

  static addNotification(title: string, message: string, type: 'system' | 'success' | 'warning' | 'info' = 'system', userId?: string) {
    const list = this.get<DBNotification>('otp_notifications');
    const item: DBNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      type
    };
    list.unshift(item);
    this.set('otp_notifications', list);
    setDoc(doc(db, 'notifications', item.id), item).catch(e => console.warn(e));
  }

  static markNotificationsRead(userId?: string) {
    const list = this.get<DBNotification>('otp_notifications');
    const updated = list.map(n => {
      if (!userId || n.userId === userId) {
        const changed = { ...n, isRead: true };
        setDoc(doc(db, 'notifications', n.id), changed).catch(e => console.warn(e));
        return changed;
      }
      return n;
    });
    this.set('otp_notifications', updated);
  }

  static markSingleNotificationRead(notifId: string) {
    const list = this.get<DBNotification>('otp_notifications');
    const updated = list.map(n => {
      if (n.id === notifId) {
        const changed = { ...n, isRead: true };
        setDoc(doc(db, 'notifications', n.id), changed).catch(e => console.warn(e));
        return changed;
      }
      return n;
    });
    this.set('otp_notifications', updated);
  }

  // Logs
  static getLogs(): ActivityLog[] {
    return this.get<ActivityLog>('otp_activity_logs');
  }

  static addLog(userId: string, fullName: string, action: string, details: string) {
    const logs = this.getLogs();
    const item: ActivityLog = {
      id: `log-${Date.now()}`,
      userId,
      fullName,
      action,
      details,
      ipAddress: "195.158." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255),
      createdAt: new Date().toISOString()
    };
    logs.unshift(item);
    
    // We update local limit to 100
    this.set('otp_activity_logs', logs.slice(0, 100));
    setDoc(doc(db, 'activity_logs', item.id), item).catch(e => console.warn(e));
  }

  // ---- MISTAKES ----
  static getMistakes(userId?: string): any[] {
    const all = this.get<any>('otp_mistakes');
    return userId ? all.filter(m => m.userId === userId) : all;
  }

  static saveMistake(mistake: any): void {
    const items = this.get<any>('otp_mistakes');
    const idx = items.findIndex(m => m.id === mistake.id || (m.userId === mistake.userId && m.questionId === mistake.questionId));
    if (idx >= 0) {
      mistake.timesFailed = (items[idx].timesFailed || 1) + 1;
      mistake.id = items[idx].id;
      items[idx] = mistake;
    } else {
      mistake.timesFailed = 1;
      mistake.id = mistake.id || `mistake-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
      items.push(mistake);
    }
    this.set('otp_mistakes', items);
    setDoc(doc(db, 'mistakes', mistake.id), mistake).catch(e => console.warn(e));
  }

  static deleteMistake(id: string): void {
    const items = this.get<any>('otp_mistakes').filter(m => m.id !== id);
    this.set('otp_mistakes', items);
    deleteDoc(doc(db, 'mistakes', id)).catch(e => console.warn(e));
  }

  // ---- ACHIEVEMENTS ----
  static getAchievements(userId?: string): any[] {
    const all = this.get<any>('otp_achievements');
    return userId ? all.filter(a => a.userId === userId) : all;
  }

  static saveAchievement(achievement: any): void {
    const items = this.get<any>('otp_achievements');
    const existing = items.find(a => a.userId === achievement.userId && a.type === achievement.type);
    if (!existing) {
      items.push(achievement);
      this.set('otp_achievements', items);
      setDoc(doc(db, 'achievements', achievement.id), achievement).catch(e => console.warn(e));
    }
  }

  // ---- USER STATS ----
  static getUserStats(userId: string): any {
    const stats = this.get<any>('otp_user_stats').find(s => s.userId === userId);
    return stats || {
      userId,
      totalTests: 0,
      totalDuels: 0,
      duelWins: 0,
      duelLosses: 0,
      duelDraws: 0,
      duelElo: 1000,
      averageScorePercentage: 0
    };
  }

  static saveUserStats(stats: any): void {
    const items = this.get<any>('otp_user_stats');
    const idx = items.findIndex(s => s.userId === stats.userId);
    if (idx >= 0) {
      items[idx] = stats;
    } else {
      items.push(stats);
    }
    this.set('otp_user_stats', items);
    setDoc(doc(db, 'user_stats', stats.userId), stats).catch(e => console.warn(e));
  }

  // ---- DUELS ----
  static getDuels(): any[] {
    return this.get<any>('otp_duels');
  }

  static getDuel(id: string): any {
    return this.getDuels().find(d => d.id === id || d.code === id);
  }

  static saveDuel(duel: any): void {
    const items = this.getDuels();
    const idx = items.findIndex(d => d.id === duel.id);
    if (idx >= 0) {
      items[idx] = duel;
    } else {
      items.push(duel);
    }
    this.set('otp_duels', items);
    setDoc(doc(db, 'duels', duel.id), duel).catch(e => console.warn(e));
  }

  // Telegram Configuration
  static getTelegramConfig(): TelegramConfig {
    this.initialize();
    const data = localStorage.getItem('otp_telegram_config');
    return data ? JSON.parse(data) : DEFAULT_TG_CONFIG;
  }

  static saveTelegramConfig(cfg: TelegramConfig) {
    this.set('otp_telegram_config', cfg);
    setDoc(doc(db, 'config', 'telegram'), cfg).catch(e => console.warn(e));
  }

  static sendTelegramNotification(text: string) {
    const cfg = this.getTelegramConfig();
    if (!cfg.notificationsEnabled) return;
    
    console.log(`[TELEGRAM NOTIFICATION SENT] to ${cfg.chatId}: ${text}`);
    
    // We can run a real fetch if they have set up a real token-chatId, but we protect against crashes
    if (cfg.botToken && cfg.chatId && !cfg.botToken.includes('mock')) {
      fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          text: `🔔 *Online Imtihon Platform*\n\n${text}`,
          parse_mode: 'Markdown'
        })
      }).catch(e => console.warn("Telegram API direct push failed (expected in sandboxes):", e));
    }
  }

  // Parser of bulk questions
  static bulkImportQuestions(subjectId: string, text: string): { imported: number; duplicates: number; errors: number } {
    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    const existingQuestions = this.getQuestions();

    // Splitting by custom question formats:
    // Support Format 1:
    // Question text
    // A) Opt1
    // B) Opt2
    // C) Opt3
    // D) Opt4
    // Answer: A
    //
    // Support Format 2:
    // separated by "++++"
    //
    // Support Format 3:
    // Correct option marked with "#" (e.g., A# OptA or A) #OptA or even just #A) )
    
    // Let's implement an extremely robust line-by-line parser.
    if (text.includes('++++')) {
      const fragments = text.split('++++');
      fragments.forEach(frag => {
        const cleanFrag = frag.trim();
        if (!cleanFrag) return;

        const lines = cleanFrag.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 5) {
          errors++;
          return;
        }

        const questionText = lines[0];
        let correct: 'A' | 'B' | 'C' | 'D' = 'A';
        const options: Record<string, string> = { A: '', B: '', C: '', D: '' };

        // Parse remaining lines
        let optLines = lines.slice(1);
        let optIndex = 0;
        const keys = ['A', 'B', 'C', 'D'];

        optLines.forEach(line => {
          // Check if correct mark '#' exists
          const isCorrectMark = line.includes('#');
          const stripped = line.replace('#', '').trim();
          
          // Match A), B) prefix or extract
          const prefixMatch = stripped.match(/^([A-D])[\)\.]?\s*(.*)/i);
          let itemKey = keys[optIndex] || 'A';
          let itemText = stripped;

          if (prefixMatch) {
            itemKey = prefixMatch[1].toUpperCase();
            itemText = prefixMatch[2].trim();
          }

          if (itemKey in options) {
            options[itemKey] = itemText;
          }

          if (isCorrectMark) {
            correct = itemKey as any;
          }

          optIndex++;
        });

        // If no hash answer, search for "Answer: X" in any line of fragment
        const ansLine = lines.find(l => l.toLowerCase().startsWith('javob:') || l.toLowerCase().startsWith('answer:') || l.toLowerCase().startsWith('to’g’ri javob:'));
        if (ansLine) {
          const match = ansLine.match(/[A-D]/i);
          if (match) {
            correct = match[0].toUpperCase() as any;
          }
        }

        // Check duplicates
        const isDup = existingQuestions.some(q => q.subjectId === subjectId && q.questionText.toLowerCase() === questionText.toLowerCase());
        if (isDup) {
          duplicates++;
          return;
        }

        // Verify valid options
        if (!options.A || !options.B) {
          errors++;
          return;
        }

        // Fill remaining empty options with placeholders to avoid breaks
        if (!options.C) options.C = "Boshqa variant";
        if (!options.D) options.D = "Noto'g'ri javob";

        this.saveQuestion({
          id: `q-b-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          subjectId,
          questionText,
          options: options as any,
          correctAnswer: correct
        });
        imported++;
      });
    } else {
      // Line-by-line format parsing
      // Parse questions starting with numeric indices (e.g., "1. Question Text" or just plain blocks)
      const lines = text.split('\n').map(l => l.trim());
      let index = 0;

      while (index < lines.length) {
        if (!lines[index]) {
          index++;
          continue;
        }

        const qText = lines[index];
        index++;

        // Fetch options
        const opts: Record<string, string> = { A: '', B: '', C: '', D: '' };
        let optFound = 0;
        let correct: 'A' | 'B' | 'C' | 'D' = 'A';

        while (index < lines.length && optFound < 4) {
          const optLine = lines[index];
          if (!optLine) {
            index++;
            continue;
          }

          // If it matches a new question, or answer line, break
          if (optLine.toLowerCase().startsWith('javob:') || optLine.toLowerCase().startsWith('answer:') || /^\d+[\.\)]/.test(optLine)) {
            break;
          }

          const cleanOpt = optLine.replace('#', '').trim();
          const matchOpt = cleanOpt.match(/^([A-D])[\)\.]?\s*(.*)/i);
          
          let optLetter = ['A', 'B', 'C', 'D'][optFound];
          let optVal = cleanOpt;

          if (matchOpt) {
            optLetter = matchOpt[1].toUpperCase();
            optVal = matchOpt[2].trim();
          }

          opts[optLetter] = optVal;
          if (optLine.includes('#')) {
            correct = optLetter as any;
          }
          optFound++;
          index++;
        }

        // Check for separate Answer line
        if (index < lines.length && (lines[index].toLowerCase().startsWith('javob:') || lines[index].toLowerCase().startsWith('answer:'))) {
          const match = lines[index].match(/[A-D]/i);
          if (match) {
            correct = match[0].toUpperCase() as any;
          }
          index++;
        }

        if (qText && opts.A && opts.B) {
          if (!opts.C) opts.C = "Sinov varianti C";
          if (!opts.D) opts.D = "Sinov varianti D";

          const isDup = existingQuestions.some(q => q.subjectId === subjectId && q.questionText.toLowerCase() === qText.toLowerCase());
          if (isDup) {
            duplicates++;
          } else {
            this.saveQuestion({
              id: `q-b-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              subjectId,
              questionText: qText,
              options: opts as any,
              correctAnswer: correct
            });
            imported++;
          }
        } else {
          errors++;
        }
      }
    }

    return { imported, duplicates, errors };
  }

  static async clearDemoData(): Promise<void> {
    const demoProfiles = ['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-6', 'usr-7', 'usr-8'];
    const demoSubjects = ['subj-1', 'subj-2', 'subj-3', 'subj-4'];
    const demoRankings = ['rk-1', 'rk-2', 'rk-3', 'rk-4', 'rk-5', 'rk-6', 'rk-7', 'rk-8', 'rk-9', 'rk-10', 'rk-11', 'rk-12', 'rk-13', 'rk-14'];
    const demoNotifs = ['notif-1', 'notif-2', 'notif-3'];
    const demoLogs = ['log-1', 'log-2', 'log-3'];

    // Delete demo profiles
    for (const id of demoProfiles) {
      await deleteDoc(doc(db, 'profiles', id)).catch(e => console.warn(e));
    }
    // Delete demo subjects
    for (const id of demoSubjects) {
      await deleteDoc(doc(db, 'subjects', id)).catch(e => console.warn(e));
    }
    // Delete demo rankings
    for (const id of demoRankings) {
      await deleteDoc(doc(db, 'rankings', id)).catch(e => console.warn(e));
    }
    // Delete demo notifications
    for (const id of demoNotifs) {
      await deleteDoc(doc(db, 'notifications', id)).catch(e => console.warn(e));
    }
    // Delete demo logs
    for (const id of demoLogs) {
      await deleteDoc(doc(db, 'activity_logs', id)).catch(e => console.warn(e));
    }

    // Now delete all questions associated with demo subjects or starting with 'q-i-'
    const questions = this.getQuestions();
    const demoQuestions = questions.filter(q => demoSubjects.includes(q.subjectId) || q.id.startsWith('q-i-'));
    for (const q of demoQuestions) {
      await deleteDoc(doc(db, 'questions', q.id)).catch(e => console.warn(e));
    }

    console.log("Demo data successfully deleted from Firebase Firestore.");
  }

  static clearUserResults(userId: string): void {
    const results = this.getResults().filter(r => r.userId !== userId);
    this.set('otp_results', results);
  }

  static clearUserMistakes(userId: string): void {
    const mistakes = this.getMistakes().filter(m => m.userId !== userId);
    this.set('otp_mistakes', mistakes);
  }
}
