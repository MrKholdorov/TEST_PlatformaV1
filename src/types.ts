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
