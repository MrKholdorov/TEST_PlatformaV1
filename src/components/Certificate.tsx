/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Award, Download, Printer, ShieldCheck, CheckCircle } from 'lucide-react';

interface CertificateProps {
  fullName: string;
  subjectName: string;
  percentage: number;
  testType: number;
  date: string;
  certificateNumber: string;
}

export const Certificate: React.FC<CertificateProps> = ({
  fullName,
  subjectName,
  percentage,
  testType,
  date,
  certificateNumber
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      const win = window.open('', '', 'width=900,height=650');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Sertifikat - ${fullName}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
              <style>
                body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: white; }
                @media print {
                  body { background-color: white; -webkit-print-color-adjust: exact; }
                }
              </style>
            </head>
            <body class="p-4">
              <div>${printContent}</div>
              <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  return (
    <div className="flex flex-col items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-premium max-w-4xl w-full mx-auto" id="certificate-viewer">
      
      {/* Decorative view window wrapper */}
      <div className="w-full overflow-x-auto pb-4">
        <div 
          ref={printRef}
          className="relative min-w-[750px] aspect-[1.414/1] bg-[#FCFDFE] dark:bg-slate-950 border-[16px] border-[#0F172A] p-12 flex flex-col justify-between items-center text-center overflow-hidden card-shine"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.01) 0%, rgba(15,23,42,0.01) 100%)' }}
        >
          {/* Elegant corner patterns */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-blue-600"></div>
          <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-blue-600"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-blue-600"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-blue-600"></div>

          {/* Golden Seal Graphic */}
          <div className="absolute right-12 top-12 flex flex-col items-center opacity-85">
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-glow border-2 border-amber-300 relative">
              <div className="absolute inset-1 border-2 border-dashed border-amber-200 rounded-full animate-[spin_20s_linear_infinite]"></div>
              <Award className="text-white w-8 h-8" />
            </div>
            <span className="text-[9px] font-mono mt-1 font-bold tracking-widest text-amber-600 dark:text-amber-500">MOCK VERIFIED</span>
          </div>

          {/* Heading */}
          <div className="mt-4">
            <span className="text-xs uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400 font-bold">ONLINE IMTIHON PLATFORMASI</span>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1 uppercase tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Muvaffaqiyat Sertifikati
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm italic mt-2">Ushbu hujjat bilim darajasini rasman tasdiqlaydi</p>
          </div>

          {/* Body Content */}
          <div className="my-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Ushbu sertifikat topshiriladi:</p>
            <h2 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 my-2 tracking-tight">
              {fullName}
            </h2>
            <div className="max-w-xl mx-auto border-t border-b border-slate-200 dark:border-slate-800 py-3 my-2">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Platforma bazasidagi <span className="font-bold text-slate-900 dark:text-white">{subjectName}</span> fani bo'yicha imtihon ko'rsatkichlaridan 
                mufassal o'tib, jami <span className="font-bold text-slate-900 dark:text-white">{testType} ta</span> savoldan iborat maxsus sinovda ishtirok etdi va
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <ShieldCheck className="text-emerald-500 w-5 h-5" />
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {percentage}% KO'RSATKICH
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">bilan muvaffaqiyatli yakunladi.</span>
              </div>
            </div>
          </div>

          {/* Footer & Signatures */}
          <div className="w-full grid grid-cols-3 gap-4 text-xs items-end mt-4">
            <div className="text-left">
              <p className="text-slate-400">Sertifikat kodi:</p>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{certificateNumber}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-24 h-12 border-b-2 border-slate-300 dark:border-slate-700 font-serif text-sm italic flex items-center justify-center text-blue-600/60 dark:text-blue-400/40">
                Mr. Kholdorov
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Platforma rahbari</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Berilgan sana:</p>
              <p className="font-bold text-[#0F172A] dark:text-white">{date}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mt-8 w-full border-t border-slate-100 dark:border-slate-800 pt-6">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium px-6 py-3 rounded-xl transition duration-150 shadow-premium active:scale-95"
          id="btn-print-certificate"
        >
          <Printer size={18} />
          Sertifikatni chop etish / PDF saqlash
        </button>
        <button
          onClick={() => {
            alert("Sertifikat yuklanmoqda... (Offline-tasdiq hujjati qurilmangizga printer orqali saqlash uchun tayyor)");
            handlePrint();
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition duration-150 shadow-glow active:scale-95"
          id="btn-download-certificate"
        >
          <Download size={18} />
          JPEG / PDF Yuklab olish
        </button>
      </div>

    </div>
  );
};
