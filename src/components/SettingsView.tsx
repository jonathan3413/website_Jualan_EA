import React, { useState } from 'react';
import { Settings, Lock, Download, Database, Check, AlertCircle, ShieldCheck } from 'lucide-react';

interface SettingsViewProps {
  token: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ token }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match!');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      setSuccess('Admin password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/system/backup', '_blank');
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="border border-[#1a1a2e] bg-[#0e0e14] p-5 space-y-1">
        <div className="flex items-center space-x-2 text-[#00f3ff]">
          <Settings className="w-5 h-5" />
          <h2 className="text-xl font-bold tracking-wider text-white uppercase glitch-text" data-text="SYSTEM & SECURITY SETTINGS">
            SYSTEM & SECURITY SETTINGS
          </h2>
        </div>
        <p className="text-xs text-gray-400">
          Manage operator authentication credentials, database backup exports, and environment configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Change Box */}
        <div className="border border-[#1a1a2e] bg-[#0e0e14] p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#1a1a2e] pb-2 text-[#ff0055]">
            <Lock className="w-4 h-4" />
            <h3 className="font-bold text-white uppercase">CHANGE OPERATOR PASSWORD</h3>
          </div>

          {error && (
            <div className="p-2.5 bg-red-950 border border-red-800 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-gray-300 mb-1">CURRENT PASSWORD:</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">NEW PASSWORD (MIN 6 CHARS):</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">CONFIRM NEW PASSWORD:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 border border-[#ff0055] bg-[#ff0055] text-white font-bold uppercase hover:bg-white hover:text-black transition-colors"
            >
              {loading ? 'UPDATE-IN-PROGRESS...' : 'UPDATE ADMIN PASSWORD NOW'}
            </button>
          </form>
        </div>

        {/* Database Backup & System Diagnostics Box */}
        <div className="border border-[#1a1a2e] bg-[#0e0e14] p-5 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-[#1a1a2e] pb-2 text-[#00f3ff]">
              <Database className="w-4 h-4" />
              <h3 className="font-bold text-white uppercase">DATABASE EXPORT & BACKUP</h3>
            </div>
            <p className="text-gray-400">
              Download complete database payload containing clients, products, active licenses, and verification logs in JSON format for offline backup or migration.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="w-full py-2.5 border border-[#00f3ff] bg-[#00f3ff]/10 text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black font-bold uppercase transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD DATABASE BACKUP (.JSON)</span>
            </button>
          </div>

          <div className="space-y-2 border-t border-[#1a1a2e] pt-4">
            <div className="font-bold text-gray-300 uppercase">SERVER ENVIRONMENT STATUS</div>
            <div className="bg-[#07070a] p-3 border border-[#1a1a2e] space-y-1.5 text-gray-400">
              <div><span className="text-gray-500">RUNTIME SERVER:</span> Express.js on Node.js</div>
              <div><span className="text-gray-500">PORT:</span> 3000 (Cloud Run Container Ingress)</div>
              <div><span className="text-gray-500">AUTH DRIVER:</span> JWT + bcryptjs Hashing</div>
              <div><span className="text-gray-500">DATABASE BACKEND:</span> Dual Local JSON / PostgreSQL</div>
              <div><span className="text-gray-500">VERCEL SUPPORT:</span> Serverless Stateless REST Engine</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
