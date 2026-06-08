/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  id: string;
  login: string;
  password?: string;
  fullName: string; // F.I.SH
  email: string;
  phone: string;
  lastLogin: string;
  createdAt: string;
  xp: number;
  isBlocked?: boolean; // Tizimga kirishni cheklash
  role?: 'admin' | 'moderator' | 'user';
  telegramId?: string;
  telegramUsername?: string;
}

export interface Subject {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  description: string;
  totalQuestions: number;
  lastScore?: number;
  progress: number; // 0 - 100
}

export interface Question {
  id: string;
  subjectId: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface TestSession {
  id: string;
  userId: string;
  subjectId: string;
  testType: 20 | 30 | 50 | 100;
  startedAt: string;
  completedAt?: string;
  score: number;
  isCompleted: boolean;
  timeLeftSeconds: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>; // questionId -> selectedOption
}

export interface TestResult {
  id: string;
  sessionId: string;
  userId: string;
  subjectName: string;
  testType: number;
  correctAnswers: number;
  wrongAnswers: number;
  percentageScore: number;
  completionTimeFormatted: string; // e.g., "14:23"
  completionTimeSeconds: number;
  rankingPosition?: number;
  createdAt: string;
}

export interface Ranking {
  id: string;
  userId: string;
  fullName: string;
  subjectName: string;
  testType: 20 | 30 | 50 | 100;
  score: number;
  percentage: number;
  completionTimeSeconds: number;
  completionTimeFormatted: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  email: string;
  isSuper: boolean;
}

export interface DBNotification {
  id: string;
  userId?: string; // Empty means public system-wide
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'system' | 'success' | 'warning' | 'info';
}

export interface ActivityLog {
  id: string;
  userId: string;
  fullName: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  notificationsEnabled: boolean;
}

export interface Mistake {
  id: string;
  userId: string;
  questionId: string;
  questionText: string;
  subjectId: string;
  subjectName: string;
  options: Record<string, string>;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  selectedAnswer: string;
  createdAt: string;
  isCorrected: boolean;
  timesFailed: number;
}

export interface DuelPlayer {
  userId: string;
  fullName: string;
  ready: boolean;
  score: number;
  answersCount: number;
  timeSpentSecs: number;
  joinedAt: string;
  completedAt?: string;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
}

export interface Duel {
  id: string;
  code: string;
  subjectId: string;
  subjectName: string;
  testType: number;
  status: 'waiting' | 'starting' | 'active' | 'finished';
  players: Record<string, DuelPlayer>;
  questionsCount: number;
  questionIds: string[];
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  winnerId?: string;
  endTime?: string;
}

export interface Achievement {
  id: string;
  userId: string;
  type: string; // e.g., 'first_test', '10_tests', 'accuracy_master'...
  unlockedAt: string;
}

export interface UserStats {
  userId: string;
  totalTests: number;
  totalDuels: number;
  duelWins: number;
  duelLosses: number;
  duelDraws: number;
  duelElo: number; // ELO Rating
  averageScorePercentage: number;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}
