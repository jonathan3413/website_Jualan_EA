import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Package, Plus, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface ProductsViewProps {
  token: string;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ token }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New product form
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !productCode.trim()) {
      setError('Product name and product code are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          product_code: productCode.trim().toUpperCase(),
          version: version.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      setSuccess(`Product '${data.name}' [${data.product_code}] registered successfully!`);
      setName('');
      setProductCode('');
      setVersion('1.0.0');
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="border border-[#1a1a2e] bg-[#0e0e14] p-5 space-y-1">
        <div className="flex items-center space-x-2 text-[#00f3ff]">
          <Package className="w-5 h-5" />
          <h2 className="text-xl font-bold tracking-wider text-white uppercase glitch-text" data-text="PRODUCT & EA CODE REGISTRY">
            PRODUCT & EA CODE REGISTRY
          </h2>
        </div>
        <p className="text-xs text-gray-400">
          Manage product codes required for MetaTrader 5 EA verification handshakes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Product Form */}
        <div className="border border-[#1a1a2e] bg-[#0e0e14] p-5 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-[#1a1a2e] pb-2 uppercase text-[#00f3ff]">
            + REGISTER NEW EA PRODUCT
          </h3>

          {error && (
            <div className="p-2.5 bg-red-950 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-300 mb-1">PRODUCT DISPLAY NAME:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MetaTrader 5 Straddle Bot"
                className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">PRODUCT CODE (MATCHES EA INPUT):</label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                placeholder="e.g. EA_STRADDLE"
                className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2 outline-none font-bold"
                required
              />
              <p className="text-[10px] text-gray-500 mt-0.5">
                * EA sends this product code in its JSON payload during verification.
              </p>
            </div>

            <div>
              <label className="block text-gray-300 mb-1">CURRENT EA VERSION:</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0.0"
                className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white p-2 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 border border-[#00f3ff] bg-[#00f3ff] text-black font-bold text-xs uppercase hover:bg-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'REGISTERING...' : 'REGISTER EA PRODUCT'}</span>
            </button>
          </form>
        </div>

        {/* Existing Products List */}
        <div className="lg:col-span-2 border border-[#1a1a2e] bg-[#0e0e14] p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#1a1a2e] pb-2">
            <h3 className="text-sm font-bold text-white uppercase text-[#ff0055]">
              ACTIVE REGISTERED PRODUCTS ({products.length})
            </h3>
            <button
              onClick={fetchProducts}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              RELOAD
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-xs text-cyan-400 py-8 text-center">LOADING PRODUCTS...</div>
            ) : products.length === 0 ? (
              <div className="text-xs text-gray-500 py-8 text-center italic">No products registered yet.</div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="p-3 bg-[#07070a] border border-[#1a1a2e] flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-white text-sm">{p.name}</div>
                    <div className="text-gray-400 mt-0.5">
                      CODE: <span className="text-[#00f3ff] font-bold">{p.product_code}</span> | VERSION: <span className="text-amber-400">{p.version}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                    ACTIVE
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
