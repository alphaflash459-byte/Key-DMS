import React, { useState, useEffect } from 'react';
import { CustomerInfo, Warehouse, SaleRep, Item, SaleOrder } from '../types';
import { Plus, Trash2, Edit, Save, X, Eye, FileSpreadsheet, ListFilter, ShoppingBag, PlusCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { SearchableCustomerSelect } from './SearchableCustomerSelect';
import SearchableCombo from './SearchableCombo';

interface SaleOrderManagementProps {
  customers: CustomerInfo[];
  warehouses: Warehouse[];
  saleReps: SaleRep[];
  items: Item[];
  saleOrders: SaleOrder[];
  setSaleOrders: (orders: SaleOrder[]) => void;
  onCreateInvoiceFromSO?: (so: SaleOrder) => void;
}

export default function SaleOrderManagement({
  customers,
  warehouses,
  saleReps,
  items,
  saleOrders,
  setSaleOrders,
  onCreateInvoiceFromSO
}: SaleOrderManagementProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [activeSO, setActiveSO] = useState<SaleOrder | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedSaleRepId, setSelectedSaleRepId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');

  // Items bucket
  const [orderCart, setOrderCart] = useState<Array<{
    itemId: string;
    description: string;
    qty: number;
    um: string;
    price: number;
    subTotal: number;
  }>>([]);

  // Live item selector states
  const [currentItemId, setCurrentItemId] = useState('');
  const [currentQty, setCurrentQty] = useState<number>(1);

  // Load cart item info when selected
  const handleAddItemToCart = () => {
    if (!currentItemId || currentQty <= 0) return;
    const item = items.find((i) => i.id === currentItemId);
    if (!item) return;

    const updatedCart = [...orderCart];
    updatedCart.push({
      itemId: item.id,
      description: item.name,
      qty: currentQty,
      um: item.um,
      price: item.price,
      subTotal: currentQty * item.price
    });

    setOrderCart(updatedCart);
    setCurrentItemId('');
    setCurrentQty(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setOrderCart(orderCart.filter((_, idx) => idx !== index));
  };

  const handleDeleteOrder = (id: string, orderNo: string) => {
    setConfirmState({
      title: 'លុបការបញ្ជាទិញ / Delete Sales Order',
      message: `Are you sure you want to delete sales order ${orderNo}? This action is irreversible.`,
      onConfirm: () => {
        setSaleOrders(saleOrders.filter(so => so.id !== id));
        setConfirmState(null);
        setAlertMsg({ type: 'success', text: `Sales order ${orderNo} deleted successfully.` });
        setTimeout(() => setAlertMsg(null), 3000);
      }
    });
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedWarehouseId || !selectedSaleRepId || orderCart.length === 0) {
      setAlertMsg({ type: 'error', text: 'Please fill out all mandatory fields and add at least one line item.' });
      setTimeout(() => setAlertMsg(null), 4000);
      return;
    }

    const randomID = 'SO-' + Math.floor(100000 + Math.random() * 900000);
    const totalAmount = orderCart.reduce((sum, item) => sum + item.subTotal, 0);

    const newOrder: SaleOrder = {
      id: 'so-' + Date.now(),
      orderNo: randomID,
      customerId: selectedCustomerId,
      date: orderDate,
      warehouseId: selectedWarehouseId,
      saleRepId: selectedSaleRepId,
      items: orderCart,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'Pending',
      remark: remark
    };

    setSaleOrders([newOrder, ...saleOrders]);
    resetForm();
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedWarehouseId('');
    setSelectedSaleRepId('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setRemark('');
    setOrderCart([]);
    setFormOpen(false);
    setActiveSO(null);
  };

  return (
    <div id="so-manager" className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-white">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-400 font-bold" />
            <span>Sale Orders Catalog / ការបញ្ជាទិញទំនិញ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 pb-1">
            Build and issue sales orders to request warehouse deployments. Convert any active order into an invoice.
          </p>
        </div>

        {!formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 font-semibold flex items-center gap-1.5 transition-all self-start cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Sale Order</span>
          </button>
        )}
      </div>

      {formOpen ? (
        /* Create Order Form Panel */
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl p-6 rounded-2xl space-y-6"
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-widest">
              Create Sales Order Booking
            </h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveOrder} className="space-y-6">
            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / ក្រុមហ៊ុន / ហាង *</label>
                <SearchableCustomerSelect
                  customers={customers}
                  selectedId={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Order Date *</label>
                <input
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 text-white rounded outline-none focus:border-cyan-400"
                />
              </div>

              <div className="text-left font-sans">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Stock Warehouse *</label>
                <SearchableCombo
                  options={warehouses.map((w) => ({
                    value: w.id,
                    label: w.name,
                    subLabel: w.location ? `Loc: ${w.location}` : undefined,
                    rightLabel: w.code
                  }))}
                  value={selectedWarehouseId}
                  onChange={(val) => setSelectedWarehouseId(val)}
                  placeholder="-- Select Hub --"
                />
              </div>

              <div className="text-left font-sans">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Assigned Sales Rep *</label>
                <SearchableCombo
                  options={saleReps.map((sr) => ({
                    value: sr.id,
                    label: sr.name,
                    rightLabel: sr.code
                  }))}
                  value={selectedSaleRepId}
                  onChange={(val) => setSelectedSaleRepId(val)}
                  placeholder="-- Select Agent --"
                />
              </div>
            </div>

            {/* Line items section */}
            <div className="border border-white/10 rounded-2xl p-4 bg-white/5 space-y-4">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider block border-b border-white/10 pb-2">
                Order Itemized Lines
              </h3>

              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1 text-left font-sans">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Select Item to Book</label>
                  <SearchableCombo
                    options={items.map((it) => ({
                      value: it.id,
                      label: `${it.code} - ${it.name}`,
                      subLabel: it.description || 'No description available',
                      rightLabel: `$${it.price.toFixed(2)} / ${it.um}`
                    }))}
                    value={currentItemId}
                    onChange={(val) => setCurrentItemId(val)}
                    placeholder="-- Select Stock Item --"
                  />
                </div>

                <div className="w-24">
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={currentQty}
                    onChange={(e) => setCurrentQty(parseInt(e.target.value) || 1)}
                    className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 text-white rounded outline-none text-center focus:border-cyan-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItemToCart}
                  disabled={!currentItemId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1 cursor-pointer h-[34px] transition-all shadow-md shadow-blue-500/25"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Insert Item</span>
                </button>
              </div>

              {/* Items Cart Display */}
              <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-white/10 font-bold border-b border-white/10 text-slate-300">
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">Item Name</th>
                      <th className="px-4 py-2.5">UM</th>
                      <th className="px-4 py-2.5 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                      <th className="px-4 py-2.5 text-center w-16">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {orderCart.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400 italic">
                          Cart is currently empty. Insert items above.
                        </td>
                      </tr>
                    ) : (
                      orderCart.map((c, index) => (
                        <tr key={index} className="hover:bg-white/5">
                          <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                          <td className="px-4 py-2 font-medium text-white">{c.description}</td>
                          <td className="px-4 py-2 text-slate-400">{c.um}</td>
                          <td className="px-4 py-2 text-right text-slate-300">${c.price.toFixed(2)}</td>
                          <td className="px-4 py-2 text-center font-bold text-cyan-300">{c.qty}</td>
                          <td className="px-4 py-2 text-right font-semibold text-white">${c.subTotal.toFixed(2)}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(index)}
                              className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cart Calculations */}
              {orderCart.length > 0 && (
                <div className="text-right pr-4 font-mono">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mr-2">
                    Sub-Total Order Value:
                  </span>
                  <span className="text-base font-bold text-cyan-300">
                    ${orderCart.reduce((sum, i) => sum + i.subTotal, 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Remark Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Remark / Delivery instructions</label>
              <textarea
                rows={2}
                placeholder="Write specific notes, delivery constraints..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white/10 border border-white/10 text-white rounded outline-none resize-none font-sans focus:border-cyan-400 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors font-semibold"
              >
                Discard Form
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs transition-transform font-semibold flex items-center gap-1 shadow-lg shadow-blue-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Sale Order</span>
              </button>
            </div>
          </form>
        </motion.div>
      ) : activeSO ? (
        /* Detailed View of Single Sales Order */
        <div className="bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span>ORDER DETAIL: <span className="font-mono text-cyan-300 font-extrabold">{activeSO.orderNo}</span></span>
            </h2>
            <button onClick={() => setActiveSO(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans text-slate-300">
            <div>
              <span className="block text-slate-400 font-medium">Customer:</span>
              <span className="font-bold text-white">{customers.find(c => c.id === activeSO.customerId)?.name || 'Unknown'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Order Date:</span>
              <span className="font-bold text-white font-mono">{activeSO.date}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Warehouse:</span>
              <span className="font-bold text-white">{warehouses.find(w => w.id === activeSO.warehouseId)?.name || 'Unknown'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Sales Rep:</span>
              <span className="font-bold text-white">{saleReps.find(sr => sr.id === activeSO.saleRepId)?.name || 'Unknown'}</span>
            </div>
          </div>

          <div className="border border-white/10 rounded-xl bg-white/5 p-4">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-widest mb-3">Itemized Cart</h3>
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="bg-white/10 border-b border-white/10 text-slate-300 font-bold">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Item Name</th>
                  <th className="px-3 py-2">UM</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {activeSO.items.map((line, idx) => (
                  <tr key={idx} className="border-b border-white/5 last:border-b-0">
                    <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-white">{line.description}</td>
                    <td className="px-3 py-2 text-slate-400">{line.um}</td>
                    <td className="px-3 py-2 text-right text-slate-300">${line.price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center font-semibold text-cyan-300">{line.qty}</td>
                    <td className="px-3 py-2 text-right font-bold text-white">${line.subTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right mt-4 pr-3 font-mono border-t border-white/5 pt-3">
              <span className="text-xs text-slate-400 mr-2 uppercase tracking-wide">Grand Total:</span>
              <span className="text-lg font-extrabold text-cyan-300">${activeSO.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-xs p-3.5 bg-white/5 text-slate-200 rounded-xl border border-white/10">
            <strong className="text-cyan-300 mr-1">Remark Note:</strong> {activeSO.remark || 'N/A'}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              onClick={() => setActiveSO(null)}
              className="px-4 py-2 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors font-semibold"
            >
              Back to Catalog
            </button>
            
            {activeSO.status === 'Pending' && onCreateInvoiceFromSO && (
              <button
                onClick={() => {
                  onCreateInvoiceFromSO(activeSO);
                  setActiveSO(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs transition-all font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Issue Non-Tax Invoice Now</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Regular Records List */
        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/10 text-slate-300 text-[11px] font-bold uppercase border-b border-white/10">
                  <th className="px-5 py-3">Order No</th>
                  <th className="px-5 py-3">Customer Client</th>
                  <th className="px-5 py-3">Order Date</th>
                  <th className="px-5 py-3">Warehouse Hub</th>
                  <th className="px-5 py-3">Sales Agent</th>
                  <th className="px-5 py-3 text-right">Order Value</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {saleOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 italic">No sale orders recorded. Click &apos;New Sale Order&apos; above.</td>
                  </tr>
                ) : (
                  saleOrders.map((so) => {
                    const cust = customers.find(c => c.id === so.customerId);
                    const wh = warehouses.find(w => w.id === so.warehouseId);
                    const rep = saleReps.find(sr => sr.id === so.saleRepId);
                    return (
                      <tr key={so.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                        <td className="px-5 py-3 font-mono font-bold text-cyan-300">{so.orderNo}</td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-white">{cust ? cust.name : 'Unknown Shop'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{cust?.code}</div>
                        </td>
                        <td className="px-5 py-3 font-mono font-medium text-slate-400">{so.date}</td>
                        <td className="px-5 py-3 text-slate-300">{wh ? wh.name : 'Central Warehouse'}</td>
                        <td className="px-5 py-3 text-slate-300">{rep ? rep.name : 'Direct House'}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-white">${so.totalAmount.toFixed(2)}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            so.status === 'Invoiced' 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : so.status === 'Cancelled' 
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {so.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setActiveSO(so)}
                              className="p-1 px-2.5 bg-white/10 border border-white/10 hover:bg-white/20 transition-all text-slate-200 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer text-[11px]"
                            >
                              <Eye className="w-3 h-3 text-cyan-400" />
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(so.id, so.orderNo)}
                              className="p-1 px-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer text-[11px] transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Custom Confirmation Dialog */}
      {confirmState && (
        <div id="confirm-modal" className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative"
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
                Cancel / បោះបង់
              </button>
              <button
                onClick={confirmState.onConfirm}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/10 cursor-pointer font-sans"
              >
                Confirm / យល់ព្រម
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
