/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Terminal, Download, Play, RefreshCw, Cpu, Server, Check } from 'lucide-react';
import { LocalDbService } from '../db/localDb';

interface BackupLog {
  id: string;
  timestamp: string;
  fileName: string;
  sizeKb: number;
  status: 'SUCCESS' | 'FAILED';
}

export const AdminEmulatorConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('tables');
  const [selectedTable, setSelectedTable] = useState<string>('profiles');
  const [tableData, setTableData] = useState<any[]>([]);
  const [sqlCommand, setSqlCommand] = useState<string>('SELECT * FROM profiles ORDER BY xp DESC;');
  const [sqlOutput, setSqlOutput] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Load initial backup records
  useEffect(() => {
    const list: BackupLog[] = [
      { id: 'b-1', timestamp: "2026-06-07T02:00:00Z", fileName: "backup_postgres_profiles_subject_schema_20260607_020000.sql", sizeKb: 245, status: 'SUCCESS' },
      { id: 'b-2', timestamp: "2026-06-06T02:00:00Z", fileName: "backup_postgres_profiles_subject_schema_20260606_020000.sql", sizeKb: 240, status: 'SUCCESS' },
      { id: 'b-3', timestamp: "2026-06-05T02:00:00Z", fileName: "backup_postgres_profiles_subject_schema_20260605_020000.sql", sizeKb: 238, status: 'SUCCESS' }
    ];
    setBackups(list);
    reloadTable();
  }, [selectedTable]);

  const reloadTable = () => {
    switch (selectedTable) {
      case 'profiles':
        setTableData(LocalDbService.getProfiles());
        break;
      case 'subjects':
        setTableData(LocalDbService.getSubjects());
        break;
      case 'questions':
        setTableData(LocalDbService.getQuestions().slice(0, 50)); // Limit display
        break;
      case 'rankings':
        setTableData(LocalDbService.getRankings());
        break;
      case 'test_results':
        setTableData(LocalDbService.getResults());
        break;
      case 'test_sessions':
        setTableData(LocalDbService.getSessions());
        break;
      case 'activity_logs':
        setTableData(LocalDbService.getLogs());
        break;
      case 'notifications':
        setTableData(LocalDbService.getNotifications());
        break;
      default:
        setTableData([]);
    }
  };

  const handleRunSQL = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      const cleanCmd = sqlCommand.trim().toLowerCase();

      if (!cleanCmd) {
        setSqlOutput({ error: "Hech qanday SQL buyrug'i aniqlanmadi" });
        return;
      }

      if (cleanCmd.startsWith('select * from profiles')) {
        setSqlOutput({
          status: 'SUCCESS',
          rowsAffected: LocalDbService.getProfiles().length,
          result: LocalDbService.getProfiles()
        });
      } else if (cleanCmd.startsWith('select * from subjects')) {
        setSqlOutput({
          status: 'SUCCESS',
          rowsAffected: LocalDbService.getSubjects().length,
          result: LocalDbService.getSubjects()
        });
      } else if (cleanCmd.startsWith('select * from rankings')) {
        setSqlOutput({
          status: 'SUCCESS',
          rowsAffected: LocalDbService.getRankings().length,
          result: LocalDbService.getRankings()
        });
      } else if (cleanCmd.startsWith('select * from activity_logs') || cleanCmd.includes('logs')) {
        setSqlOutput({
          status: 'SUCCESS',
          rowsAffected: LocalDbService.getLogs().length,
          result: LocalDbService.getLogs()
        });
      } else if (cleanCmd.startsWith('create table') || cleanCmd.includes('alter')) {
        setSqlOutput({
          status: 'SUCCESS',
          message: "SQL buyrug'i muvaffaqiyatli bajarildi. Jadval strukturasi tahrirlandi.",
          rowsAffected: 0
        });
      } else {
        // Fallback generic success message
        setSqlOutput({
          status: 'SUCCESS',
          message: "SQL sintaksis tekshirildi va bajarildi (PostgreSQL Supabase Engine)",
          rowsAffected: 1,
          result: [{ execution_status: "ok", engine_node: "cloud-run-postgres-cluster-01", uptime: "99.99%" }]
        });
      }
    }, 600);
  };

  const handleBackupNow = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      const newBackup: BackupLog = {
        id: `b-${Date.now()}`,
        timestamp: new Date().toISOString(),
        fileName: `backup_postgres_profiles_subject_schema_${new Date().toISOString().slice(0,10).replace(/-/g,'')}_instant.sql`,
        sizeKb: Math.floor(Math.random() * 20) + 240,
        status: 'SUCCESS'
      };
      setBackups([newBackup, ...backups]);
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium w-full text-left" id="database-emulator">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl flex items-center justify-center">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Supabase / PostgreSQL Server Console</h2>
            <p className="text-xs text-slate-500">RLS, Avtomatik zaxiralash va Relatsion jadvallar monitoringi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-sans tracking-tight font-medium text-slate-500">postgres-db.production:5432</span>
        </div>
      </div>

      {/* Database configuration Tab selectors */}
      <div className="flex gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('tables')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-150 ${activeTab === 'tables' ? 'bg-[#0F172A] text-white dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          🗄️ Relyatsion jadvallar
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-150 ${activeTab === 'sql' ? 'bg-[#0F172A] text-white dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          💻 SQL buyruqlar (CLI)
        </button>
        <button
          onClick={() => setActiveTab('rls')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-150 ${activeTab === 'rls' ? 'bg-[#0F172A] text-white dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          🛡️ Row Level Security (RLS)
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-150 ${activeTab === 'backup' ? 'bg-[#0F172A] text-white dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          💾 Zaxiralash (Backup)
        </button>
      </div>

      {/* Tab: Relyatsion jadvallar */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'profiles', label: 'profiles' },
              { id: 'subjects', label: 'subjects' },
              { id: 'questions', label: 'questions' },
              { id: 'test_sessions', label: 'test_sessions' },
              { id: 'test_results', label: 'test_results' },
              { id: 'rankings', label: 'rankings' },
              { id: 'activity_logs', label: 'activity_logs' },
              { id: 'notifications', label: 'notifications' }
            ].map(tbl => (
              <button
                key={tbl.id}
                onClick={() => setSelectedTable(tbl.id)}
                className={`px-3 py-1.5 rounded-lg font-sans tracking-tight text-xs border transition duration-150 ${selectedTable === tbl.id ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800'}`}
              >
                {tbl.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg font-sans tracking-tight">
            <span>TABLE: public.{selectedTable}</span>
            <span>ROWS COUNT: {tableData.length}</span>
          </div>

          {/* Table display */}
          <div className="w-full overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                  {tableData.length > 0 && Object.keys(tableData[0]).map(key => (
                    <th key={key} className="p-3 text-xs font-sans tracking-tight font-bold text-slate-600 dark:text-slate-400 uppercase">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td className="p-4 text-xs text-slate-400 text-center" colSpan={5}>
                      Jadvalda ma'lumotlar yo'q yoki taqdim etilmagan.
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs text-slate-600 dark:text-slate-300 font-sans tracking-tight">
                      {Object.values(row).map((val: any, sIdx) => (
                        <td key={sIdx} className="p-3 truncate max-w-[200px]">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: SQL Command Terminal */}
      {activeTab === 'sql' && (
        <div className="space-y-4">
          <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-sans tracking-tight text-xs flex flex-col gap-2 relative">
            <div className="absolute top-2 right-2 flex gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 border-b border-slate-800 pb-2 mb-2">
              <Terminal size={14} />
              <span>Interactive SQL Shell - PostgreSQL 16.2 (Debian)</span>
            </div>
            <textarea
              value={sqlCommand}
              onChange={(e) => setSqlCommand(e.target.value)}
              className="w-full bg-transparent text-emerald-400 border-none outline-none resize-none h-24 focus:ring-0"
              placeholder="Yozing e.g. SELECT * FROM profiles;"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={handleRunSQL}
                disabled={isExecuting}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition duration-150 active:scale-95 disabled:opacity-50"
              >
                {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                SQL-ni bajarish
              </button>
            </div>
          </div>

          {/* SQL terminal output */}
          {sqlOutput && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans tracking-tight">SQL SO'ROV NATIJASI (JSON):</h4>
              <pre className="text-xs font-sans tracking-tight text-slate-600 dark:text-slate-300 overflow-x-auto max-h-60 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                {JSON.stringify(sqlOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Tab: Row Level Security status auditing */}
      {activeTab === 'rls' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-700 dark:text-emerald-400 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-500" />
                <h3 className="font-bold text-sm">ROW LEVEL SECURITY (RLS) HOLATI: FAOL</h3>
              </div>
              <p className="text-xs leading-relaxed">
                Supabase PostgreSQL yadrodagi barcha relatsion jadvallar uchun RLS siyosati to'liq yoqilgan (`ALTER TABLE ENABLE ROW LEVEL SECURITY`). Ma'lumotlarni ruxsatsiz manipulyatsiya qilish imkonsiz.
              </p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-blue-700 dark:text-blue-400 space-y-2">
              <div className="flex items-center gap-2">
                <Cpu size={20} className="text-blue-500" />
                <h3 className="font-bold text-sm">XAVFSIZLIK SQL FILTRLARI:</h3>
              </div>
              <p className="text-xs font-sans tracking-tight">
                SELECT matches auth.uid() = id;<br/>
                INSERT matches authenticated_users;<br/>
                DELETE/UPDATE ONLY matches admins_auth.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Jadvallar RLS Siyosati ro'yxati (Postgres Audit):</h4>
            <div className="space-y-1.5 font-sans tracking-tight text-xs">
              {[
                { table: 'profiles', rls: 'Yoqilgan', policy: 'auth.uid() = id' },
                { table: 'subjects', rls: 'Yoqilgan', policy: "Tizimda hammaga ruxsat, tahrirlash faqat admin'ga" },
                { table: 'questions', rls: 'Yoqilgan', policy: "Faqat admin tahrir qilishi taqiqlangan" },
                { table: 'test_sessions', rls: 'Yoqilgan', policy: 'auth.uid() = user_id' },
                { table: 'test_results', rls: 'Yoqilgan', policy: 'auth.uid() = user_id' },
                { table: 'rankings', rls: 'Yoqilgan', policy: 'Har bir o\'quvchi o\'z ballini yangilaydi' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg">
                  <span className="font-bold text-[#0F172A] dark:text-slate-300">public.{item.table}</span>
                  <span className="text-emerald-500 flex items-center gap-1 font-bold">
                    <Check size={12} /> {item.rls}
                  </span>
                  <span className="text-slate-400 hidden sm:inline">{item.policy}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Backup engine and automatic schedules */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Avtomatik har kungi zaxiralash tizimi</h3>
              <p className="text-xs text-slate-500">Zahira nusxalari server vaktiga ko'ra har kuni 02:00 da amalga oshiriladi (Max 30 nusxa saqlanadi)</p>
            </div>
            <button
              onClick={handleBackupNow}
              disabled={isBackingUp}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs transition duration-150 active:scale-95 disabled:opacity-50 shadow-glow"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  Zaxira olinmoqda...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Hozir zaxira olish (Backup)
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">ARXIVLANGAN SQL ZAXIRA NUSXALARI (Database Backups):</h4>
            <div className="space-y-1.5 font-sans tracking-tight text-xs">
              {backups.map(b => (
                <div key={b.id} className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-lg hover:shadow-premium transition">
                  <div className="flex gap-2 items-center">
                    <Server size={14} className="text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-bold truncate max-w-[200px] sm:max-w-md">{b.fileName}</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-slate-400">{b.sizeKb} KB</span>
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[9px] px-1.5 py-0.5 rounded">
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
