import React, { useState, useEffect } from 'react';
import { Shield, Users, PlusCircle, Package, Activity, Settings, LogOut, Terminal, BookOpen, Download } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, user, onLogout }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: '[1.0] DASHBOARD', icon: Shield },
    { id: 'clients', label: '[2.0] CLIENTS', icon: Users },
    { id: 'create-client', label: '[3.0] CREATE CLIENT', icon: PlusCircle },
    { id: 'products', label: '[4.0] PRODUCTS', icon: Package },
    { id: 'logs', label: '[5.0] VERIFY LOGS', icon: Activity },
    { id: 'ea-code', label: '[6.0] EA MQL5 / CODE', icon: Terminal },
    { id: 'guides', label: '[7.0] CARA RUNNING', icon: BookOpen },
    { id: 'settings', label: '[8.0] SETTINGS', icon: Settings },
  ];

  return (
    <header className="border-b-2 border-[#00f3ff] bg-[#07070a]/90 backdrop-blur sticky top-0 z-50">
      {/* Top Ticker / System Status Bar */}
      <div className="bg-[#0e0e14] border-b border-[#1a1a2e] px-4 py-1 flex flex-wrap justify-between items-center text-[10px] tracking-widest text-[#00f3ff] uppercase font-mono">
        <div className="flex items-center space-x-3">
          <span className="inline-block w-2 h-2 rounded-full bg-[#00f3ff] animate-ping" />
          <span>MT5_LICENSE_SERVER // ONLINE [PORT: 3000]</span>
          <span className="text-gray-500">|</span>
          <span className="text-[#ff0055]">REST_API: /api/license/verify</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">{time}</span>
          {user && (
            <span className="text-emerald-400 border border-emerald-500/30 px-1 bg-emerald-950/40">
              OPERATOR: {user.username.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Main Nav Container */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Brand Header */}
        <div 
          onClick={() => setCurrentTab('dashboard')}
          className="cursor-pointer group flex items-center space-x-3"
        >
          <div className="w-9 h-9 border-2 border-[#00f3ff] bg-[#ff0055]/10 flex items-center justify-center text-[#00f3ff] group-hover:bg-[#00f3ff] group-hover:text-black transition-colors shadow-[0_0_10px_#00f3ff]">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-widest text-white glitch-text" data-text="MT5 EA LICENSE MANAGER">
              MT5 EA LICENSE MANAGER
            </h1>
            <p className="text-[10px] text-cyan-400/70 tracking-widest font-mono">
              PRO-GRADE META-TRADER 5 EA AUTHENTICATION GATEWAY
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 border transition-all ${
                  isActive
                    ? 'bg-[#00f3ff] text-black border-[#00f3ff] font-bold shadow-[0_0_12px_#00f3ff]'
                    : 'bg-[#0e0e14] text-gray-300 border-[#1a1a2e] hover:border-[#ff0055] hover:text-[#ff0055]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {user && (
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 px-3 py-1.5 border border-red-900 bg-red-950/40 text-red-400 hover:bg-red-900 hover:text-white transition-colors"
              title="Logout Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
