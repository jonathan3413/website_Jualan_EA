import React, { useState, useEffect } from 'react';
import { VerificationLog } from '../types';
import { Activity, Search, RefreshCw, ShieldCheck, ShieldAlert, Filter } from 'lucide-react';

interface LogsViewProps {
  token: string;
}

export const LogsView: React.FC<LogsViewProps> = ({ token }) => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResult, setFilterResult] = useState<string>('ALL');
  const [searchAccount, setSearchAccount] = useState<string>('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/logs?limit=200', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching verification logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter((log) => {
    if (filterResult !== 'ALL' && log.result !== filterResult) return false;
    if (searchAccount.trim()) {
      const q = searchAccount.toLowerCase();
      return (
        log.mt5_account_id.toLowerCase().includes(q) ||
        log.product_code.toLowerCase().includes(q) ||
        log.reason.toLowerCase().includes(q) ||
        log.ip_address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="border border-[#1a1a2e] bg-[#0e0e14] p-5 space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#ff0055]">
              <Activity className="w-5 h-5 animate-pulse" />
              <h2 className="text-xl font-bold tracking-wider text-white uppercase glitch-text" data-text="EA API VERIFICATION AUDIT LOGS">
                EA API VERIFICATION AUDIT LOGS
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Complete audit trail of all MetaTrader 5 WebRequest API calls made to `/api/license/verify`.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="px-3 py-2 border border-[#00f3ff] bg-[#00f3ff]/10 text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH AUDIT STREAM</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={searchAccount}
              onChange={(e) => setSearchAccount(e.target.value)}
              placeholder="Filter logs by MT5 Account ID, Product Code, Reason, or IP..."
              className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white text-xs pl-9 pr-3 py-2 outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white text-xs pl-9 pr-3 py-2 outline-none appearance-none"
            >
              <option value="ALL">ALL RESULTS</option>
              <option value="VALID">VALID ONLY</option>
              <option value="INVALID">INVALID ONLY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-[#1a1a2e] bg-[#0e0e14] overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1a1a2e] bg-[#08080c] text-[#00f3ff] uppercase tracking-wider font-bold">
              <th className="p-3">TIMESTAMP</th>
              <th className="p-3">MT5 ACCOUNT ID</th>
              <th className="p-3">PRODUCT CODE</th>
              <th className="p-3">RESULT</th>
              <th className="p-3">REASON / DIAGNOSTIC</th>
              <th className="p-3">ORIGIN IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a2e]">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-cyan-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  LOADING VERIFICATION STREAM...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                  No verification audit logs match current filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#12121c] transition-colors font-mono">
                  <td className="p-3 text-gray-400 text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 font-bold text-white text-sm">
                    {log.mt5_account_id}
                  </td>
                  <td className="p-3 text-[#00f3ff] font-bold">
                    {log.product_code}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase ${
                      log.result === 'VALID'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-red-950 text-red-400 border-red-800'
                    }`}>
                      {log.result}
                    </span>
                  </td>
                  <td className="p-3 text-gray-300">
                    <span className={log.result === 'VALID' ? 'text-emerald-300' : 'text-amber-300'}>
                      {log.reason}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400 text-[11px]">
                    {log.ip_address}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
