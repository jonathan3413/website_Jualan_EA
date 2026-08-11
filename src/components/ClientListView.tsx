import React, { useState, useEffect } from 'react';
import { Client, License } from '../types';
import { Search, Filter, Edit, Clock, ShieldAlert, CheckCircle, Ban, RefreshCw, ChevronLeft, ChevronRight, Key, Eye, UserPlus } from 'lucide-react';

interface ClientListViewProps {
  setCurrentTab: (tab: string) => void;
  token: string;
}

export const ClientListView: React.FC<ClientListViewProps> = ({ setCurrentTab, token }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [modalType, setModalType] = useState<'extend' | 'changeAccount' | 'view' | 'edit' | null>(null);

  // Form inputs for modals
  const [extendMonths, setExtendMonths] = useState(3);
  const [newMt5Id, setNewMt5Id] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchClients = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        status: statusFilter
      });
      const res = await fetch(`/api/clients?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setClients(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalCount(result.pagination.total);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, search, statusFilter, token]);

  const handleExtendLicense = async () => {
    if (!selectedLicense) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/licenses/${selectedLicense.id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ months: extendMonths })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extend license');
      setActionSuccess(`License extended by ${extendMonths} months successfully!`);
      setTimeout(() => {
        setModalType(null);
        fetchClients();
      }, 1200);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleChangeAccount = async () => {
    if (!selectedLicense || !newMt5Id) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/licenses/${selectedLicense.id}/change-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newMt5AccountId: newMt5Id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update MT5 ID');
      setActionSuccess('MT5 Account ID updated successfully!');
      setTimeout(() => {
        setModalType(null);
        fetchClients();
      }, 1200);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleToggleBlock = async (license: License, currentStatus: string) => {
    const endpoint = currentStatus === 'BLOCKED' ? 'activate' : 'block';
    try {
      const res = await fetch(`/api/licenses/${license.id}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchClients();
      }
    } catch (error) {
      console.error('Error toggling block state:', error);
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          notes: editNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update client');
      setActionSuccess('Client information updated successfully!');
      setTimeout(() => {
        setModalType(null);
        fetchClients();
      }, 1200);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header & Controls Bar */}
      <div className="border border-[#1a1a2e] bg-[#0e0e14] p-5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1a1a2e] pb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wider uppercase glitch-text" data-text="CLIENT LICENSE MANAGEMENT">
              CLIENT LICENSE MANAGEMENT
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Total Registered Clients: <span className="text-[#00f3ff] font-bold">{totalCount}</span>
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('create-client')}
            className="px-4 py-2 border border-[#00f3ff] bg-[#00f3ff] text-black font-bold text-xs uppercase hover:bg-white transition-colors flex items-center gap-2 shadow-[0_0_10px_#00f3ff]"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ADD NEW CLIENT</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by Client Name, Email, Phone, or MT5 Account ID..."
              className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white text-xs pl-9 pr-3 py-2 outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full bg-[#07070a] border border-[#1a1a2e] focus:border-[#00f3ff] text-white text-xs pl-9 pr-3 py-2 outline-none appearance-none"
            >
              <option value="">ALL STATUSES</option>
              <option value="ACTIVE">ACTIVE ONLY</option>
              <option value="EXPIRED">EXPIRED ONLY</option>
              <option value="BLOCKED">BLOCKED ONLY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-[#1a1a2e] bg-[#0e0e14] overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1a1a2e] bg-[#08080c] text-[#00f3ff] uppercase tracking-wider font-bold">
              <th className="p-3">CLIENT NAME</th>
              <th className="p-3">MT5 ACCOUNT ID</th>
              <th className="p-3">PRODUCT</th>
              <th className="p-3">START DATE</th>
              <th className="p-3">EXPIRY DATE</th>
              <th className="p-3">SISA HARI</th>
              <th className="p-3">STATUS</th>
              <th className="p-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a2e]">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-cyan-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  LOADING CLIENT DATA MATRIX...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500 italic">
                  No clients or MT5 licenses found matching filter parameters.
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const primaryLicense = client.licenses[0];
                const daysLeft = primaryLicense?.daysRemaining ?? 0;
                const status = primaryLicense?.status || 'UNKNOWN';

                return (
                  <tr key={client.id} className="hover:bg-[#12121c] transition-colors">
                    {/* Name */}
                    <td className="p-3 font-bold text-white">
                      <div>{client.name}</div>
                      <div className="text-[10px] text-gray-400 font-normal">{client.email || client.phone || 'No Contact'}</div>
                    </td>

                    {/* MT5 ID */}
                    <td className="p-3 font-bold text-[#00f3ff] font-mono">
                      {primaryLicense ? primaryLicense.mt5_account_id : 'N/A'}
                    </td>

                    {/* Product */}
                    <td className="p-3 text-gray-300">
                      {primaryLicense?.product?.name || primaryLicense?.product_id || 'EA_STRADDLE'}
                    </td>

                    {/* Start Date */}
                    <td className="p-3 text-gray-400 font-mono">
                      {primaryLicense?.start_date || '-'}
                    </td>

                    {/* Expiry Date */}
                    <td className="p-3 text-gray-200 font-mono font-bold">
                      {primaryLicense?.expiry_date || '-'}
                    </td>

                    {/* Sisa Hari */}
                    <td className="p-3 font-mono">
                      {daysLeft > 0 ? (
                        <span className={`font-bold ${daysLeft <= 7 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                          {daysLeft} HARI
                        </span>
                      ) : (
                        <span className="text-red-400 font-bold">0 HARI [EXPIRED]</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase ${
                        status === 'ACTIVE'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                          : status === 'EXPIRED'
                          ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                          : 'bg-red-950/60 text-[#ff0055] border-red-800'
                      }`}>
                        {status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* View details */}
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setSelectedLicense(primaryLicense);
                            setModalType('view');
                          }}
                          className="p-1.5 border border-[#1a1a2e] hover:border-[#00f3ff] text-gray-300 hover:text-[#00f3ff] bg-[#07070a]"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Extend License */}
                        {primaryLicense && (
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setSelectedLicense(primaryLicense);
                              setModalType('extend');
                              setActionError('');
                              setActionSuccess('');
                            }}
                            className="p-1.5 border border-[#1a1a2e] hover:border-emerald-500 text-gray-300 hover:text-emerald-400 bg-[#07070a]"
                            title="Extend License"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Change MT5 Account ID */}
                        {primaryLicense && (
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setSelectedLicense(primaryLicense);
                              setNewMt5Id(primaryLicense.mt5_account_id);
                              setModalType('changeAccount');
                              setActionError('');
                              setActionSuccess('');
                            }}
                            className="p-1.5 border border-[#1a1a2e] hover:border-amber-500 text-gray-300 hover:text-amber-400 bg-[#07070a]"
                            title="Change MT5 Account ID"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Block/Unblock toggle */}
                        {primaryLicense && (
                          <button
                            onClick={() => handleToggleBlock(primaryLicense, status)}
                            className={`p-1.5 border ${
                              status === 'BLOCKED'
                                ? 'border-emerald-800 text-emerald-400 hover:bg-emerald-900'
                                : 'border-red-900 text-red-400 hover:bg-red-950'
                            } bg-[#07070a]`}
                            title={status === 'BLOCKED' ? 'Unblock / Activate' : 'Block License'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit Client Info */}
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setEditName(client.name);
                            setEditEmail(client.email);
                            setEditPhone(client.phone);
                            setEditNotes(client.notes);
                            setModalType('edit');
                            setActionError('');
                            setActionSuccess('');
                          }}
                          className="p-1.5 border border-[#1a1a2e] hover:border-[#ff0055] text-gray-300 hover:text-[#ff0055] bg-[#07070a]"
                          title="Edit Client Info"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="p-3 border-t border-[#1a1a2e] bg-[#08080c] flex justify-between items-center text-xs">
          <div className="text-gray-400">
            PAGE {page} OF {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 border border-[#1a1a2e] bg-[#0e0e14] text-white hover:border-[#00f3ff] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 inline" /> PREV
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border border-[#1a1a2e] bg-[#0e0e14] text-white hover:border-[#00f3ff] disabled:opacity-40"
            >
              NEXT <ChevronRight className="w-4 h-4 inline" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      {modalType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0e14] border-2 border-[#00f3ff] p-6 max-w-md w-full font-mono text-xs space-y-4 shadow-[0_0_20px_#00f3ff]">
            {/* Extend Modal */}
            {modalType === 'extend' && (
              <>
                <h3 className="text-base font-bold text-white border-b border-[#1a1a2e] pb-2 text-emerald-400 uppercase">
                  EXTEND LICENSE DURATION
                </h3>
                <p className="text-gray-300">
                  Client: <span className="font-bold text-white">{selectedClient?.name}</span>
                  <br />
                  Current Expiry: <span className="text-[#00f3ff]">{selectedLicense?.expiry_date}</span>
                </p>

                <div className="space-y-2">
                  <label className="block text-gray-400">SELECT EXTENSION PERIOD:</label>
                  <select
                    value={extendMonths}
                    onChange={(e) => setExtendMonths(parseInt(e.target.value, 10))}
                    className="w-full bg-[#07070a] border border-[#1a1a2e] text-white p-2 outline-none focus:border-emerald-500"
                  >
                    <option value={1}>1 MONTH (+30 DAYS)</option>
                    <option value={3}>3 MONTHS (+90 DAYS)</option>
                    <option value={6}>6 MONTHS (+180 DAYS)</option>
                    <option value={12}>12 MONTHS (+365 DAYS)</option>
                  </select>
                  <p className="text-[10px] text-gray-500 italic">
                    If license is currently ACTIVE, extension adds to expiry date. If EXPIRED, extension calculates from TODAY.
                  </p>
                </div>

                {actionError && <div className="p-2 bg-red-950 text-red-300 border border-red-800">{actionError}</div>}
                {actionSuccess && <div className="p-2 bg-emerald-950 text-emerald-300 border border-emerald-800">{actionSuccess}</div>}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setModalType(null)}
                    className="px-3 py-1.5 border border-gray-700 hover:bg-gray-800 text-gray-300"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleExtendLicense}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    CONFIRM EXTEND
                  </button>
                </div>
              </>
            )}

            {/* Change Account ID Modal */}
            {modalType === 'changeAccount' && (
              <>
                <h3 className="text-base font-bold text-white border-b border-[#1a1a2e] pb-2 text-amber-400 uppercase">
                  CHANGE MT5 ACCOUNT ID
                </h3>
                <p className="text-gray-300">
                  Client: <span className="font-bold text-white">{selectedClient?.name}</span>
                </p>

                <div className="space-y-2">
                  <label className="block text-gray-400">NEW MT5 ACCOUNT ID:</label>
                  <input
                    type="text"
                    value={newMt5Id}
                    onChange={(e) => setNewMt5Id(e.target.value)}
                    className="w-full bg-[#07070a] border border-[#1a1a2e] text-white p-2 outline-none focus:border-amber-500"
                    placeholder="Enter new MT5 account login number"
                  />
                  <p className="text-[10px] text-amber-500/80">
                    * Old Account ID will automatically become invalid and blocked from trading immediately.
                  </p>
                </div>

                {actionError && <div className="p-2 bg-red-950 text-red-300 border border-red-800">{actionError}</div>}
                {actionSuccess && <div className="p-2 bg-emerald-950 text-emerald-300 border border-emerald-800">{actionSuccess}</div>}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setModalType(null)}
                    className="px-3 py-1.5 border border-gray-700 text-gray-300"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleChangeAccount}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold"
                  >
                    UPDATE ACCOUNT ID
                  </button>
                </div>
              </>
            )}

            {/* Edit Client Info Modal */}
            {modalType === 'edit' && (
              <>
                <h3 className="text-base font-bold text-white border-b border-[#1a1a2e] pb-2 text-[#ff0055] uppercase">
                  EDIT CLIENT INFORMATION
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 mb-1">CLIENT NAME:</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#07070a] border border-[#1a1a2e] text-white p-2 outline-none focus:border-[#ff0055]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">EMAIL:</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-[#07070a] border border-[#1a1a2e] text-white p-2 outline-none focus:border-[#ff0055]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">PHONE:</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-[#07070a] border border-[#1a1a2e] text-white p-2 outline-none focus:border-[#ff0055]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">NOTES:</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-[#07070a] border border-[#1a1a2e] text-white p-2 outline-none focus:border-[#ff0055]"
                    />
                  </div>
                </div>

                {actionError && <div className="p-2 bg-red-950 text-red-300 border border-red-800">{actionError}</div>}
                {actionSuccess && <div className="p-2 bg-emerald-950 text-emerald-300 border border-emerald-800">{actionSuccess}</div>}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setModalType(null)}
                    className="px-3 py-1.5 border border-gray-700 text-gray-300"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleEditClient}
                    className="px-4 py-1.5 bg-[#ff0055] hover:bg-red-500 text-white font-bold"
                  >
                    SAVE CHANGES
                  </button>
                </div>
              </>
            )}

            {/* View Modal */}
            {modalType === 'view' && (
              <>
                <h3 className="text-base font-bold text-white border-b border-[#1a1a2e] pb-2 text-[#00f3ff] uppercase">
                  FULL CLIENT METADATA
                </h3>

                <div className="space-y-2 text-gray-300 bg-[#07070a] p-3 border border-[#1a1a2e]">
                  <div><span className="text-gray-500">CLIENT ID:</span> {selectedClient?.id}</div>
                  <div><span className="text-gray-500">NAME:</span> {selectedClient?.name}</div>
                  <div><span className="text-gray-500">EMAIL:</span> {selectedClient?.email || '-'}</div>
                  <div><span className="text-gray-500">PHONE:</span> {selectedClient?.phone || '-'}</div>
                  <div><span className="text-gray-500">NOTES:</span> {selectedClient?.notes || '-'}</div>
                  <div><span className="text-gray-500">MT5 ACCOUNT ID:</span> <span className="text-[#00f3ff] font-bold">{selectedLicense?.mt5_account_id}</span></div>
                  <div><span className="text-gray-500">BROKER:</span> {selectedLicense?.broker}</div>
                  <div><span className="text-gray-500">SERVER:</span> {selectedLicense?.server}</div>
                  <div><span className="text-gray-500">START DATE:</span> {selectedLicense?.start_date}</div>
                  <div><span className="text-gray-500">EXPIRY DATE:</span> {selectedLicense?.expiry_date}</div>
                  <div><span className="text-gray-500">DAYS LEFT:</span> {selectedLicense?.daysRemaining} DAYS</div>
                  <div><span className="text-gray-500">LAST VERIFIED:</span> {selectedLicense?.last_verification ? new Date(selectedLicense.last_verification).toLocaleString() : 'Never'}</div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setModalType(null)}
                    className="px-4 py-1.5 bg-[#00f3ff] text-black font-bold"
                  >
                    CLOSE
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
