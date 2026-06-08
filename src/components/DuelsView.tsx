import React, { useState, useEffect } from 'react';
import { LocalDbService } from '../db/localDb';
import { db } from '../db/firebase';
import { doc, setDoc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { Swords, Plus, Users, Hash, ArrowRight, Loader2, Play } from 'lucide-react';
import { Duel, Profile } from '../types';

import { DuelArena } from './DuelArena';

interface Props {
  currentUser: Profile;
  onNavigate: (view: string) => void;
}

export const DuelsView: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const [activeDuel, setActiveDuel] = useState<Duel | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [testType, setTestType] = useState<number>(20);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!activeDuel) return;
    const inviteUrl = `https://t.me/TestONLINE_uzbot?start=duel_${activeDuel.code}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(inviteUrl);
      } else {
        const tempInput = document.createElement('input');
        tempInput.defaultValue = inviteUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.warn("Failed to copy", e);
    }
  };

  const handleTgLink = () => {
    if (!activeDuel) return;
    const inviteUrl = `https://t.me/TestONLINE_uzbot?start=duel_${activeDuel.code}`;
    const descText = `Men bilan ${activeDuel.subjectName} fanidan imtihon duelida kuch sinashing! ⚔️ Ushbu havolani bosing, srazi bot orqali ro'yxatdan o'ting va duelga qo'shiling:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(descText)}`;
    window.open(shareUrl, '_blank');
  };

  const subjects = LocalDbService.getSubjects();

  // Listen to active duel changes
  useEffect(() => {
    if (!activeDuel || activeDuel.status === 'finished') return;
    const unsub = onSnapshot(doc(db, 'duels', activeDuel.id), (docSnap) => {
       if (docSnap.exists()) {
          setActiveDuel(docSnap.data() as Duel);
       }
    });
    return () => unsub();
  }, [activeDuel?.id]);

  // Auto-join if '?duel=CODE' is present in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('duel');
    if (code && code.length === 6 && !activeDuel) {
       setJoinCode(code);
       // Clear the parameter from the browser URL so it doesn't loop
       try {
         const newUrl = window.location.pathname;
         window.history.replaceState({}, document.title, newUrl);
       } catch (e) {}
       
       // Trigger auto join
       setLoading(true);
       getDoc(doc(db, 'duels', code)).then(async (snap) => {
          if (snap.exists()) {
             const duel = snap.data() as Duel;
             if (duel.status === 'waiting') {
                const players = { ...duel.players };
                if (!players[currentUser.id] && Object.keys(players).length < 2) {
                   players[currentUser.id] = {
                      userId: currentUser.id,
                      fullName: currentUser.fullName,
                      ready: false,
                      score: 0,
                      answersCount: 0,
                      timeSpentSecs: 0,
                      joinedAt: new Date().toISOString(),
                      answers: {}
                   };
                   await updateDoc(doc(db, 'duels', code), { players });
                   duel.players = players;
                }
                setActiveDuel(duel);
             } else {
                setError("Ushbu bellashuv allaqachon boshlangan yoki to'la.");
             }
          } else {
             setError("Bellashuv topilmadi.");
          }
       }).catch((err) => {
          console.error(err);
          setError("Bellashuvga ulanishda xatolik.");
       }).finally(() => {
          setLoading(false);
       });
    }
  }, [currentUser]);

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleCreate = async () => {
    if (!selectedSubject) {
      setError("Iltimos fanni tanlang!");
      return;
    }
    setLoading(true);
    try {
      const code = generateCode();
      const subject = subjects.find(s => s.id === selectedSubject);
      
      const allQs = LocalDbService.getQuestions().filter(q => q.subjectId === selectedSubject);
      // Randomly select `testType` questions
      const shuffled = [...allQs].sort(() => 0.5 - Math.random());
      const selectedQs = shuffled.slice(0, testType).map(q => q.id);

      if (selectedQs.length < testType) {
        setError("Ushbu fan bo'yicha yetarli savollar mavjud emas.");
        return;
      }

      const duelRef = doc(db, 'duels', code);
      const newDuel: Duel = {
        id: code,
        code,
        subjectId: selectedSubject,
        subjectName: subject?.name || '',
        testType,
        status: 'waiting',
        players: {
          [currentUser.id]: {
             userId: currentUser.id,
             fullName: currentUser.fullName,
             ready: false,
             score: 0,
             answersCount: 0,
             timeSpentSecs: 0,
             joinedAt: new Date().toISOString(),
             answers: {}
          }
        },
        questionsCount: testType,
        questionIds: selectedQs,
        createdAt: new Date().toISOString()
      };

      await setDoc(duelRef, newDuel);
      setActiveDuel(newDuel);
      setError('');
    } catch (e) {
      console.error(e);
      setError("Bellashuv yaratishda xatolik.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode || joinCode.length !== 6) {
       setError("Xato kod kiritildi!");
       return;
    }
    setLoading(true);
    try {
      const duelRef = doc(db, 'duels', joinCode);
      const snap = await getDoc(duelRef);
      if (!snap.exists()) {
        setError("Bunday raqamli bellashuv topilmadi.");
        return;
      }
      
      const duel = snap.data() as Duel;
      if (duel.status !== 'waiting') {
        setError("Bellashuv allaqachon boshlangan yoki yakunlangan.");
        return;
      }

      if (Object.keys(duel.players).length >= 2 && !duel.players[currentUser.id]) {
        setError("Bellashuvda ishtirokchilar to'la.");
        return;
      }

      const players = { ...duel.players };
      if (!players[currentUser.id]) {
         players[currentUser.id] = {
           userId: currentUser.id,
           fullName: currentUser.fullName,
           ready: false,
           score: 0,
           answersCount: 0,
           timeSpentSecs: 0,
           joinedAt: new Date().toISOString(),
           answers: {}
         };
         await updateDoc(duelRef, { players });
         duel.players = players;
      }
      
      setActiveDuel(duel);
      setError('');
    } catch (e) {
      console.error(e);
      setError("Topishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const setReady = async () => {
     if (!activeDuel) return;
     const players = { ...activeDuel.players };
     players[currentUser.id].ready = true;
     
     // Check if all players (needs at least 2) are ready
     const playersArray = Object.values(players);
     const allReady = playersArray.length === 2 && playersArray.every(p => p.ready);
     
     await updateDoc(doc(db, 'duels', activeDuel.id), {
       players,
       ...(allReady ? { status: 'active', startedAt: new Date().toISOString() } : {})
     });
  };

  // If active duel and started, show DuelArena (will build it inside)
  if (activeDuel?.status === 'active' || activeDuel?.status === 'finished') {
    return <DuelArena duel={activeDuel} currentUser={currentUser} onExit={() => { setActiveDuel(null); setJoinCode(''); }} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4 py-4 border-b border-slate-200 dark:border-slate-800">
         <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Swords size={28} />
         </div>
         <div className="text-left">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Real-Time Bellashuv</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Do'stlar va raqiblar bilan kuch sinashing.</p>
         </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-200 text-center">{error}</div>}

      {!activeDuel ? (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create block */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
               <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <Plus size={18} className="text-rose-500" /> Bellashuv yaratish
               </h2>
               
               <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">1. Fannni tanlang</label>
                  <select 
                     value={selectedSubject} 
                     onChange={(e) => setSelectedSubject(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                  >
                     <option value="">Fanni tanlash...</option>
                     {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
               </div>
               
               <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">2. Savollar soni</label>
                  <div className="flex gap-2">
                     {[20,30,50,100].map(cnt => (
                        <button key={cnt} onClick={() => setTestType(cnt)} className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition border ${testType === cnt ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                           {cnt}
                        </button>
                     ))}
                  </div>
               </div>

               <button onClick={handleCreate} disabled={loading} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl transition shadow-premium active:scale-95 text-sm disabled:opacity-50 flex justify-center items-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Yaratish"}
               </button>
               
               {/* Tasodifiy qidirish optional text block */}
               <div className="text-center pt-2">
                  <p className="text-xs text-slate-400">Tez orada: Tasodifiy raqib qidirish xizmati ishga tushadi.</p>
               </div>
            </div>

            {/* Join Block */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
               <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <Hash size={18} className="text-blue-500" /> Kod orqali ulanish
               </h2>
               
               <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">6 xonali kodni kiriting</label>
                  <input 
                    type="text" 
                    placeholder="847291"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest text-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition uppercase"
                  />
               </div>

               <button onClick={handleJoin} disabled={loading || joinCode.length !== 6} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition shadow-premium active:scale-95 text-sm disabled:opacity-50 mt-4 flex justify-center mt-auto">
                  Qo'shilish <ArrowRight size={18} className="ml-2" />
               </button>
            </div>
         </div>
      ) : (
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-xl mx-auto shadow-premium text-center">
             <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Fan: {activeDuel.subjectName}</p>
             <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-widest my-3">{activeDuel.code}</h2>
             <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">Ushbu kodni yoki quyidagi taklifnoma havolasini raqibingizga yuboring</p>
             
             {/* Telegram share quick links */}
             <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl flex flex-col gap-3">
                <p className="text-[11px] font-bold text-blue-800 dark:text-blue-400 text-left">💬 Do'stlarni Telegram orqali duelga chaqirish</p>
                <div className="flex gap-2.5">
                   <button 
                     onClick={handleTgLink}
                     className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                   >
                     🚀 Telegramda Ulashish
                   </button>
                   <button 
                     onClick={handleCopyLink}
                     className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition shadow-sm border flex items-center justify-center gap-1.5 cursor-pointer ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700'}`}
                   >
                     {copied ? '✅ Havola nusxalandi' : '🔗 Havolani ko\'chirish'}
                   </button>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mb-8">
                 {Object.values(activeDuel.players).map(p => (
                    <div key={p.userId} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700">
                       <span className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 font-bold block mx-auto flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2">
                         {p.fullName[0]}
                       </span>
                       <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{p.fullName}</p>
                       <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded mt-1 inline-block ${p.ready ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                         {p.ready ? 'Tayyor' : 'Kutilmoqda'}
                       </span>
                    </div>
                 ))}
                 
                 {Object.keys(activeDuel.players).length < 2 && (
                    <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 animate-pulse bg-slate-50/50">
                       <p className="text-xs font-bold text-center">Raqib<br/>kutilmoqda...</p>
                    </div>
                 )}
             </div>

             <div className="flex gap-4">
                 <button onClick={() => {
                     // Leave duel logic simple refresh 
                     setActiveDuel(null);
                     setJoinCode('');
                 }} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition hover:bg-slate-200">Chiqish</button>
                 
                 {Object.keys(activeDuel.players).length === 2 && !activeDuel.players[currentUser.id].ready && (
                   <button onClick={setReady} className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-premium active:scale-95 transition flex items-center gap-2 justify-center">
                     <Play size={16} /> Tayyorman
                   </button>
                 )}
             </div>
         </div>
      )}
    </div>
  );
};
