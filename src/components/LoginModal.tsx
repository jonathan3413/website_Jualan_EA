import React, { useState } from 'react';
import { Shield, Lock, User, Terminal, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login authentication failed');

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#07070a]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md border-2 border-[#00f3ff] bg-[#0e0e14] p-6 space-y-5 shadow-[0_0_30px_rgba(0,243,255,0.3)] relative overflow-hidden">
        {/* Top Glitch Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00f3ff] via-[#ff0055] to-[#00f3ff]" />

        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-2 border-[#00f3ff] bg-[#ff0055]/10 mx-auto flex items-center justify-center text-[#00f3ff]">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-xl font-black text-white tracking-widest uppercase glitch-text" data-text="EA LICENSE OPERATOR AUTH">
            EA LICENSE OPERATOR AUTH
          </h2>
          <p className="text-xs text-cyan-400/80">
            METATRADER 5 LICENSE MANAGEMENT SYSTEM
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1">OPERATOR USERNAME:</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white pl-9 pr-3 py-2 outline-none font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-1">PASSWORD:</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white pl-9 pr-3 py-2 outline-none font-bold"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 border-2 border-[#00f3ff] bg-[#00f3ff] text-black font-extrabold text-xs uppercase hover:bg-white transition-colors tracking-widest shadow-[0_0_15px_#00f3ff]"
          >
            {loading ? 'AUTHENTICATING HANDSHAKE...' : 'LOGIN TO LICENSE DASHBOARD'}
          </button>
        </form>

        <div className="p-3 border border-[#1a1a2e] bg-[#07070a] text-[10px] text-gray-400 space-y-1">
          <div className="font-bold text-cyan-400">DEFAULT DEMO CREDENTIALS:</div>
          <div>Username: <code className="text-white">admin</code></div>
          <div>Password: <code className="text-white">admin123</code></div>
        </div>
      </div>
    </div>
  );
};
