import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { UserPlus, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreateClientViewProps {
  setCurrentTab: (tab: string) => void;
  token: string;
}

export const CreateClientView: React.FC<CreateClientViewProps> = ({ setCurrentTab, token }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mt5AccountId, setMt5AccountId] = useState('');
  const [broker, setBroker] = useState('IC Markets SC');
  const [serverName, setServerName] = useState('ICMarketsSC-Live');
  const [productId, setProductId] = useState('');
  const [durationMonths, setDurationMonths] = useState(3);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
          if (data.length > 0) {
            setProductId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!name.trim()) {
      setError('Client Name is required.');
      return;
    }
    if (!mt5AccountId.trim()) {
      setError('MT5 Account ID is required.');
      return;
    }
    if (!productId) {
      setError('Product selection is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          mt5AccountId: mt5AccountId.trim(),
          broker: broker.trim(),
          server: serverName.trim(),
          productId,
          durationMonths: Number(durationMonths),
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create client license.');
      }

      setSuccess(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during creation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto font-mono space-y-6">
      {/* Form Header */}
      <div className="border border-[#00f3ff]/40 bg-[#0e0e14] p-5 space-y-1">
        <div className="flex items-center space-x-2 text-[#00f3ff]">
          <UserPlus className="w-5 h-5" />
          <h2 className="text-xl font-bold tracking-wider text-white uppercase glitch-text" data-text="REGISTER NEW CLIENT & EA LICENSE">
            REGISTER NEW CLIENT & EA LICENSE
          </h2>
        </div>
        <p className="text-xs text-gray-400">
          Create client profile and automatically generate an active MetaTrader 5 license key linked to their MT5 login account.
        </p>
      </div>

      {success ? (
        <div className="border-2 border-emerald-500 bg-emerald-950/40 p-6 space-y-4 text-xs">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>CLIENT & EA LICENSE CREATED SUCCESSFULLY!</span>
          </div>

          <div className="bg-[#07070a] p-4 border border-emerald-900 space-y-2 text-gray-200">
            <div><span className="text-gray-400">CLIENT NAME:</span> {success.client.name}</div>
            <div><span className="text-gray-400">MT5 ACCOUNT ID:</span> <span className="text-[#00f3ff] font-bold">{success.license.mt5_account_id}</span></div>
            <div><span className="text-gray-400">START DATE:</span> {success.license.start_date}</div>
            <div><span className="text-gray-400">EXPIRY DATE:</span> <span className="text-emerald-400 font-bold">{success.license.expiry_date}</span> (3 Months Duration)</div>
            <div><span className="text-gray-400">STATUS:</span> <span className="px-2 py-0.5 bg-emerald-900 text-emerald-300 font-bold">ACTIVE</span></div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setSuccess(null);
                setName('');
                setMt5AccountId('');
                setEmail('');
                setPhone('');
                setNotes('');
              }}
              className="px-4 py-2 border border-[#00f3ff] bg-[#00f3ff] text-black font-bold uppercase hover:bg-white"
            >
              + CREATE ANOTHER CLIENT
            </button>
            <button
              onClick={() => setCurrentTab('clients')}
              className="px-4 py-2 border border-gray-600 bg-gray-800 text-white font-bold uppercase hover:bg-gray-700"
            >
              VIEW CLIENT LIST →
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border border-[#1a1a2e] bg-[#0e0e14] p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Client Metadata */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#00f3ff] uppercase border-b border-[#1a1a2e] pb-1">
              1. CLIENT IDENTITY
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">FULL NAME <span className="text-[#ff0055]">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ahmad Sudirman"
                  className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2.5 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ahmad@example.com"
                  className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">PHONE NUMBER / WHATSAPP</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +6281234567890"
                  className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">NOTES / INTERNAL MEMO</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. VIP Trader - Straddle Strategy Client"
                  className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2.5 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: MT5 Account & License Config */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-[#ff0055] uppercase border-b border-[#1a1a2e] pb-1">
              2. MT5 ACCOUNT & LICENSE CONFIGURATION
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">
                  MT5 ACCOUNT ID (LOGIN NUMBER) <span className="text-[#ff0055]">*</span>
                </label>
                <input
                  type="text"
                  value={mt5AccountId}
                  onChange={(e) => setMt5AccountId(e.target.value)}
                  placeholder="e.g. 12345678 (Automatic AccountInfoInteger)"
                  className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#ff0055] text-white p-2.5 outline-none font-bold font-mono"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  * Must match the client's MT5 login number fetched by EA via AccountInfoInteger(ACCOUNT_LOGIN).
                </p>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">PRODUCT EA</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2.5 outline-none"
                  disabled={loadingProducts}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.product_code}] v{p.version}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">BROKER NAME</label>
                <input
                  type="text"
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
                  placeholder="e.g. IC Markets / Exness"
                  className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">MT5 SERVER NAME</label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="e.g. ICMarketsSC-Live"
                  className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2.5 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-300 mb-1">LICENSE DURATION (MIN 3 MONTHS)</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2.5 outline-none font-bold"
                >
                  <option value={3}>3 MONTHS (MINIMUM DURATION)</option>
                  <option value={6}>6 MONTHS (+180 DAYS)</option>
                  <option value={12}>12 MONTHS (1 YEAR ACCESS)</option>
                  <option value={24}>24 MONTHS (2 YEARS ACCESS)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1a1a2e]">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 border-2 border-[#00f3ff] bg-[#00f3ff] text-black font-extrabold text-xs uppercase hover:bg-white transition-colors tracking-widest shadow-[0_0_15px_#00f3ff]"
            >
              {submitting ? 'GENERATING CLIENT & LICENSE...' : 'GENERATE & ACTIVATING CLIENT LICENSE NOW'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
