/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Clock, HelpCircle, CheckCircle, AlertTriangle, XCircle, ArrowRight, ArrowLeft, Zap, ShieldAlert } from 'lucide-react';
import { Question, TestSession, Subject } from '../types';
import { LocalDbService } from '../db/localDb';

interface QuizEngineProps {
  session: TestSession;
  subject: Subject;
  onComplete: (
    score: number, 
    percentage: number, 
    durationSeconds: number, 
    questions?: Question[], 
    answers?: Record<string, 'A' | 'B' | 'C' | 'D'>
  ) => void;
  onCancel: () => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  session,
  subject,
  onComplete,
  onCancel
}) => {
  const [fastMode, setFastMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('otp_fast_mode');
    return saved === null ? true : saved === 'true'; // Default to true (super snappy)
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    let allQuestions = [];
    if (subject.id === 'mixed') {
      if (session.mixedSubjectIds && session.mixedSubjectIds.length > 0) {
        allQuestions = LocalDbService.getQuestions().filter(q => session.mixedSubjectIds!.includes(q.subjectId));
      } else {
        allQuestions = LocalDbService.getQuestions();
      }
    } else {
      allQuestions = LocalDbService.getQuestions().filter(q => q.subjectId === subject.id);
    }
    
    // Choose randomly up to session.testType
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, session.testType);

    // Safeguard in case total questions are fewer than the requested type
    if (selected.length < session.testType) {
      const backupList = [...selected];
      while (selected.length < session.testType && backupList.length > 0) {
        selected.push({
          ...backupList[Math.floor(Math.random() * backupList.length)],
          id: `q-dup-${Date.now()}-${selected.length}`
        });
      }
    }

    // Dynamic Options Scrambler
    const processed = selected.map(q => {
      const originalOptions = [
        { origKey: 'A', text: q.options.A },
        { origKey: 'B', text: q.options.B },
        { origKey: 'C', text: q.options.C },
        { origKey: 'D', text: q.options.D }
      ];
      
      // Randomly sort the options list
      const scrambled = [...originalOptions].sort(() => Math.random() - 0.5);
      
      // Find where the original correct answer ended up
      const correctIdx = scrambled.findIndex(opt => opt.origKey === q.correctAnswer);
      const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      const newCorrectAnswer = keys[correctIdx !== -1 ? correctIdx : 0];
      
      return {
        ...q,
        options: {
          A: scrambled[0].text,
          B: scrambled[1].text,
          C: scrambled[2].text,
          D: scrambled[3].text
        },
        correctAnswer: newCorrectAnswer
      };
    });

    return processed;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(session.timeLeftSeconds);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>(session.answers || {});
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const totalDurationSeconds = session.timeLeftSeconds || (session.testType * 60);

  // Synchronize selectedAnswer with userAnswers when changing current index
  useEffect(() => {
    const currentQ = questions[currentIndex];
    if (currentQ) {
      setSelectedAnswer(userAnswers[currentQ.id] || null);
    }
  }, [currentIndex, questions, userAnswers]);

  // Find the first unanswered question
  useEffect(() => {
    const unansweredIdx = questions.findIndex(q => !userAnswers[q.id]);
    if (unansweredIdx !== -1) {
      setCurrentIndex(unansweredIdx);
    }
  }, [session.id]);

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Start countdown timer
  useEffect(() => {
    if (timeLeft === null) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }

        // Save session states inside LocalDb
        const updatedSession = {
          ...session,
          timeLeftSeconds: prev - 1,
          answers: userAnswers
        };
        LocalDbService.saveSession(updatedSession);

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userAnswers, timeLeft]);

  const currentQuestion = questions[currentIndex];

  const proceedToNext = (answersToUse = userAnswers) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    setShowFeedback(false);
    setSelectedAnswer(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleSubmitTest(answersToUse);
    }
  };

  const handleOptionClick = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (session.isExamMode) {
      // Exam mode: no lock, no delay, options changeable, saves instantly
      const updatedAnswers = { ...userAnswers, [currentQuestion.id]: optionKey };
      setUserAnswers(updatedAnswers);
      setSelectedAnswer(optionKey);

      const updatedSession = {
        ...session,
        timeLeftSeconds: timeLeft,
        answers: updatedAnswers
      };
      LocalDbService.saveSession(updatedSession);
      return;
    }

    if (showFeedback) return; // Prevent double clicks during feedback holds

    setSelectedAnswer(optionKey);
    setShowFeedback(true);

    const isCorrect = currentQuestion.correctAnswer === optionKey;
    const updatedAnswers = { ...userAnswers, [currentQuestion.id]: optionKey };
    setUserAnswers(updatedAnswers);

    // Save state instantly
    const updatedSession = {
      ...session,
      timeLeftSeconds: timeLeft,
      answers: updatedAnswers
    };
    LocalDbService.saveSession(updatedSession);

    // Stagger slightly for user absorption (Quizizz style) & auto move to next
    // Correct delay: fastMode ? 400 : 1500. Incorrect penalty: 5000 (5 seconds)
    const delay = isCorrect ? (fastMode ? 400 : 1500) : 5000;
    
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      proceedToNext(updatedAnswers);
    }, delay);
  };

  const handleAutoSubmit = () => {
    alert("Vaqt tugadi! Imtihon natijalari avtomatik hisoblab chiqilmoqda.");
    handleSubmitTest(userAnswers);
  };

  const handleSubmitTest = (finalAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>) => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let correctCount = 0;
    questions.forEach(q => {
      if (finalAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const timeSpentSeconds = timeLeft !== null ? totalDurationSeconds - timeLeft : Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);

    onComplete(correctCount, percentage, timeSpentSeconds, questions, finalAnswers);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Warning calculations
  const is5MinuteWarning = timeLeft !== null && timeLeft <= 300; // 5 min
  const is1MinuteCritical = timeLeft !== null && timeLeft <= 60; // 1 min

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-lg mx-auto">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        <p className="text-sm font-bold text-slate-500 mt-4">Savollar tayyorlanmoqda...</p>
      </div>
    );
  }

  // Circular progress stroke offset calculation
  const circleRadius = 24;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = timeLeft !== null ? circumference - (timeLeft / totalDurationSeconds) * circumference : 0;

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-4" id="quiz-engine-view">
      
      {/* Quiz Header Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-premium">
        
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">IMTIHON JADVALI</span>
          <h2 className="text-lg font-black text-slate-950 dark:text-white leading-tight">{subject.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-sans tracking-tight font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md">
              Test turi: {session.testType} talik
            </span>
            {timeLeft === null && (
              <span className="text-xs font-sans tracking-tight font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-md flex items-center gap-1">
                <ShieldAlert size={12} />
                Timersiz rejim
              </span>
            )}
          </div>
        </div>

        {/* Circular Countdown Tracker */}
        {timeLeft !== null && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-14 h-14 flex items-center justify-center">
              {/* SVG circular track */}
              <svg className="absolute w-full h-full rotate-90 transform">
                <circle
                  cx="28"
                  cy="28"
                  r={circleRadius}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={circleRadius}
                  className={`stroke-current transition-all duration-1000 ${is1MinuteCritical ? 'text-red-500 animate-pulse' : is5MinuteWarning ? 'text-amber-500' : 'text-blue-600'}`}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <Clock size={16} className={`absolute ${is1MinuteCritical ? 'text-red-500 animate-bounce' : is5MinuteWarning ? 'text-amber-500' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Qolgan vaqt</p>
              <p className={`font-sans tracking-tight text-lg font-black leading-none ${is1MinuteCritical ? 'text-red-500 animate-[pulse_1s_infinite]' : is5MinuteWarning ? 'text-amber-500' : 'text-slate-800 dark:text-slate-200'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {/* Fast-mode toggle option */}
          <button
            onClick={() => {
              const next = !fastMode;
              setFastMode(next);
              localStorage.setItem('otp_fast_mode', String(next));
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition duration-150 cursor-pointer ${fastMode ? 'bg-amber-500/10 text-amber-600 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800'}`}
          >
            <Zap size={14} className={fastMode ? "text-amber-500 fill-amber-500 animate-pulse shrink-0" : "shrink-0"} />
            <span>Tezkor test ({fastMode ? 'Tezlik: A’lo' : 'Normal'})</span>
          </button>

          <button
            onClick={() => {
              if (confirm("Haqiqatdan ham imtihonni yakunlamasdan chiqmoqchimisiz? Natija saqlanmaydi!")) {
                onCancel();
              }
            }}
            className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 px-4 py-2.5 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
            id="btn-quiz-exit"
          >
            Bekor qilish & Chiqish
          </button>
        </div>
      </div>

      {/* 5 Minute Warning Banner */}
      {is5MinuteWarning && (
        <div className={`p-3 rounded-xl border mb-6 flex items-center gap-2 animate-[pulse_2s_infinite] ${is1MinuteCritical ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900'}`}>
          <AlertTriangle size={18} className="shrink-0 animate-bounce" />
          <span className="text-xs font-bold text-left">
            {is1MinuteCritical 
              ? "DIQQAT: Oxirgi daqiqa! Imtolarni tezlashtiring, tizim tez orada avtomatik yakunlanadi!" 
              : "DIQQAT: Imtihon yakunlanishiga 5 daqiqadan kam vaqt qoldi!"
            }
          </span>
        </div>
      )}

      {/* Main Question & Options Structure Wrapper */}
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold">Savollar taraqqiyoti</span>
            <span className="font-sans tracking-tight font-bold text-slate-800 dark:text-slate-200">{currentIndex + 1} / {questions.length}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 text-center shadow-premium space-y-6 relative overflow-hidden card-shine">
          <div className="absolute top-4 left-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded">
            Savol #{currentIndex + 1}
          </div>
          <HelpCircle size={32} className="mx-auto text-blue-500 animate-pulse" />
          <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed max-w-2xl mx-auto">
            {currentQuestion.questionText}
          </h1>
        </div>        {/* Options Grid Layout matching Quizizz styles with full colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['A', 'B', 'C', 'D'] as const).map((key) => {
            const optionText = currentQuestion.options[key];
            const isSelected = selectedAnswer === key;
            const isCorrectAnswer = currentQuestion.correctAnswer === key;
            const hasChosenWorst = isSelected && !isCorrectAnswer;

            // Compute theme of buttons during active feedback hold
            let btnStyle = "border-slate-200 bg-white hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60";
            let circleColor = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
            let rightIndicator = null;

            if (session.isExamMode) {
              if (isSelected) {
                btnStyle = "border-blue-500 bg-blue-50/30 text-blue-850 dark:text-blue-200 dark:bg-blue-950/30 ring-4 ring-blue-500/10 scale-[1.01]";
                circleColor = "bg-blue-500 text-white";
                rightIndicator = <CheckCircle size={18} className="text-blue-500 shrink-0" />;
              }
            } else if (showFeedback) {
              if (isCorrectAnswer) {
                btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 ring-4 ring-emerald-500/10 scale-[1.01]";
                circleColor = "bg-emerald-500 text-white";
                rightIndicator = <CheckCircle size={18} className="text-emerald-500 shrink-0" />;
              } else if (hasChosenWorst) {
                btnStyle = "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 ring-4 ring-red-500/10";
                circleColor = "bg-red-500 text-white";
                rightIndicator = <XCircle size={18} className="text-red-500 shrink-0" />;
              } else {
                btnStyle = "opacity-40 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";
              }
            }

            return (
              <button
                key={key}
                disabled={!session.isExamMode && showFeedback}
                onClick={() => handleOptionClick(key)}
                className={`flex items-center justify-between p-4.5 rounded-2xl border text-left font-semibold text-sm sm:text-base leading-snug transition-all duration-150 shadow-premium cursor-pointer ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all ${circleColor}`}>
                    {key}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">{optionText}</span>
                </div>
                {rightIndicator}
              </button>
            );
          })}
        </div>

        {/* Practice Mode: Skip feedback / 5s freeze timer controls */}
        {!session.isExamMode && showFeedback && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-left">
            <div className="flex items-center gap-3">
              {currentQuestion.correctAnswer === selectedAnswer ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle size={20} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 animate-pulse">
                  <XCircle size={20} />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {currentQuestion.correctAnswer === selectedAnswer 
                    ? "To'g'ri javob!" 
                    : "Noto'g'ri javob! Kutish vaqti: 5 soniya."}
                </p>
                <p className="text-xs text-slate-500">
                  {currentQuestion.correctAnswer === selectedAnswer 
                    ? "Yaxshi natija! Harakatda davom eting." 
                    : "To'g'ri javob yashil rangda ko'rsatildi. Kutishni chetlab o'tish uchun o'ngdagi tugmani bosing."}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => proceedToNext(userAnswers)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl active:scale-95 transition shadow-glow cursor-pointer whitespace-nowrap"
            >
              Keyingi savol <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Exam Mode: Grid Navigation and Back/Next Buttons */}
        {session.isExamMode && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Savollar orasida harakatlanish:</span>
              <span className="text-[10px] font-bold text-slate-400 text-left">Ko'k: hozirgi, To'la: javoblangan, Kulrang: javoblanmagan</span>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-start max-h-32 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!userAnswers[q.id];
                
                let badgeStyle = "bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 text-slate-600 dark:text-slate-400";
                if (isCurrent) {
                  badgeStyle = "bg-blue-600 border-blue-600 text-white font-black scale-110 ring-4 ring-blue-500/10";
                } else if (isAnswered) {
                  badgeStyle = "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-400 font-bold";
                }
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-9 h-9 rounded-xl border text-xs flex items-center justify-center cursor-pointer transition active:scale-90 font-bold ${badgeStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Previous & Next controls */}
            <div className="flex justify-between items-center pt-3 gap-4 border-t border-slate-100 dark:border-slate-850">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <ArrowLeft size={14} /> Oldingi
              </button>

              <span className="text-xs font-bold font-sans text-slate-400">
                {currentIndex + 1} - savol
              </span>

              <button
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                Keyingi <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Footer Area with Submit Buttons */}
        {session.isExamMode ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-blue-50/55 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/40 p-4 rounded-3xl mt-4">
            <div className="text-left">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-400 block">Imtihon topshirishga tayyormisiz?</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Barcha javoblaringizni tekshirgach, tugatish tugmasini bosing.</span>
            </div>
            <button
              onClick={() => {
                const unansweredCount = questions.length - Object.keys(userAnswers).length;
                const confirmMsg = unansweredCount > 0 
                  ? `Diqqat! Sizda hali javob berilmagan ${unansweredCount} ta savol qolmoqda. Baribir imtihonni yakunlamoqchimisiz?`
                  : "Haqiqatdan ham imtihonni yakunlab, natijalarni ko'rmoqchimisiz?";
                if (confirm(confirmMsg)) {
                  handleSubmitTest(userAnswers);
                }
              }}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition active:scale-95 text-xs shadow-glow cursor-pointer whitespace-nowrap"
              id="btn-quiz-manual-submit"
            >
              Imtihonni topshirish va yakunlash
            </button>
          </div>
        ) : (
          /* Manual submit emergency backup button */
          <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
            <span>Tizim javobni kiritganingizda avtomatik ravishda saqlaydi va bir zumda harakatlanadi.</span>
            <button
              onClick={() => handleSubmitTest(userAnswers)}
              className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-lg active:scale-95"
              id="btn-quiz-manual-submit"
            >
              Imtihonni topshirish
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
