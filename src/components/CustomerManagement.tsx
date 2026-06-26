import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CustomerType, CustomerInfo } from '../types';
import { Plus, Edit2, Trash2, Save, X, Search, Layers, UserCheck, CheckCircle, AlertTriangle } from 'lucide-react';

interface CustomerManagementProps {
  customerTypes: CustomerType[];
  customers: CustomerInfo[];
  setCustomerTypes: (types: CustomerType[]) => void;
  setCustomers: (customers: CustomerInfo[]) => void;
  viewMode: 'type' | 'info'; // 'type' = Setup customer type, 'info' = Setup customer info
}

export default function CustomerManagement({
  customerTypes,
  customers,
  setCustomerTypes,
  setCustomers,
  viewMode
}: CustomerManagementProps) {
  // Common states
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for Customer Type Choice
  const [typeCode, setTypeCode] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');

  // Form states for Customer Info Choice
  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [custTypeId, setCustTypeId] = useState('');
  const [custContact, setCustContact] = useState('');
  const [custTel, setCustTel] = useState('');
  const [custDistrict, setCustDistrict] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // State to toggle insertion form
  const [formOpen, setFormOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setTypeCode('');
    setTypeName('');
    setTypeDesc('');
    setCustCode('');
    setCustName('');
    setCustTypeId('');
    setCustContact('');
    setCustTel('');
    setCustDistrict('');
    setCustAddress('');
    setFormOpen(false);
  };

  const handleOpenCreateForm = () => {
    resetForm();
    if (viewMode === 'type') {
      const codes = customerTypes.map(t => t.code.trim().toUpperCase());
      let nextNum = 1;
      codes.forEach(code => {
        const match = code.match(/CT[-_]?0*(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num >= nextNum) {
            nextNum = num + 1;
          }
        }
      });
      if (nextNum === 1 && customerTypes.length > 0) {
        nextNum = customerTypes.length + 1;
      }
      const paddedNum = String(nextNum).padStart(3, '0');
      setTypeCode(`CT-${paddedNum}`);
    } else {
      const codes = customers.map(c => c.code.trim().toUpperCase());
      let nextNum = 1;
      codes.forEach(code => {
        const match = code.match(/CUST[-_]?0*(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num >= nextNum) {
            nextNum = num + 1;
          }
        }
      });
      if (nextNum === 1 && customers.length > 0) {
        nextNum = customers.length + 1;
      }
      const paddedNum = String(nextNum).padStart(3, '0');
      setCustCode(`CUST-${paddedNum}`);
    }
    setFormOpen(true);
  };

  // Save Customer Type
  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeCode || !typeName) return;

    if (editingId) {
      setCustomerTypes(
        customerTypes.map((t) =>
          t.id === editingId
            ? { ...t, code: typeCode, name: typeName, description: typeDesc }
            : t
        )
      );
    } else {
      const newType: CustomerType = {
        id: 'ct-' + Date.now(),
        code: typeCode.toUpperCase(),
        name: typeName,
        description: typeDesc
      };
      setCustomerTypes([...customerTypes, newType]);
    }
    resetForm();
  };

  // Edit Customer Type trigger
  const handleEditType = (type: CustomerType) => {
    setEditingId(type.id);
    setTypeCode(type.code);
    setTypeName(type.name);
    setTypeDesc(type.description);
    setFormOpen(true);
  };

  // Delete Customer Type
  const handleDeleteType = (id: string) => {
    setConfirmState({
      title: 'Delete Customer Type',
      message: 'Are you sure you want to delete this customer type? Customers tied to this type will become uncategorized.',
      onConfirm: () => {
        setCustomerTypes(customerTypes.filter((t) => t.id !== id));
        setConfirmState(null);
        setAlertMsg({ type: 'success', text: 'Customer type deleted successfully.' });
        setTimeout(() => setAlertMsg(null), 3000);
      }
    });
  };

  // Save Customer Info
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custCode || !custName || !custTypeId) {
      setAlertMsg({ type: 'error', text: 'Please fill out Code, Name, and Customer Type.' });
      setTimeout(() => setAlertMsg(null), 4000);
      return;
    }

    if (editingId) {
      setCustomers(
        customers.map((c) =>
          c.id === editingId
            ? {
                ...c,
                code: custCode,
                name: custName,
                typeId: custTypeId,
                contactPerson: custContact,
                tel: custTel,
                district: custDistrict,
                address: custAddress
              }
            : c
        )
      );
    } else {
      const newCust: CustomerInfo = {
        id: 'c-' + Date.now(),
        code: custCode.toUpperCase(),
        name: custName,
        typeId: custTypeId,
        contactPerson: custContact,
        tel: custTel,
        district: custDistrict,
        address: custAddress
      };
      setCustomers([...customers, newCust]);
    }
    resetForm();
  };

  // Edit Customer click
  const handleEditCustomer = (cust: CustomerInfo) => {
    setEditingId(cust.id);
    setCustCode(cust.code);
    setCustName(cust.name);
    setCustTypeId(cust.typeId);
    setCustContact(cust.contactPerson);
    setCustTel(cust.tel);
    setCustDistrict(cust.district);
    setCustAddress(cust.address || '');
    setFormOpen(true);
  };

  // Delete Customer
  const handleDeleteCustomer = (id: string) => {
    setConfirmState({
      title: 'Delete Customer',
      message: 'Are you sure you want to delete this customer?',
      onConfirm: () => {
        setCustomers(customers.filter((c) => c.id !== id));
        setConfirmState(null);
        setAlertMsg({ type: 'success', text: 'Customer deleted successfully.' });
        setTimeout(() => setAlertMsg(null), 3000);
      }
    });
  };

  const filteredTypes = customerTypes.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter((c) => {
    const typeName = customerTypes.find((t) => t.id === c.typeId)?.name || '';
    return (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      typeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div id="customer-mgmt" className="p-6 w-full space-y-6 font-sans text-white">
      {/* Title block with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {viewMode === 'type' ? (
              <>
                <Layers className="w-5 h-5 text-cyan-400 font-bold" />
                <span>Customer Type Registry</span>
              </>
            ) : (
              <>
                <UserCheck className="w-5 h-5 text-cyan-400 font-bold" />
                <span>Customer Information Directory</span>
              </>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1 pb-1">
            {viewMode === 'type'
              ? 'Define customer groups (wholesalers, supermarkets, sub-dealers) to control pricing levels.'
              : 'Add contact details, addresses, and assign category classes to each wholesale or retail outlet.'}
          </p>
        </div>

        {/* Action Button */}
        {!formOpen && (
          <button
            onClick={handleOpenCreateForm}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 font-semibold flex items-center gap-1.5 transition-all self-start cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>{viewMode === 'type' ? 'Define New Type' : 'Register Customer'}</span>
          </button>
        )}
      </div>

      {/* Insert or Update Form Panel */}
      {formOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl p-6 rounded-2xl max-w-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <h2 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              {editingId ? 'Modify Details' : 'Register Entry'}
            </h2>
            <button
              onClick={resetForm}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {viewMode === 'type' ? (
            /* Customer Type Form */
            <form onSubmit={handleSaveType} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH"
                    value={typeCode}
                    onChange={(e) => setTypeCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white rounded placeholder-slate-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Type Label Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bulk Wholesaler"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white rounded placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Key traits or discount levels related to this group..."
                  value={typeDesc}
                  onChange={(e) => setTypeDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white rounded resize-none placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs transition-all font-semibold flex items-center gap-1 shadow-lg shadow-blue-500/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Update & Save' : 'Save Details'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Customer Info Form */
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CUST-012"
                    value={custCode}
                    onChange={(e) => setCustCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white rounded placeholder-slate-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Shop Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Seng Hour Shop"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white rounded placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Type Group *</label>
                  <select
                    required
                    value={custTypeId}
                    onChange={(e) => setCustTypeId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white rounded bg-slate-900"
                  >
                    <option value="" className="bg-slate-900 text-white">-- Please select item --</option>
                    {customerTypes.map((t) => (
                      <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Contact Person</label>
                  <input
                    type="text"
                    placeholder="Manager Name"
                    value={custContact}
                    onChange={(e) => setCustContact(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white rounded placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telephone Account *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 012 345 678"
                    value={custTel}
                    onChange={(e) => setCustTel(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white rounded placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Sen Sok"
                    value={custDistrict}
                    onChange={(e) => setCustDistrict(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white rounded placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. No 24, St 271, Phnom Penh"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white rounded placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs transition-colors font-semibold flex items-center gap-1 shadow-lg shadow-blue-500/25"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Update & Save' : 'Register'}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      {/* Main Listing View */}
      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
        {/* Search & Statistics Filter bar */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search registry records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 placeholder-slate-400"
            />
          </div>

          <div className="text-xs text-slate-300 font-medium">
            Showing <span className="text-cyan-400 font-bold">{viewMode === 'type' ? filteredTypes.length : filteredCustomers.length}</span> entries total
          </div>
        </div>

        {/* Dynamic Table Block */}
        <div className="overflow-x-auto">
          {viewMode === 'type' ? (
            /* Customer Type Table */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/10 text-slate-300 text-[11px] font-bold uppercase border-b border-white/10">
                  <th className="px-5 py-3 w-28">Type Code</th>
                  <th className="px-5 py-3 w-64">Type Name</th>
                  <th className="px-5 py-3">Description / Benefits</th>
                  <th className="px-5 py-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 italic">No customer types match your search.</td>
                  </tr>
                ) : (
                  filteredTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                      <td className="px-5 py-3 font-mono font-semibold text-cyan-300">{type.code}</td>
                      <td className="px-5 py-3 font-medium text-white">{type.name}</td>
                      <td className="px-5 py-3 text-slate-400">{type.description || 'No notes added.'}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditType(type)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                            title="Edit Type"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteType(type.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                            title="Delete Type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* Customer Info Table */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/10 text-slate-300 text-[11px] font-bold uppercase border-b border-white/10">
                  <th className="px-5 py-3 w-24">Cust Code</th>
                  <th className="px-5 py-3">Shop / Company Name</th>
                  <th className="px-5 py-3 w-36">Category Type</th>
                  <th className="px-5 py-3 w-40">Contact Person</th>
                  <th className="px-5 py-3 w-36">Contact Phone</th>
                  <th className="px-5 py-3 w-36">District</th>
                  <th className="px-5 py-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 italic">No customer accounts matches your search.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const matchedType = customerTypes.find((t) => t.id === cust.typeId);
                    return (
                      <tr key={cust.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                        <td className="px-5 py-3 font-mono font-semibold text-cyan-300">{cust.code}</td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-white">{cust.name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{cust.address}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold uppercase">
                            {matchedType ? matchedType.name.split(' / ')[0] : 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-300">{cust.contactPerson || '-'}</td>
                        <td className="px-5 py-3 font-mono text-slate-200 font-semibold">{cust.tel}</td>
                        <td className="px-5 py-3 text-slate-400">{cust.district}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            <button
                              onClick={() => handleEditCustomer(cust)}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                              title="Edit Customer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(cust.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                              title="Delete Customer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Custom Confirmation Dialog */}
      {confirmState && (
        <div id="confirm-modal-customer" className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative text-left"
          >
            <div className="flex items-center gap-3 text-cyan-400">
              <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{confirmState.title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{confirmState.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                onClick={confirmState.onConfirm}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/10 cursor-pointer font-sans"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating alert notifications */}
      {alertMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-16 right-6 z-50 bg-[#0f172a]/95 backdrop-blur-md text-white border px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-semibold text-xs ${
            alertMsg.type === 'success' ? 'border-emerald-500/30' : 'border-rose-500/30'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <span>{alertMsg.text}</span>
        </motion.div>
      )}
    </div>
  );
}
