import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Warehouse, Item, DMSConfig, SaleRep, PromoPackage } from '../types';
import { 
  Settings, 
  Layers, 
  Home, 
  Tag, 
  MapPin, 
  Edit2, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Mail, 
  Phone, 
  FileCheck,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';

interface GeneralSetupProps {
  warehouses: Warehouse[];
  setWarehouses: (whs: Warehouse[]) => void;
  items: Item[];
  setItems: (items: Item[]) => void;
  saleReps: SaleRep[];
  setSaleReps: (reps: SaleRep[]) => void;
  config: DMSConfig;
  setConfig: (config: DMSConfig) => void;
}

export default function GeneralSetup({
  warehouses,
  setWarehouses,
  items,
  setItems,
  saleReps,
  setSaleReps,
  config,
  setConfig
}: GeneralSetupProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'warehouses' | 'company' | 'sales'>('items');
  const [expandedPromoId, setExpandedPromoId] = useState<string | null>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- ITEM FORM STATES ---
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemUm, setItemUm] = useState('Case');
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [itemPromos, setItemPromos] = useState<PromoPackage[]>([]);

  // --- WAREHOUSE FORM STATES ---
  const [whCode, setWhCode] = useState('');
  const [whName, setWhName] = useState('');
  const [whLoc, setWhLoc] = useState('');

  // --- COMPANY PROFILE FORM STATES ---
  const [compName, setCompName] = useState(config.companyName);
  const [compTin, setCompTin] = useState(config.companyTIN || '');
  const [compPhone, setCompPhone] = useState(config.phone);
  const [compEmail, setCompEmail] = useState(config.email);
  const [compAddress, setCompAddress] = useState(config.address);

  // --- SALES REPRESENTATIVE FORM STATES ---
  const [repCode, setRepCode] = useState('');
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');

  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setItemCode('');
    setItemName('');
    setItemDesc('');
    setItemUm('Case');
    setItemPrice(0);
    setItemPromos([]);
    setWhCode('');
    setWhName('');
    setWhLoc('');
    setRepCode('');
    setRepName('');
    setRepPhone('');
  };

  const handleOpenCreateForm = () => {
    resetForm();
    if (activeTab === 'sales') {
      const repCodes = saleReps.map(sr => sr.code.trim().toUpperCase());
      let nextNum = 1;
      repCodes.forEach(code => {
        const match = code.match(/SR[-_]?0*(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num >= nextNum) {
            nextNum = num + 1;
          }
        }
      });
      const paddedNum = String(nextNum).padStart(3, '0');
      setRepCode(`SR-${paddedNum}`);
    } else if (activeTab === 'items') {
      const itemCodes = items.map(i => i.code.trim().toUpperCase());
      let nextNum = 1;
      itemCodes.forEach(code => {
        const match = code.match(/ITEM[-_]?[a-zA-Z]*0*(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num >= nextNum) {
            nextNum = num + 1;
          }
        }
      });
      if (nextNum === 1 && items.length > 0) {
        nextNum = items.length + 1;
      }
      setItemCode(`ITEM-${String(nextNum).padStart(3, '0')}`);
    } else if (activeTab === 'warehouses') {
      const whsCodes = warehouses.map(w => w.code.trim().toUpperCase());
      let nextNum = 1;
      whsCodes.forEach(code => {
        const match = code.match(/WH[-_]?0*(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num >= nextNum) {
            nextNum = num + 1;
          }
        }
      });
      if (nextNum === 1 && warehouses.length > 0) {
        nextNum = warehouses.length + 1;
      }
      setWhCode(`WH-${String(nextNum).padStart(3, '0')}`);
    }
    setFormOpen(true);
  };

  // Save Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode || !itemName || itemPrice <= 0) {
      setAlertMsg({ type: 'error', text: 'Mandatory parameters: code, label name, and priced rate.' });
      setTimeout(() => setAlertMsg(null), 4000);
      return;
    }

    if (editingId) {
      setItems(items.map(it => it.id === editingId ? {
        ...it,
        code: itemCode.toUpperCase(),
        name: itemName,
        description: itemDesc,
        um: itemUm,
        price: itemPrice,
        promoPackages: itemPromos
      } : it));
    } else {
      const newItem: Item = {
        id: 'item-' + Date.now(),
        code: itemCode.toUpperCase(),
        name: itemName,
        description: itemDesc,
        um: itemUm,
        price: itemPrice,
        promoPackages: itemPromos
      };
      setItems([...items, newItem]);
    }
    resetForm();
  };

  const handleEditItem = (it: Item) => {
    setEditingId(it.id);
    setItemCode(it.code);
    setItemName(it.name);
    setItemDesc(it.description);
    setItemUm(it.um);
    setItemPrice(it.price);
    setItemPromos(it.promoPackages || []);
    setFormOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    setConfirmState({
      title: 'Delete Inventory Item',
      message: 'Are you sure you want to delete this inventory item reference?',
      onConfirm: () => {
        setItems(items.filter(i => i.id !== id));
        setConfirmState(null);
        setAlertMsg({ type: 'success', text: 'Inventory item reference deleted successfully.' });
        setTimeout(() => setAlertMsg(null), 3000);
      }
    });
  };

  // Save Warehouse
  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whCode || !whName) return;

    if (editingId) {
      setWarehouses(warehouses.map(w => w.id === editingId ? {
        ...w,
        code: whCode.toUpperCase(),
        name: whName,
        location: whLoc
      } : w));
    } else {
      const newWh: Warehouse = {
        id: 'wh-' + Date.now(),
        code: whCode.toUpperCase(),
        name: whName,
        location: whLoc
      };
      setWarehouses([...warehouses, newWh]);
    }
    resetForm();
  };

  const handleEditWarehouse = (w: Warehouse) => {
    setEditingId(w.id);
    setWhCode(w.code);
    setWhName(w.name);
    setWhLoc(w.location || '');
    setFormOpen(true);
  };

  const handleDeleteWarehouse = (id: string) => {
    setConfirmState({
      title: 'Delete Warehouse Hub',
      message: 'Are you sure you want to delete this warehouse hub?',
      onConfirm: () => {
        setWarehouses(warehouses.filter(w => w.id !== id));
        setConfirmState(null);
        setAlertMsg({ type: 'success', text: 'Warehouse hub deleted successfully.' });
        setTimeout(() => setAlertMsg(null), 3000);
      }
    });
  };

  // Save Profile config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig({
      companyName: compName,
      companyTIN: compTin,
      phone: compPhone,
      email: compEmail,
      address: compAddress,
      currency: 'USD'
    });
    setAlertMsg({ type: 'success', text: 'Enterprise parameters successfully re-saved!' });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Save Sales Representative
  const handleSaveSaleRep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repCode || !repName) {
      setAlertMsg({ type: 'error', text: 'Mandatory parameters: Code and Full Name.' });
      setTimeout(() => setAlertMsg(null), 4000);
      return;
    }

    if (editingId) {
      setSaleReps(saleReps.map(sr => sr.id === editingId ? {
        ...sr,
        code: repCode.toUpperCase(),
        name: repName,
        phone: repPhone
      } : sr));
      setAlertMsg({ type: 'success', text: 'Sales Representative updated successfully.' });
    } else {
      const newRep: SaleRep = {
        id: 'rep-' + Date.now(),
        code: repCode.toUpperCase(),
        name: repName,
        phone: repPhone
      };
      setSaleReps([...saleReps, newRep]);
      setAlertMsg({ type: 'success', text: 'Sales Representative added successfully.' });
    }
    setTimeout(() => setAlertMsg(null), 3000);
    resetForm();
  };

  const handleEditSaleRep = (sr: SaleRep) => {
    setEditingId(sr.id);
    setRepCode(sr.code);
    setRepName(sr.name);
    setRepPhone(sr.phone || '');
    setFormOpen(true);
  };

  const handleDeleteSaleRep = (id: string, name: string) => {
    setConfirmState({
      title: 'Delete Sales Rep',
      message: `Are you sure you want to delete sales rep ${name}?`,
      onConfirm: () => {
        setSaleReps(saleReps.filter(sr => sr.id !== id));
        setConfirmState(null);
        setAlertMsg({ type: 'success', text: `Sales representative ${name} deleted successfully.` });
        setTimeout(() => setAlertMsg(null), 3000);
      }
    });
  };

  return (
    <div id="general-systems-panel" className="p-6 w-full space-y-6 font-sans text-white select-none">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400 font-bold" />
            <span>General System Preferences & Masters</span>
          </h1>
          <p className="text-xs text-slate-350 mt-1">
            Manage your stock items list, branch warehouse networks, and global enterprise business cards.
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 self-start sm:self-center">
          <button
            onClick={() => { setActiveTab('items'); resetForm(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
              activeTab === 'items' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Items master</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('warehouses'); resetForm(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
              activeTab === 'warehouses' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Depots</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('company'); resetForm(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
              activeTab === 'company' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Business Info</span>
          </button>

          <button
            onClick={() => { setActiveTab('sales'); resetForm(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
              activeTab === 'sales' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sales Setup</span>
          </button>
        </div>
      </div>

      {/* Dynamic Insertion Trigger button (Only for Items, Warehouses, and Sales) */}
      {!formOpen && activeTab !== 'company' && (
        <button
          onClick={handleOpenCreateForm}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/10 font-semibold flex items-center gap-1 cursor-pointer transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>
            {activeTab === 'items' 
              ? 'Create Stock Item' 
              : activeTab === 'warehouses' 
                ? 'Create Depot Yard' 
                : 'Create Sales Rep'}
          </span>
        </button>
      )}

      {/* Forms Drawer */}
      {formOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-6 max-w-xl text-white"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              {editingId ? 'Modify Record Values' : 'Register Entry'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {activeTab === 'items' ? (
            /* Item Input Form */
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Item Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ITEM-AA1"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-mono font-bold outline-none text-white focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Angkor Bottle Case of 24"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-semibold outline-none text-white focus:border-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit of Measure (UM)</label>
                  <select
                    value={itemUm}
                    onChange={(e) => setItemUm(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-900 border border-white/10 rounded-xl outline-none text-white focus:border-cyan-500/50 transition-all"
                  >
                    <option value="Case">Case</option>
                    <option value="Box">Box</option>
                    <option value="Doz">Dozen</option>
                    <option value="Pcs">Piece</option>
                    <option value="Bottle">Bottle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit Price ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0.1}
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl outline-none font-bold text-emerald-300 focus:border-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Detailed Description</label>
                <input
                  type="text"
                  placeholder="Detailed packaging specifications..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white focus:border-cyan-500/50 transition-all"
                />
              </div>

              {/* Wholesale Promo Packages Section */}
              <div className="border border-white/10 rounded-xl p-3 bg-white/5 space-y-2 text-left">
                <span className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wide border-b border-white/10 pb-1.5 flex justify-between items-center font-sans">
                  <span>កំណត់ឈុតកម្មវិធីលក់ថែម (Wholesale Promo Packages)</span>
                  <span className="text-[9px] text-slate-400 font-normal font-sans">ទិញតាមចំនួនកំណត់ ថែមជូនទំនិញឥតគិតថ្លៃ</span>
                </span>

                {/* Inline Package Creator */}
                <div className="flex items-end gap-2 pt-1 font-sans">
                  <div className="flex-[2]">
                    <label className="block text-[9px] text-slate-400 font-semibold mb-0.5">ទិញចំនួន (Buy Qty)</label>
                    <input
                      id="new-promo-buy-qty"
                      type="number"
                      min={1}
                      placeholder="ឧ. 100"
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-white/10 rounded-lg outline-none text-white focus:border-cyan-500/50"
                    />
                  </div>
                  <div className="flex-[2]">
                    <label className="block text-[9px] text-slate-400 font-semibold mb-0.5">ថែមជូនចំនួន (Free Qty)</label>
                    <input
                      id="new-promo-free-qty"
                      type="number"
                      min={1}
                      placeholder="ឧ. 32"
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-white/10 rounded-lg outline-none text-white focus:border-cyan-500/50 font-semibold text-emerald-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const buyQtyEl = document.getElementById('new-promo-buy-qty') as HTMLInputElement;
                      const freeQtyEl = document.getElementById('new-promo-free-qty') as HTMLInputElement;
                      if (!buyQtyEl || !freeQtyEl) return;
                      const buyQty = parseInt(buyQtyEl.value);
                      const freeQty = parseInt(freeQtyEl.value);
                      if (buyQty > 0 && freeQty > 0) {
                        if (itemPromos.some(p => p.buyQty === buyQty)) {
                          alert('ចំនួនទិញនេះមានកំណត់ក្នុងឈុតរួចហើយ! (This buy quantity tier already exists)');
                          return;
                        }
                        const labelText = `ទិញ ${buyQty} ថែម ${freeQty} (Buy ${buyQty} Get ${freeQty} Free)`;
                        const updated = [...itemPromos, { buyQty, freeQty, packageName: labelText }].sort((a, b) => a.buyQty - b.buyQty);
                        setItemPromos(updated);
                        buyQtyEl.value = '';
                        freeQtyEl.value = '';
                      } else {
                        alert('សូមបញ្ចូលចំនួនឱ្យបានត្រឹមត្រូវ! (Please enter valid quantities)');
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[11px] font-bold h-[32px] cursor-pointer whitespace-nowrap"
                  >
                    + បន្ថែមឈុត
                  </button>
                </div>

                {/* Promo List */}
                {itemPromos.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic text-center py-2 font-sans">
                    មិនទាន់មានការកំណត់ឈុតថែមនៅឡើយទេ (No promotional packages configured yet for this item)
                  </p>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-1 pt-1.5">
                    {itemPromos.map((promo, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg font-sans">
                        <span className="font-medium text-slate-300">
                          ទិញ <strong className="text-cyan-300 font-mono text-xs">{promo.buyQty}</strong> {itemUm} ថែមជូន <strong className="text-emerald-400 font-mono text-xs">{promo.freeQty}</strong> {itemUm}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Active</span>
                          <button
                            type="button"
                            onClick={() => setItemPromos(itemPromos.filter((_, i) => i !== idx))}
                            className="text-rose-450 hover:text-rose-400 cursor-pointer p-0.5 rounded hover:bg-white/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-white/20 hover:bg-white/10 rounded-xl text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-cyan-550/10"
                >
                  Save Item
                </button>
              </div>
            </form>
          ) : activeTab === 'warehouses' ? (
            /* Depot Input Form */
            <form onSubmit={handleSaveWarehouse} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Depot Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-SRA"
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-mono font-bold outline-none text-white focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Depot Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Branch Drinkshop Warehouse"
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-semibold outline-none text-white focus:border-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Geographic Location</label>
                <input
                  type="text"
                  placeholder="Street and District coords, Phnom Penh..."
                  value={whLoc}
                  onChange={(e) => setWhLoc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white focus:border-cyan-500/50 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-white/20 hover:bg-white/10 rounded-xl text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-cyan-550/10"
                >
                  Save Depot
                </button>
              </div>
            </form>
          ) : (
            /* Sales Rep Input Form */
            <form onSubmit={handleSaveSaleRep} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rep Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SR01"
                    value={repCode}
                    onChange={(e) => setRepCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-mono font-bold outline-none text-white focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sokha Ly"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-semibold outline-none text-white focus:border-cyan-500/50 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 012 345 678"
                  value={repPhone}
                  onChange={(e) => setRepPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white focus:border-cyan-500/50 transition-all font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-white/20 hover:bg-white/10 rounded-xl text-xs text-slate-300 hover:text-white transition-all cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-cyan-550/10 font-sans"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      {/* MAIN LAYOUT ACCORDING TO TABS */}
      {activeTab === 'items' && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-200 text-[11px] font-bold uppercase border-b border-white/10">
                  <th className="px-5 py-3 w-32 font-semibold">SKU Code</th>
                  <th className="px-5 py-3 font-semibold font-sans">Item Label Name</th>
                  <th className="px-5 py-3 font-semibold font-sans text-slate-400">UM</th>
                  <th className="px-5 py-3 font-semibold font-sans text-right">Standard Price</th>
                  <th className="px-5 py-3 font-semibold font-sans text-center">Promotional Packages</th>
                  <th className="px-5 py-3 font-semibold font-sans">Specifications</th>
                  <th className="px-5 py-3 text-right w-24">Modify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400 font-sans italic">
                      No stock items registered yet. Click the create button to provision system SKUs.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 font-bold text-cyan-300">{it.code}</td>
                      <td className="px-5 py-3 font-medium text-white font-sans">{it.name}</td>
                      <td className="px-5 py-3 font-semibold text-slate-450 font-sans">{it.um}</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-300">${it.price.toFixed(2)}</td>
                      <td className="px-5 py-3 text-center relative z-20">
                        {it.promoPackages && it.promoPackages.length > 0 ? (
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                if (expandedPromoId === it.id) {
                                  setExpandedPromoId(null);
                                  setTriggerRect(null);
                                } else {
                                  setExpandedPromoId(it.id);
                                  setTriggerRect(e.currentTarget.getBoundingClientRect());
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 text-cyan-300 transition-all cursor-pointer shadow-sm active:scale-95"
                            >
                              <span>{it.promoPackages.length} Packages</span>
                              <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform duration-200 ${expandedPromoId === it.id ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {expandedPromoId === it.id && triggerRect && createPortal(
                              <>
                                <div className="fixed inset-0 z-[9999]" onClick={() => { setExpandedPromoId(null); setTriggerRect(null); }} />
                                <div 
                                  style={{
                                    position: 'fixed',
                                    top: `${triggerRect.bottom + 6}px`,
                                    left: `${triggerRect.left + triggerRect.width / 2}px`,
                                    transform: 'translateX(-50%)',
                                  }}
                                  className="w-48 bg-slate-950 border border-white/15 rounded-xl shadow-2xl py-1.5 z-[10000] backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-100 max-h-56 overflow-y-auto"
                                >
                                  <div className="px-3 py-1 border-b border-white/5 mb-1 text-left">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Promotional Offers</span>
                                  </div>
                                  {it.promoPackages.map((promo, pIdx) => (
                                    <div key={pIdx} className="px-3 py-1.5 text-[11px] font-semibold text-cyan-300 hover:bg-white/5 flex items-center justify-between border-b border-white/5 last:border-0 font-sans">
                                      <span>Buy {promo.buyQty}</span>
                                      <span className="text-emerald-400 font-bold">Get {promo.freeQty} Free</span>
                                    </div>
                                  ))}
                                </div>
                              </>,
                              document.body
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic font-sans">No Promo Packages</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[11px] font-sans text-slate-400 capitalize">{it.description}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2.5 font-sans">
                          <button
                            onClick={() => handleEditItem(it)}
                            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(it.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
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
          </div>
        </div>
      )}

      {activeTab === 'warehouses' && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-200 text-[11px] font-bold uppercase border-b border-white/10">
                  <th className="px-5 py-3 w-32 font-semibold font-mono">Depot Code</th>
                  <th className="px-5 py-3 font-semibold">Warehouse Depot Name</th>
                  <th className="px-5 py-3 font-semibold">Geographic Coordinates / Street Address</th>
                  <th className="px-5 py-3 text-right w-24">Modify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400 italic">
                      No branch depots configured. Click create to provision storage yards.
                    </td>
                  </tr>
                ) : (
                  warehouses.map((w) => (
                    <tr key={w.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-cyan-300">{w.code}</td>
                      <td className="px-5 py-3 font-semibold text-white">{w.name}</td>
                      <td className="px-5 py-3 text-slate-400 text-[11px]">{w.location || 'Central Depot Yards'}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleEditWarehouse(w)}
                            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWarehouse(w.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
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
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-200 text-[11px] font-bold uppercase border-b border-white/10">
                  <th className="px-5 py-3 w-32 font-semibold font-mono">Rep Code</th>
                  <th className="px-5 py-3 font-semibold">Representative Full Name</th>
                  <th className="px-5 py-3 font-semibold font-mono">Phone Number</th>
                  <th className="px-5 py-3 text-right w-24">Modify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {saleReps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400 italic">
                      No sales representatives configured. Click create to add staff.
                    </td>
                  </tr>
                ) : (
                  saleReps.map((sr) => (
                    <tr key={sr.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-cyan-300">{sr.code}</td>
                      <td className="px-5 py-3 font-semibold text-white">{sr.name}</td>
                      <td className="px-5 py-3 font-mono text-slate-400 text-[11px]">{sr.phone || 'N/A'}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleEditSaleRep(sr)}
                            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSaleRep(sr.id, sr.name)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
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
          </div>
        </div>
      )}

      {activeTab === 'company' && (
        /* Company Profile Edit Component */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 max-w-3xl text-white"
        >
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-white/10 pb-2">
              Corporate Ledger Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1">Company Registered Name</label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-bold text-white outline-none focus:border-cyan-500/50 transition-all font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1">Company official TIN (VAT ID)</label>
                <input
                  type="text"
                  placeholder="K000-00000000"
                  value={compTin}
                  onChange={(e) => setCompTin(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-mono font-bold text-white outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Call network desk</span>
                </label>
                <input
                  type="text"
                  required
                  value={compPhone}
                  onChange={(e) => setCompPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-semibold font-mono text-white outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Administrative Email desk</span>
                </label>
                <input
                  type="email"
                  required
                  value={compEmail}
                  onChange={(e) => setCompEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-medium text-white outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-450 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Default Office physical address</span>
              </label>
              <input
                type="text"
                required
                value={compAddress}
                onChange={(e) => setCompAddress(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all font-sans"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
              >
                <Save className="w-4 h-4" />
                <span>Save Business Profile</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}
      {/* Custom Confirmation Dialog */}
      {confirmState && (
        <div id="confirm-modal-general" className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
