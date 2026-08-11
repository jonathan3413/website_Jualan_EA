import React, { useState, useEffect } from 'react';
import { Terminal, Download, Copy, Check, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react';

export const EACodeView: React.FC = () => {
  const [eaCode, setEaCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEaCode = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/ea/source');
        if (res.ok) {
          const text = await res.text();
          setEaCode(text);
        }
      } catch (err) {
        console.error('Error fetching EA code:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEaCode();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(eaCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([eaCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'LicenseTestEA.mq5';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="border border-[#00f3ff]/40 bg-[#0e0e14] p-5 space-y-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#00f3ff]">
              <Terminal className="w-5 h-5" />
              <h2 className="text-xl font-bold tracking-wider text-white uppercase glitch-text" data-text="METATRADER 5 MQL5 CLIENT EA SOURCE">
                METATRADER 5 MQL5 CLIENT EA SOURCE
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              File: <span className="text-amber-400 font-bold">LicenseTestEA.mq5</span> — Compile this file in MetaEditor to produce the single <span className="text-[#00f3ff] font-bold">.ex5</span> distributed to all clients.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 border border-[#00f3ff] bg-[#00f3ff]/10 text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY MQL5 CODE'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-[#ff0055] bg-[#ff0055] text-white hover:bg-white hover:text-black font-extrabold text-xs tracking-wider transition-colors shadow-[0_0_10px_#ff0055] flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD LicenseTestEA.mq5</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical WebRequest Instructions Banner */}
      <div className="border border-amber-500/50 bg-amber-950/20 p-4 text-xs space-y-2 text-amber-200">
        <div className="flex items-center space-x-2 font-bold text-amber-400 text-sm">
          <HelpCircle className="w-5 h-5 shrink-0" />
          <span>IMPORTANT: HOW CLIENTS MUST CONFIGURING METATRADER 5 (WEBREQUEST ENABLED)</span>
        </div>
        <p className="text-gray-300">
          Before running <span className="text-amber-300 font-bold">LicenseTestEA.ex5</span>, client MUST enable WebRequest in MT5:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-gray-300 pl-2">
          <li>Open MetaTrader 5 → Click menu <span className="text-white font-bold">Tools</span> → <span className="text-white font-bold">Options</span> (or press Ctrl + O).</li>
          <li>Select tab <span className="text-[#00f3ff] font-bold">Expert Advisors</span>.</li>
          <li>Check option <span className="text-emerald-400 font-bold">"Allow WebRequest for listed URL:"</span>.</li>
          <li>Add your License Server URL (e.g. <span className="text-[#00f3ff] font-bold">http://localhost:3000</span> or <span className="text-[#00f3ff] font-bold">https://nama-project.vercel.app</span>).</li>
          <li>Click <span className="text-white font-bold">OK</span>.</li>
        </ol>
      </div>

      {/* Code Display Container */}
      <div className="border border-[#1a1a2e] bg-[#07070a] p-4 relative">
        <div className="flex justify-between items-center border-b border-[#1a1a2e] pb-2 mb-3 text-xs text-gray-400">
          <span>LicenseTestEA.mq5 (MQL5 Source Code)</span>
          <span className="text-[10px] text-cyan-400">MQL5 // REST API WebRequest Client</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-cyan-400 text-xs">LOADING MQL5 SOURCE CODE...</div>
        ) : (
          <pre className="text-xs font-mono text-cyan-200 bg-[#050508] p-4 border border-[#1a1a2e] overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed">
            {eaCode}
          </pre>
        )}
      </div>
    </div>
  );
};
