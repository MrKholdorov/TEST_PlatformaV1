import React, { useState, useRef, useEffect } from 'react';
import { Profile } from '../types';
import { User, LogOut, Sun, Moon, Settings, Brain, Swords, Activity, BookX, Trophy } from 'lucide-react';
import { LocalDbService } from '../db/localDb';

interface Props {
  currentUser: Profile;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout: () => void;
  onNavigate: (view: any) => void;
}

export const UserProfileDropdown: React.FC<Props> = ({ currentUser, theme, onToggleTheme, onLogout, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleLogoutClick = () => {
    if (confirm("Tizimdan chiqishni xohlaysizmi?")) {
      onLogout();
    }
  };

  const MenuItem = ({ icon: Icon, label, onClick, color = "text-slate-700 dark:text-slate-300" }: any) => (
    <button
      onClick={() => {
        onClick();
        setIsOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${color}`}
    >
      <Icon size={14} className={color === "text-red-600" ? "" : "text-slate-400"} />
      {label}
    </button>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
           <span className="text-sm font-bold text-blue-700 dark:text-blue-300 tracking-tight">
             {getInitials(currentUser.fullName)}
           </span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser.fullName.split(' ')[0]}</p>
          <p className="text-[9px] font-sans font-medium text-slate-500 uppercase tracking-wider">{currentUser.xp} XP</p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
             <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser.fullName}</p>
             <p className="text-xs text-slate-500 truncate mt-0.5">{currentUser.email}</p>
          </div>

          <div className="py-1">
            <MenuItem icon={User} label="Profil" onClick={() => onNavigate('profile')} />
            <MenuItem icon={Activity} label="Statistika" onClick={() => onNavigate('statistics')} />
            <MenuItem icon={Trophy} label="Yutuqlar" onClick={() => onNavigate('achievements')} />
            <MenuItem icon={Swords} label="Bellashuvlar" onClick={() => onNavigate('duels')} />
            <MenuItem icon={BookX} label="Xato ishlangan savollar" onClick={() => onNavigate('mistakes')} />
            <MenuItem icon={Brain} label="AI Mentor" onClick={() => onNavigate('mentor')} />
          </div>

          <div className="py-1 border-t border-slate-100 dark:border-slate-800/50">
            <MenuItem icon={Settings} label="Sozlamalar" onClick={() => onNavigate('settings')} />
            <MenuItem icon={theme === 'light' ? Moon : Sun} label={theme === 'light' ? "Dark Mode" : "Light Mode"} onClick={onToggleTheme} />
          </div>

          <div className="py-1 border-t border-slate-100 dark:border-slate-800/50">
            <MenuItem icon={LogOut} label="Chiqish" onClick={handleLogoutClick} color="text-red-600 font-bold" />
          </div>
        </div>
      )}
    </div>
  );
};
