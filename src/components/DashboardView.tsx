import React, { useState, useEffect } from 'react';
import { DashboardStats, VerificationLog } from '../types';
import { Shield, Users, Clock, AlertTriangle, CheckCircle, Ban, Play, RefreshCw, Terminal, Cpu } from 'lucide-react';

interface DashboardViewProps {
  setCurrentTab: (tab: string) => void;
  token: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setCurrentTab, token }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Tester state
  const [testAccount, setTestAccount] = useState('12345678');
  const [testProduct, setTestProduct] = useState('EA_STRADDLE');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/logs?limit=10', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleTestVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/license/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mt5AccountId: testAccount,
          productCode: testProduct,
          eaVersion: '1.0.0'
        })
      });
      const data = await res.json();
      setTestResult(data);
      // Refresh logs stream
      fetchDashboardData();
    } catch (error: any) {
      setTestResult({ valid: false, status: 'ERROR', reason: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Welcome Banner */}
      <div className="border-2 border-[#00f3ff] bg-[#0e0e14] p-5 shadow-[0_0_15px_rgba(0,243,255,0.15)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#00f3ff] text-xs font-bold uppercase tracking-widest">
            <Cpu className="w-4 h-4 animate-spin" />
            <span>SYSTEM OVERVIEW // LIVE MATRIX</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-wider mt-1 glitch-text" data-text="MT5 LICENSE COMMAND CENTER">
            MT5 LICENSE COMMAND CENTER
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time MetaTrader 5 account validation, product key monitoring, and automated security firewall.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="px-3 py-2 border border-[#00f3ff] bg-[#00f3ff]/10 text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH DATA</span>
          </button>
          <button
            onClick={() => setCurrentTab('create-client')}
            className="px-4 py-2 border border-[#ff0055] bg-[#ff0055] text-white hover:bg-white hover:text-black font-extrabold text-xs tracking-wider transition-colors shadow-[0_0_10px_#ff0055]"
          >
            + CREATE NEW LICENSE
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Clients */}
        <div 
          onClick={() => setCurrentTab('clients')}
          className="border border-[#1a1a2e] bg-[#0e0e14] p-4 hover:border-[#00f3ff] transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center text-gray-400 text-xs">
            <span>TOTAL CLIENTS</span>
            <Users className="w-4 h-4 text-[#00f3ff] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-white mt-2 font-mono">
            {stats?.totalClients ?? 0}
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">REGISTERED ENTITIES</div>
        </div>

        {/* Active Licenses */}
        <div 
          onClick={() => setCurrentTab('clients')}
          className="border border-[#1a1a2e] bg-[#0e0e14] p-4 hover:border-emerald-500 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center text-gray-400 text-xs">
            <span>ACTIVE LICENSES</span>
            <CheckCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
            {stats?.activeLicenses ?? 0}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-1">AUTHENTICATED TRADING</div>
        </div>

        {/* Expiring Soon */}
        <div 
          onClick={() => setCurrentTab('clients')}
          className="border border-[#1a1a2e] bg-[#0e0e14] p-4 hover:border-amber-500 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center text-gray-400 text-xs">
            <span>EXPIRING SOON</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2 font-mono">
            {stats?.expiringSoon ?? 0}
          </div>
          <div className="text-[10px] text-amber-500/80 mt-1">WITHIN 7 DAYS</div>
        </div>

        {/* Expired */}
        <div 
          onClick={() => setCurrentTab('clients')}
          className="border border-[#1a1a2e] bg-[#0e0e14] p-4 hover:border-red-500 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center text-gray-400 text-xs">
            <span>EXPIRED LICENSES</span>
            <AlertTriangle className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-red-400 mt-2 font-mono">
            {stats?.expiredLicenses ?? 0}
          </div>
          <div className="text-[10px] text-red-500/80 mt-1">ACTION REQUIRED</div>
        </div>

        {/* Blocked */}
        <div 
          onClick={() => setCurrentTab('clients')}
          className="border border-[#1a1a2e] bg-[#0e0e14] p-4 hover:border-[#ff0055] transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center text-gray-400 text-xs">
            <span>BLOCKED LICENSES</span>
            <Ban className="w-4 h-4 text-[#ff0055] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-[#ff0055] mt-2 font-mono">
            {stats?.blockedLicenses ?? 0}
          </div>
          <div className="text-[10px] text-[#ff0055]/80 mt-1">BLACK-LISTED MT5 IDS</div>
        </div>
      </div>

      {/* Main Grid: Interactive Tester + Verification Log Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive EA Verification Tester */}
        <div className="border border-[#00f3ff]/40 bg-[#0e0e14] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a1a2e] pb-3">
            <div className="flex items-center space-x-2 text-[#00f3ff]">
              <Terminal className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-wider uppercase text-white">
                LIVE EA API SIMULATION TESTER
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800">
              POST /api/license/verify
            </span>
          </div>

          <p className="text-xs text-gray-400">
            Simulate how your MetaTrader 5 EA interacts with the server in real-time. Test registered or unregistered Account IDs directly:
          </p>

          <form onSubmit={handleTestVerify} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">MT5 ACCOUNT ID:</label>
                <input
                  type="text"
                  value={testAccount}
                  onChange={(e) => setTestAccount(e.target.value)}
                  className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2 outline-none font-mono"
                  placeholder="e.g. 12345678"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">PRODUCT CODE:</label>
                <input
                  type="text"
                  value={testProduct}
                  onChange={(e) => setTestProduct(e.target.value.toUpperCase())}
                  className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2 outline-none font-mono"
                  placeholder="e.g. EA_STRADDLE"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={testing}
              className="w-full py-2.5 border border-[#00f3ff] bg-[#00f3ff] text-black font-bold text-xs uppercase hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
              <Play className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'EXECUTING API HANDSHAKE...' : 'TEST EA API VERIFICATION NOW'}</span>
            </button>
          </form>

          {/* Test Response Display */}
          {testResult && (
            <div className={`p-4 border font-mono text-xs space-y-2 ${
              testResult.valid 
                ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300' 
                : 'bg-red-950/30 border-red-500 text-red-300'
            }`}>
              <div className="flex justify-between items-center font-bold border-b border-white/10 pb-1">
                <span>API RESULT: {testResult.valid ? 'VALID [TRADING ALLOWED]' : 'INVALID [TRADING BLOCKED]'}</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-black border border-current">
                  {testResult.status || 'RESPONSE'}
                </span>
              </div>
              <pre className="text-[11px] overflow-x-auto p-2 bg-black/60 border border-white/5 text-gray-200">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Quick presets for testing */}
          <div className="border-t border-[#1a1a2e] pt-3 text-[11px] text-gray-400 space-y-1">
            <div className="text-gray-500 font-bold uppercase">Quick Test Demo Account IDs:</div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button 
                type="button"
                onClick={() => { setTestAccount('12345678'); setTestProduct('EA_STRADDLE'); }}
                className="px-2 py-0.5 bg-[#1a1a2e] hover:bg-[#00f3ff] hover:text-black text-cyan-400 border border-cyan-800"
              >
                12345678 (Active)
              </button>
              <button 
                type="button"
                onClick={() => { setTestAccount('87654321'); setTestProduct('EA_STRADDLE'); }}
                className="px-2 py-0.5 bg-[#1a1a2e] hover:bg-amber-500 hover:text-black text-amber-400 border border-amber-800"
              >
                87654321 (Expired)
              </button>
              <button 
                type="button"
                onClick={() => { setTestAccount('55554444'); setTestProduct('EA_STRADDLE'); }}
                className="px-2 py-0.5 bg-[#1a1a2e] hover:bg-[#ff0055] hover:text-white text-red-400 border border-red-800"
              >
                55554444 (Blocked)
              </button>
              <button 
                type="button"
                onClick={() => { setTestAccount('99999999'); setTestProduct('EA_STRADDLE'); }}
                className="px-2 py-0.5 bg-[#1a1a2e] hover:bg-gray-400 hover:text-black text-gray-300 border border-gray-700"
              >
                99999999 (Unregistered)
              </button>
            </div>
          </div>
        </div>

        {/* Verification Stream Log */}
        <div className="border border-[#1a1a2e] bg-[#0e0e14] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a1a2e] pb-3">
            <div className="flex items-center space-x-2 text-[#ff0055]">
              <Shield className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-wider uppercase text-white">
                RECENT VERIFICATION STREAM LOGS
              </h3>
            </div>
            <button
              onClick={() => setCurrentTab('logs')}
              className="text-[11px] text-[#00f3ff] hover:underline"
            >
              VIEW ALL LOGS →
            </button>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="text-xs text-gray-500 py-8 text-center italic">
                No verification attempts logged yet. Use the tester or run MetaTrader 5 EA.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 border text-xs flex justify-between items-center font-mono ${
                    log.result === 'VALID'
                      ? 'border-emerald-900/50 bg-emerald-950/20 text-emerald-300'
                      : 'border-red-900/50 bg-red-950/20 text-red-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">MT5 ID: {log.mt5_account_id}</span>
                      <span className="text-[10px] text-gray-400">[{log.product_code}]</span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      REASON: <span className="text-gray-200">{log.reason}</span> | IP: {log.ip_address}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-[10px] font-bold ${
                      log.result === 'VALID' ? 'bg-emerald-900 text-emerald-200' : 'bg-red-900 text-red-200'
                    }`}>
                      {log.result}
                    </span>
                    <div className="text-[9px] text-gray-500 mt-1">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
