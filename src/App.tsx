import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ClientListView } from './components/ClientListView';
import { CreateClientView } from './components/CreateClientView';
import { ProductsView } from './components/ProductsView';
import { LogsView } from './components/LogsView';
import { EACodeView } from './components/EACodeView';
import { GuidesView } from './components/GuidesView';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [token, setToken] = useState<string | null>(localStorage.getItem('ea_token'));
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setAuthChecked(true);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem('ea_token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
      } finally {
        setAuthChecked(true);
      }
    };
    verifyToken();
  }, [token]);

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem('ea_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('ea_token');
    setToken(null);
    setUser(null);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#07070a] text-[#00f3ff] flex items-center justify-center font-mono text-xs">
        INITIALIZING EA LICENSE SYSTEM MATRIX...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-gray-100 scanlines cyber-grid pb-12">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {!token ? (
          <LoginModal onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView setCurrentTab={setCurrentTab} token={token} />
            )}
            {currentTab === 'clients' && (
              <ClientListView setCurrentTab={setCurrentTab} token={token} />
            )}
            {currentTab === 'create-client' && (
              <CreateClientView setCurrentTab={setCurrentTab} token={token} />
            )}
            {currentTab === 'products' && (
              <ProductsView token={token} />
            )}
            {currentTab === 'logs' && (
              <LogsView token={token} />
            )}
            {currentTab === 'ea-code' && (
              <EACodeView />
            )}
            {currentTab === 'guides' && (
              <GuidesView />
            )}
            {currentTab === 'settings' && (
              <SettingsView token={token} />
            )}
          </>
        )}
      </main>

      {/* Footer / System Copyright */}
      <footer className="max-w-7xl mx-auto px-4 pt-8 text-center text-[10px] text-gray-600 font-mono space-y-1">
        <div>MT5 EA LICENSE MANAGER v1.0.0 // NODE.JS REST API // MQL5 WEBREQUEST GATEWAY</div>
        <div>STRICT LICENSE ENFORCEMENT ENGINE — EXCLUSIVE FOR METATRADER 5 ACCOUNTS</div>
      </footer>
    </div>
  );
}
