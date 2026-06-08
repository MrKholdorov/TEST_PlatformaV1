import { Mistake, Achievement, UserStats, Question, TestSession, TestResult } from '../types';
import { LocalDbService } from '../db/localDb';

export function evaluateMistakes(session: TestSession, questions: Question[]) {
  const mistakes: Mistake[] = [];
  
  questions.forEach(q => {
    const selected = session.answers[q.id];
    if (selected && selected !== q.correctAnswer) {
      mistakes.push({
        id: `mistake-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: session.userId,
        questionId: q.id,
        questionText: q.questionText,
        subjectId: q.subjectId,
        subjectName: LocalDbService.getSubjects().find(s => s.id === q.subjectId)?.name || 'Unknown',
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: selected,
        createdAt: new Date().toISOString(),
        isCorrected: false,
        timesFailed: 1
      });
    }
  });

  return mistakes;
}

export function updateUserStats(userId: string, isDuel: boolean, isDuelWin: boolean, isDuelDraw: boolean, scorePercentage: number) {
  const stats = LocalDbService.getUserStats(userId);
  
  stats.totalTests += 1;
  const historicTotalScore = (stats.averageScorePercentage * (stats.totalTests - 1));
  stats.averageScorePercentage = (historicTotalScore + scorePercentage) / stats.totalTests;

  if (isDuel) {
    stats.totalDuels += 1;
    if (isDuelWin) {
      stats.duelWins += 1;
      stats.duelElo += 15;
    } else if (isDuelDraw) {
      stats.duelDraws += 1;
      stats.duelElo += 5;
    } else {
      stats.duelLosses += 1;
      stats.duelElo = Math.max(0, stats.duelElo - 10);
    }
  }

  LocalDbService.saveUserStats(stats);
  return stats;
}

export function evaluateAchievements(userId: string, stats: any, result: TestResult): Achievement[] {
  const unlocked: Achievement[] = [];
  const existing = LocalDbService.getAchievements(userId).map(a => a.type);
  
  const grant = (type: string) => {
    if (!existing.includes(type)) {
      const ach: Achievement = {
        id: `ach-${Date.now()}-${type}`,
        userId,
        type,
        unlockedAt: new Date().toISOString()
      };
      LocalDbService.saveAchievement(ach);
      unlocked.push(ach);
    }
  };

  if (stats.totalTests >= 1) grant('first_test');
  if (stats.totalTests >= 10) grant('10_tests');
  if (stats.totalTests >= 50) grant('50_tests');
  if (stats.totalTests >= 100) grant('100_tests');

  if (result.percentageScore >= 90) grant('accuracy_master');
  
  // Example for fast responder, assuming fast if completed in < 30% of total time. Total time = testType * 60s
  if (result.completionTimeSeconds <= (result.testType * 60 * 0.3)) grant('fast_responder');

  if (stats.totalDuels >= 1) grant('first_duel');
  if (stats.duelWins >= 10) grant('10_duel_wins');
  if (stats.duelWins >= 50) grant('duel_afsonasi');

  return unlocked;
}
