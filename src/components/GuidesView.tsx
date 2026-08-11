import React, { useState } from 'react';
import { BookOpen, FileText, Code, CheckCircle, ExternalLink, Download } from 'lucide-react';

export const GuidesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'html' | 'txt'>('overview');

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="border border-[#00f3ff]/40 bg-[#0e0e14] p-5 space-y-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#00f3ff]">
              <BookOpen className="w-5 h-5" />
              <h2 className="text-xl font-bold tracking-wider text-white uppercase glitch-text" data-text="PANDUAN LENGKAP & DEPLOYMENT GUIDE">
                PANDUAN LENGKAP & DEPLOYMENT GUIDE
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Panduan langkah demi langkah cara menginstal, menjalankan, mendanai free tier hosting (Vercel & PostgreSQL), serta memasang EA di MetaTrader 5.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/CARA_MENJALANKAN_PROJECT.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 border border-[#00f3ff] bg-[#00f3ff]/10 text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>BUKA HTML IN NEW TAB</span>
            </a>
          </div>
        </div>
      </div>

      {/* Guide Navigation Buttons */}
      <div className="flex space-x-2 border-b border-[#1a1a2e] pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 border font-bold ${
            activeTab === 'overview'
              ? 'bg-[#00f3ff] text-black border-[#00f3ff]'
              : 'bg-[#0e0e14] text-gray-300 border-[#1a1a2e] hover:border-gray-500'
          }`}
        >
          [1] QUICK START SUMMARY
        </button>
        <button
          onClick={() => setActiveTab('html')}
          className={`px-4 py-2 border font-bold ${
            activeTab === 'html'
              ? 'bg-[#00f3ff] text-black border-[#00f3ff]'
              : 'bg-[#0e0e14] text-gray-300 border-[#1a1a2e] hover:border-gray-500'
          }`}
        >
          [2] CARA_MENJALANKAN_PROJECT.html
        </button>
        <button
          onClick={() => setActiveTab('txt')}
          className={`px-4 py-2 border font-bold ${
            activeTab === 'txt'
              ? 'bg-[#00f3ff] text-black border-[#00f3ff]'
              : 'bg-[#0e0e14] text-gray-300 border-[#1a1a2e] hover:border-gray-500'
          }`}
        >
          [3] CARA_MENJALANKAN_PROJECT.txt
        </button>
      </div>

      {/* Tab 1: Quick Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="border border-[#1a1a2e] bg-[#0e0e14] p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase text-[#00f3ff]">
              LANGKAH RINGKAS MENJALANKAN PROJECT
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#07070a] border border-[#1a1a2e] space-y-2">
                <div className="text-emerald-400 font-bold text-sm">A. LOCAL DEVELOPMENT (KOMPUTER SENDIRI)</div>
                <ol className="list-decimal list-inside text-gray-300 space-y-1">
                  <li>Buka terminal / Command Prompt di folder project.</li>
                  <li>Jalankan: <code className="bg-black px-1 py-0.5 text-[#00f3ff]">npm install</code></li>
                  <li>Jalankan server dev: <code className="bg-black px-1 py-0.5 text-[#00f3ff]">npm run dev</code></li>
                  <li>Buka browser: <code className="text-amber-300">http://localhost:3000</code></li>
                  <li>Login Admin: User <code className="text-white">admin</code> / Pass <code className="text-white">admin123</code></li>
                </ol>
              </div>

              <div className="p-4 bg-[#07070a] border border-[#1a1a2e] space-y-2">
                <div className="text-[#ff0055] font-bold text-sm">B. DEPLOYMENT GRATIS (VERCEL + POSTGRESQL)</div>
                <ol className="list-decimal list-inside text-gray-300 space-y-1">
                  <li>Upload/Push repository ke <span className="text-white font-bold">GitHub</span>.</li>
                  <li>Buat database PostgreSQL gratis di <span className="text-white font-bold">Neon.tech / Supabase / Vercel Postgres</span>.</li>
                  <li>Import repository di <span className="text-white font-bold">Vercel.com</span>.</li>
                  <li>Masukkan Environment Variable <code className="text-[#00f3ff]">DATABASE_URL</code> & <code className="text-[#00f3ff]">JWT_SECRET</code>.</li>
                  <li>Deploy & Dapatkan URL API: <code className="text-amber-300">https://nama-project.vercel.app</code></li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Embedded HTML Guide */}
      {activeTab === 'html' && (
        <div className="border border-[#1a1a2e] bg-white text-black p-4 min-h-[600px] overflow-auto rounded">
          <iframe
            src="/CARA_MENJALANKAN_PROJECT.html"
            className="w-full h-[700px] border-none"
            title="Panduan HTML"
          />
        </div>
      )}

      {/* Tab 3: Text Version */}
      {activeTab === 'txt' && (
        <div className="border border-[#1a1a2e] bg-[#07070a] p-4 font-mono text-gray-200">
          <iframe
            src="/CARA_MENJALANKAN_PROJECT.txt"
            className="w-full h-[700px] border-none text-gray-200 bg-[#07070a]"
            title="Panduan TXT"
          />
        </div>
      )}
    </div>
  );
};
