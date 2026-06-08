import React, { useState, useEffect } from 'react';
import { LocalDbService } from '../db/localDb';
import { db } from '../db/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Duel, Question } from '../types';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, Flag } from 'lucide-react';
import { updateUserStats } from '../lib/gameLogic';

interface Props {
  duel: Duel;
  currentUser: any;
  onExit: () => void;
}

export const DuelArena: React.FC<Props> = ({ duel, currentUser, onExit }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  
  // Real-time synchronization
  const [localPlayers, setLocalPlayers] = useState(duel.players);
  
  useEffect(() => {
    // Keep local players synchronized from duel props which is updated by onSnapshot in parent
    setLocalPlayers(duel.players);
  }, [duel]);

  useEffect(() => {
    // Load questions based on duel.questionIds
    const allQs = LocalDbService.getQuestions();
    const fetchedQs = duel.questionIds.map(id => allQs.find(q => q.id === id)).filter(Boolean) as Question[];
    setQuestions(fetchedQs);
  }, [duel.questionIds]);

  const handleAnswer = async (qId: string, answerKey: string) => {
    if (selectedAnswers[qId] || duel.status === 'finished') return;
    
    // Typecast since it comes as string from map
    const typedAnswer = answerKey as 'A' | 'B' | 'C' | 'D';
    const isCorrect = questions[currentIndex].correctAnswer === typedAnswer;
    const newAnswers = { ...selectedAnswers, [qId]: typedAnswer };
    setSelectedAnswers(newAnswers);

    const me = { ...localPlayers[currentUser.id] };
    me.answersCount += 1;
    if (isCorrect) me.score += 1;
    me.answers = newAnswers;
    
    // Sync to firebase
    const players = { ...localPlayers, [currentUser.id]: me };
    
    const isCompleted = me.answersCount === duel.questionsCount;
    if (isCompleted) me.completedAt = new Date().toISOString();
    
    // Check if everyone is completed
    const allCompleted = Object.values(players).every((p: any) => p.answersCount === duel.questionsCount || p.completedAt);
    
    await updateDoc(doc(db, 'duels', duel.id), {
      players,
      ...(allCompleted ? { status: 'finished', finishedAt: new Date().toISOString() } : {})
    });
  };

  const currentQ = questions[currentIndex];
  const me = localPlayers[currentUser.id];
  const opponentId = Object.keys(localPlayers).find(id => id !== currentUser.id) || '';
  const opponent = localPlayers[opponentId];
  
  const isFinished = duel.status === 'finished' || me.answersCount === duel.questionsCount;

  if (isFinished) {
    const isWinner = me.score > (opponent?.score || 0) || (me.score === opponent?.score && me.answersCount > (opponent?.answersCount || 0));
    const isDraw = me.score === opponent?.score;

    // Handle end-game stats locally if just finished
    if (duel.status === 'finished' && duel.finishedAt && !duel.winnerId) {
      // It's the first time we see finished status!
      updateUserStats(currentUser.id, true, isWinner, isDraw, (me.score / duel.questionsCount) * 100);
      updateDoc(doc(db, 'duels', duel.id), { winnerId: isDraw ? 'draw' : (isWinner ? me.userId : opponentId) }).catch(()=> {});
      
      if (currentUser.telegramId) {
         const msg = `⚔️ <b>Bellashuv yakunlandi - ${duel.subjectName}</b>\n\n👤 Siz: ${me.score} ta to'g'ri\n👤 Raqib: ${opponent?.score || 0} ta to'g'ri\n\n🏆 Natija: <b>${isDraw ? "DURANG" : isWinner ? "G'ALABA" : "MAG'LUBIYAT"}</b>`;
         import('../lib/telegramClient').then(m => m.sendTelegramNotification(currentUser.telegramId, msg));
      }

      const adminMsg = `⚔️ <b>Yangi duel yakunlandi</b>\n\n• Fan: <b>${duel.subjectName}</b>\n• Ishtirokchi 1: <b>${me.fullName}</b> (${me.score} ball)\n• Ishtirokchi 2: <b>${opponent?.fullName || 'Raqib'}</b> (${opponent?.score || 0} ball)\n• Natija: <b>${isDraw ? "DURANG" : isWinner ? me.fullName + " G'ALAQ QOZONDI" : (opponent?.fullName || 'Raqib') + " G'ALABA QOZONDI"}</b>`;
      import('../lib/telegramClient').then(m => m.sendAdminNotification(adminMsg));
    }

    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 text-center space-y-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Bellashuv Yakunlandi!</h1>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-premium">
           <div className="flex items-center justify-center gap-8 mb-8">
              <div className={`text-center ${isWinner && !isDraw ? 'scale-110' : 'opacity-70'}`}>
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-2xl font-black mb-2">{me.score}</div>
                <p className="font-bold">{me.fullName}</p>
                {isWinner && !isDraw && <span className="text-emerald-500 font-bold text-xs uppercase">G'olib</span>}
              </div>
              <p className="text-6xl font-black text-slate-300">VS</p>
              <div className={`text-center ${!isWinner && !isDraw ? 'scale-110' : 'opacity-70'}`}>
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-2xl font-black mb-2">{opponent?.score || 0}</div>
                <p className="font-bold">{opponent?.fullName || 'Raqib'}</p>
                {!isWinner && !isDraw && <span className="text-emerald-500 font-bold text-xs uppercase">G'olib</span>}
              </div>
           </div>
           
           <button onClick={onExit} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition">
             Doskaga qaytish
           </button>
        </div>
      </div>
    );
  }

  if (!currentQ) return <div className="text-center p-8 text-slate-500 animate-pulse">Yuklanmoqda...</div>;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 space-y-6">
       {/* Top Status Bar */}
       <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
         <div className="flex items-center gap-4">
           {/* Player 1 (Me) */}
           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{me.fullName}</span>
              <span className="text-2xl font-black text-rose-600">{me.score} / {me.answersCount}</span>
           </div>
           <span className="font-black text-slate-300 px-2">VS</span>
           {/* Player 2 */}
           <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{opponent?.fullName}</span>
              <span className="text-2xl font-black text-blue-600">{opponent?.score || 0} / {opponent?.answersCount || 0}</span>
           </div>
         </div>
         <div className="text-right">
           <span className="text-xs font-bold text-slate-400">Savol {currentIndex + 1} / {questions.length}</span>
         </div>
       </div>

       {/* Question Viewer */}
       <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm">
         <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed mb-6">
           {currentQ.questionText}
         </h2>

         <div className="space-y-3">
           {Object.entries(currentQ.options).map(([key, value]) => {
              const isSelected = selectedAnswers[currentQ.id] === key;
              const isAnswered = !!selectedAnswers[currentQ.id];
              const isCorrect = isAnswered && currentQ.correctAnswer === key;
              const isWrong = isSelected && !isCorrect;

              return (
                <button
                  key={key}
                  disabled={isAnswered}
                  onClick={() => handleAnswer(currentQ.id, key)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all disabled:cursor-default ${
                     isSelected ? (isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900') 
                     : isAnswered && isCorrect ? 'bg-emerald-50/50 border-emerald-200/50 text-emerald-900 opacity-50'
                     : isAnswered ? 'bg-slate-50 text-slate-400 border-slate-200 opacity-50'
                     : 'hover:-translate-y-0.5 hover:shadow-md bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                     <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isSelected ? (isCorrect ? 'bg-emerald-200' : 'bg-red-200') : 'bg-slate-100 text-slate-500'}`}>
                       {key}
                     </span>
                     <span className="font-medium text-sm">{value}</span>
                  </div>
                  {isSelected && (isCorrect ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-red-500" />)}
                </button>
              );
           })}
         </div>
       </div>

       <div className="flex justify-between items-center px-2">
         <button className="text-slate-400 hover:text-red-500 font-bold text-xs flex items-center gap-2 transition" onClick={onExit}>
           <Flag size={14} /> Taslim bo'lish
         </button>

         {selectedAnswers[currentQ.id] && currentIndex < questions.length - 1 && (
           <button 
             onClick={() => setCurrentIndex(prev => prev + 1)} 
             className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md flex items-center gap-2 active:scale-95 transition"
           >
             Keyingi <ArrowRight size={16} />
           </button>
         )}
         {selectedAnswers[currentQ.id] && currentIndex === questions.length - 1 && (
           <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold animate-pulse">
             Raqib tugatishini kuting...
           </div>
         )}
       </div>
    </div>
  );
};
