import React, { useState, useEffect } from 'react';
import { CustomerInfo, Warehouse, SaleRep, Item, SaleOrder } from '../types';
import { calculateFreePromoQty, calculateDividedPrice } from '../utils';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Eye, 
  FileSpreadsheet, 
  ShoppingBag, 
  PlusCircle, 
  CheckCircle, 
  AlertTriangle, 
  ChevronDown,
  Gift
} from 'lucide-react';
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
  // Toggle between Form and Catalog Register list
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [currentIdx, setCurrentIdx] = useState<number>(-1); // for navigation arrows
  const [activeSO, setActiveSO] = useState<SaleOrder | null>(null);

  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form States (matching the Invoice layout fields exactly)
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [tel, setTel] = useState('');
  const [district, setDistrict] = useState('');
  
  const [orderNo, setOrderNo] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedSaleRepId, setSelectedSaleRepId] = useState('');
  const [remark, setRemark] = useState('');

  // Aligned Invoice-like States for Sale Order
  const [soType, setSoType] = useState<'TAX' | 'NON_TAX'>('NON_TAX');
  const [dueDate, setDueDate] = useState('');
  const [poNo, setPoNo] = useState('');
  const [accountName, setAccountName] = useState('1500-Account Receivables');
  const [className, setClassName] = useState('');
  const [receiver, setReceiver] = useState('');
  const [vatPercentGlobal, setVatPercentGlobal] = useState<number>(0);
  const [discountPercentGlobal, setDiscountPercentGlobal] = useState<number>(0);
  const [discountValueGlobal, setDiscountValueGlobal] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [memo, setMemo] = useState('');

  // Main grid items bucket with optional row-level Discount and VAT
  const [orderCart, setOrderCart] = useState<Array<{
    itemId: string;
    description: string;
    qty: number;
    freeQty?: number;
    promoMode?: 'FREE' | 'DIVIDED';
    um: string;
    price: number;
    subTotal: number;
    discountPercent?: number;
    vatPercent?: number;
    otherField?: string;
  }>>([]);
  
  const [selectedLineItemToAdd, setSelectedLineItemToAdd] = useState('');

  // Sidebar collapsible panels accordion behavior
  const [activePanel, setActivePanel] = useState<'customer' | 'vat' | 'summary' | null>('customer');

  // Order type modification handler
  const handleSoTypeChange = (type: 'TAX' | 'NON_TAX') => {
    setSoType(type);
    setVatPercentGlobal(type === 'TAX' ? 10 : 0);
    // automatically sync all line items' VAT percent to default
    const updated = orderCart.map(line => ({
      ...line,
      vatPercent: type === 'TAX' ? 10 : 0
    }));
    setOrderCart(updated);
  };

  // Generate a random Sales Order No when the component mounts
  useEffect(() => {
    generateNewOrderNo();
    if (warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id); // First warehouse default
    }
    if (saleReps.length > 0) {
      setSelectedSaleRepId(saleReps[0].id); // First sales rep default
    }
  }, [warehouses, saleReps]);

  const generateNewOrderNo = () => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    setOrderNo(`SO-${rand}`);
  };

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    const c = customers.find(cust => cust.id === id);
    if (c) {
      setContactPerson(c.contactPerson);
      setTel(c.tel);
      setDistrict(c.district);
    } else {
      setContactPerson('');
      setTel('');
      setDistrict('');
    }
  };

  // Line Sub-Total Formula: (Qty * Price) - applied line discount
  const calculateLineSubtotal = (line: { qty: number; price: number; discountPercent?: number }) => {
    const grossPrice = line.qty * line.price;
    const discountAmount = grossPrice * ((line.discountPercent || 0) / 100);
    return Math.max(0, grossPrice - discountAmount);
  };

  // Add selected item to grid directly
  const handleAddItemToGrid = (itemId: string) => {
    if (!itemId) return;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const initialQty = 1;
    const hasPromo = item.promoPackages && item.promoPackages.length > 0;
    const isExact = hasPromo && item.promoPackages.some(p => p.buyQty > 0 && initialQty % p.buyQty === 0);
    const mode = hasPromo ? (isExact ? 'FREE' : 'DIVIDED') : 'FREE';

    let finalPrice = item.price;
    let finalFreeQty = 0;

    if (hasPromo) {
      if (mode === 'FREE') {
        const { freeQty } = calculateFreePromoQty(item, initialQty);
        finalFreeQty = freeQty || 0;
        finalPrice = item.price;
      } else {
        finalFreeQty = 0;
        const { price: divPrice } = calculateDividedPrice(item, initialQty);
        finalPrice = divPrice;
      }
    } else {
      finalFreeQty = 0;
      finalPrice = item.price;
    }

    const newLine = {
      itemId: item.id,
      description: item.name,
      qty: initialQty,
      freeQty: finalFreeQty,
      promoMode: hasPromo ? (mode as 'FREE' | 'DIVIDED') : undefined,
      um: item.um,
      price: finalPrice,
      discountPercent: 0,
      vatPercent: soType === 'TAX' ? 10 : 0,
      otherField: '',
      subTotal: finalPrice
    };

    setOrderCart([...orderCart, newLine]);
    setSelectedLineItemToAdd(''); // clear dropdown state
  };

  const handleLineQtyChange = (idx: number, qty: number) => {
    const updated = [...orderCart];
    const safeQty = Math.max(1, qty);
    updated[idx].qty = safeQty;

    const item = items.find(i => i.id === updated[idx].itemId);
    if (item) {
      const hasPromo = item.promoPackages && item.promoPackages.length > 0;
      if (hasPromo) {
        const isExact = item.promoPackages.some(p => p.buyQty > 0 && safeQty % p.buyQty === 0);
        const mode = isExact ? 'FREE' : 'DIVIDED';
        updated[idx].promoMode = mode;

        if (mode === 'FREE') {
          const { freeQty } = calculateFreePromoQty(item, safeQty);
          updated[idx].freeQty = freeQty || 0;
          updated[idx].price = item.price;
        } else if (mode === 'DIVIDED') {
          updated[idx].freeQty = 0;
          const { price: divPrice } = calculateDividedPrice(item, safeQty);
          updated[idx].price = divPrice;
        }
      } else {
        updated[idx].promoMode = undefined;
        updated[idx].freeQty = 0;
        updated[idx].price = item.price;
      }
    }

    updated[idx].subTotal = calculateLineSubtotal(updated[idx]);
    setOrderCart(updated);
  };

  const handlePromoModeChange = (idx: number, mode: 'FREE' | 'DIVIDED') => {
    const updated = [...orderCart];
    updated[idx].promoMode = mode;

    const item = items.find(i => i.id === updated[idx].itemId);
    if (item) {
      if (mode === 'FREE') {
        const { freeQty } = calculateFreePromoQty(item, updated[idx].qty);
        updated[idx].freeQty = freeQty || 0;
        updated[idx].price = item.price;
      } else if (mode === 'DIVIDED') {
        updated[idx].freeQty = 0;
        const { price: divPrice } = calculateDividedPrice(item, updated[idx].qty);
        updated[idx].price = divPrice;
      }
    }

    updated[idx].subTotal = calculateLineSubtotal(updated[idx]);
    setOrderCart(updated);
  };

  const handlePromoPackageChange = (idx: number, pkgVal: string) => {
    if (pkgVal === 'custom') return;
    const updated = [...orderCart];
    const item = items.find(i => i.id === updated[idx].itemId);
    if (!item || !item.promoPackages) return;

    const pkgIdx = parseInt(pkgVal, 10);
    const promo = item.promoPackages[pkgIdx];
    if (promo) {
      updated[idx].qty = promo.buyQty;
      updated[idx].promoMode = 'FREE';
      updated[idx].freeQty = promo.freeQty;
      updated[idx].price = item.price;
      updated[idx].subTotal = calculateLineSubtotal(updated[idx]);
      setOrderCart(updated);
    }
  };

  const handleLinePriceChange = (idx: number, price: number) => {
    const updated = [...orderCart];
    updated[idx].price = Math.max(0, price);
    updated[idx].subTotal = calculateLineSubtotal(updated[idx]);
    setOrderCart(updated);
  };

  const handleLineDiscountChange = (idx: number, disc: number) => {
    const updated = [...orderCart];
    updated[idx].discountPercent = Math.max(0, Math.min(100, disc));
    updated[idx].subTotal = calculateLineSubtotal(updated[idx]);
    setOrderCart(updated);
  };

  const handleLineVatChange = (idx: number, vat: number) => {
    const updated = [...orderCart];
    updated[idx].vatPercent = Math.max(0, vat);
    updated[idx].subTotal = calculateLineSubtotal(updated[idx]);
    setOrderCart(updated);
  };

  const handleLineOtherFieldChange = (idx: number, text: string) => {
    const updated = [...orderCart];
    updated[idx].otherField = text;
    setOrderCart(updated);
  };

  const handleRemoveLine = (idx: number) => {
    setOrderCart(orderCart.filter((_, i) => i !== idx));
  };

  const handleDeleteOrder = (id: string, orderNumber: string) => {
    setConfirmState({
      title: 'Delete Sales Order',
      message: `Are you sure you want to delete sales order ${orderNumber}? This action is irreversible.`,
      onConfirm: () => {
        setSaleOrders(saleOrders.filter(so => so.id !== id));
        setConfirmState(null);
        setAlertMsg({ type: 'success', text: `Sales order ${orderNumber} deleted successfully.` });
        setTimeout(() => setAlertMsg(null), 3000);
      }
    });
  };

  const resetFormValues = () => {
    setSelectedCustomerId('');
    setContactPerson('');
    setTel('');
    setDistrict('');
    generateNewOrderNo();
    setOrderDate(new Date().toISOString().split('T')[0]);
    setRemark('');
    setOrderCart([]);
    setSelectedLineItemToAdd('');
    setCurrentIdx(-1);
    
    // Reset aligned invoice-like fields
    setSoType('NON_TAX');
    setDueDate('');
    setPoNo('');
    setAccountName('1500-Account Receivables');
    setClassName('');
    setReceiver('');
    setVatPercentGlobal(0);
    setDiscountPercentGlobal(0);
    setDiscountValueGlobal(0);
    setDeposit(0);
    setMemo('');
  };

  // Calculations for Order Summary Panel
  const subTotalAmount = orderCart.reduce((sum, line) => sum + line.subTotal, 0);
  const vatAmountGlobal = subTotalAmount * (vatPercentGlobal / 100);
  const discountAmountGlobal = (subTotalAmount * (discountPercentGlobal / 100)) + discountValueGlobal;
  const grandTotal = Math.max(0, (subTotalAmount + vatAmountGlobal) - discountAmountGlobal - deposit);

  const handleSaveOrder = (andNew: boolean) => {
    if (!selectedCustomerId) {
      setAlertMsg({ type: 'error', text: 'Error: Customer selection is mandatory. Please select a Customer first.' });
      setTimeout(() => setAlertMsg(null), 4000);
      return;
    }
    if (orderNo === '') {
      setAlertMsg({ type: 'error', text: 'Error: Order No cannot be empty.' });
      setTimeout(() => setAlertMsg(null), 4000);
      return;
    }
    if (orderCart.length === 0) {
      setAlertMsg({ type: 'error', text: 'Error: Table must contain at least 1 item.' });
      setTimeout(() => setAlertMsg(null), 4000);
      return;
    }

    const newOrder: SaleOrder = {
      id: currentIdx > -1 ? saleOrders[currentIdx].id : 'so-' + Date.now(),
      orderNo: orderNo,
      customerId: selectedCustomerId,
      date: orderDate,
      warehouseId: selectedWarehouseId,
      saleRepId: selectedSaleRepId,
      items: orderCart,
      totalAmount: parseFloat(grandTotal.toFixed(3)),
      status: currentIdx > -1 ? saleOrders[currentIdx].status : 'Pending',
      remark: remark,
      
      // Aligned Invoice-like values
      type: soType,
      dueDate: dueDate || orderDate,
      contactPerson: contactPerson,
      tel: tel,
      district: district,
      poNo: poNo,
      accountName: accountName,
      className: className,
      receiver: receiver,
      vatPercentGlobal: vatPercentGlobal,
      discountPercentGlobal: discountPercentGlobal,
      discountValueGlobal: discountValueGlobal,
      deposit: deposit,
      grandTotal: parseFloat(grandTotal.toFixed(3)),
      memo: memo
    };

    if (currentIdx > -1) {
      const updatedOrders = [...saleOrders];
      updatedOrders[currentIdx] = newOrder;
      setSaleOrders(updatedOrders);
      setAlertMsg({ type: 'success', text: `Successfully updated Sale Order ${orderNo}!` });
    } else {
      setSaleOrders([newOrder, ...saleOrders]);
      setAlertMsg({ type: 'success', text: `Successfully recorded Sale Order ${orderNo}!` });
    }

    setTimeout(() => setAlertMsg(null), 4500);

    if (andNew) {
      resetFormValues();
    } else {
      setActiveTab('list');
    }
  };

  const loadOrderToForm = (idx: number) => {
    const rec = saleOrders[idx];
    if (rec) {
      setCurrentIdx(idx);
      setSelectedCustomerId(rec.customerId);
      const cust = customers.find(c => c.id === rec.customerId);
      if (cust) {
        setContactPerson(rec.contactPerson || cust.contactPerson || '');
        setTel(rec.tel || cust.tel || '');
        setDistrict(rec.district || cust.district || '');
      } else {
        setContactPerson(rec.contactPerson || '');
        setTel(rec.tel || '');
        setDistrict(rec.district || '');
      }
      setOrderNo(rec.orderNo);
      setOrderDate(rec.date);
      setSelectedWarehouseId(rec.warehouseId);
      setSelectedSaleRepId(rec.saleRepId);
      setRemark(rec.remark || '');
      
      // Restore newly added fields or fallback
      setSoType(rec.type || 'NON_TAX');
      setDueDate(rec.dueDate || '');
      setPoNo(rec.poNo || '');
      setAccountName(rec.accountName || '1500-Account Receivables');
      setClassName(rec.className || '');
      setReceiver(rec.receiver || '');
      setVatPercentGlobal(rec.vatPercentGlobal !== undefined ? rec.vatPercentGlobal : (rec.type === 'TAX' ? 10 : 0));
      setDiscountPercentGlobal(rec.discountPercentGlobal || 0);
      setDiscountValueGlobal(rec.discountValueGlobal || 0);
      setDeposit(rec.deposit || 0);
      setMemo(rec.memo || '');

      const cartItems = rec.items.map(item => ({
        itemId: item.itemId,
        description: item.description,
        qty: item.qty,
        freeQty: item.freeQty || 0,
        promoMode: item.promoMode,
        um: item.um,
        price: item.price,
        subTotal: item.subTotal,
        discountPercent: item.discountPercent || 0,
        vatPercent: item.vatPercent !== undefined ? item.vatPercent : (rec.type === 'TAX' ? 10 : 0),
        otherField: item.otherField || ''
      }));
      setOrderCart(cartItems);
      setAlertMsg({ type: 'success', text: `Loaded Sale Order ${rec.orderNo} for editing!` });
      setTimeout(() => setAlertMsg(null), 2500);
    }
  };

  const walkRecord = (direction: 'prev' | 'next') => {
    if (saleOrders.length === 0) return;
    let nextIdx = currentIdx;
    if (direction === 'prev') {
      nextIdx = currentIdx === -1 ? saleOrders.length - 1 : Math.max(0, currentIdx - 1);
    } else {
      nextIdx = currentIdx === -1 ? 0 : Math.min(saleOrders.length - 1, currentIdx + 1);
    }
    loadOrderToForm(nextIdx);
  };

  return (
    <div id="so-workspace" className="p-4 w-full space-y-4 font-sans text-white">
      
      {/* Toast alert notifications */}
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

      {/* Workspace top navigation bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm uppercase tracking-wider text-white border-l-4 border-cyan-400 pl-2 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span>Workspace: {soType === 'TAX' ? 'Sale Order Tax' : 'Sale Order Non Tax'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* TAX vs NON_TAX selection toggle */}
          {activeTab === 'form' && !activeSO && (
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
              <button
                type="button"
                onClick={() => handleSoTypeChange('NON_TAX')}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                  soType === 'NON_TAX' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Non Tax
              </button>
              <button
                type="button"
                onClick={() => handleSoTypeChange('TAX')}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                  soType === 'TAX' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tax
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => {
                setActiveTab('form');
                resetFormValues();
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                activeTab === 'form' && !activeSO ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Form
            </button>
            <button
              onClick={() => {
                setActiveTab('list');
                setActiveSO(null);
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                activeTab === 'list' && !activeSO ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sale Orders List ({saleOrders.length})
            </button>
          </div>
        </div>
      </div>

      {activeSO ? (
        /* Detailed Inspect View of Single Sales Order */
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl p-6 rounded-2xl space-y-6"
        >
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
              <span className="block text-slate-400 font-medium">Tel:</span>
              <span className="font-bold text-white font-mono">{activeSO.tel || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">District:</span>
              <span className="font-bold text-white">{activeSO.district || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Order Date:</span>
              <span className="font-bold text-white font-mono">{activeSO.date}</span>
            </div>

            <div>
              <span className="block text-slate-400 font-medium">Order Type:</span>
              <span className="font-bold text-cyan-300 font-mono">{activeSO.type === 'TAX' ? 'Sale Order Tax' : 'Sale Order Non Tax'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Due Date:</span>
              <span className="font-bold text-white font-mono">{activeSO.dueDate || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Contact Person:</span>
              <span className="font-bold text-white">{activeSO.contactPerson || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">PO No:</span>
              <span className="font-bold text-white font-mono">{activeSO.poNo || 'N/A'}</span>
            </div>

            <div>
              <span className="block text-slate-400 font-medium">Account Name:</span>
              <span className="font-bold text-white">{activeSO.accountName || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Class Name:</span>
              <span className="font-bold text-white">{activeSO.className || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Receiver:</span>
              <span className="font-bold text-white">{activeSO.receiver || 'N/A'}</span>
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
                  <th className="px-3 py-2 text-center text-emerald-400">Free Qty</th>
                  <th className="px-3 py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="text-slate-200 border-collapse">
                {activeSO.items.map((line, idx) => (
                  <tr key={idx} className="border-b border-white/5 last:border-b-0">
                    <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-white">
                      <div>{line.description}</div>
                      {line.freeQty && line.freeQty > 0 ? (
                        <div className="text-[10px] text-emerald-400 font-sans flex items-center gap-1 mt-1">
                          <span className="inline-block px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold">🎁 PROMO APPLIED:</span>
                          <span className="font-semibold text-emerald-300">
                            {(() => {
                              const origItem = items.find(it => it.id === line.itemId);
                              return origItem ? calculateFreePromoQty(origItem, line.qty).label : '';
                            })()}
                          </span>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{line.um}</td>
                    <td className="px-3 py-2 text-right text-slate-300">${line.price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center font-semibold text-cyan-300">{line.qty}</td>
                    <td className="px-3 py-2 text-center text-emerald-400 font-bold font-mono">
                      {line.freeQty && line.freeQty > 0 ? `+${line.freeQty}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-white">${line.subTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col items-end space-y-1.5 font-mono text-xs pr-3 text-slate-300">
              <div className="flex justify-between w-64">
                <span>Sub-total:</span>
                <span className="font-bold text-white">${activeSO.totalAmount.toFixed(3)}</span>
              </div>
              {activeSO.vatPercentGlobal && activeSO.vatPercentGlobal > 0 ? (
                <div className="flex justify-between w-64">
                  <span>VAT ({activeSO.vatPercentGlobal}%):</span>
                  <span className="font-bold text-white">
                    ${(activeSO.vatAmountGlobal || (activeSO.totalAmount * activeSO.vatPercentGlobal / 100)).toFixed(3)}
                  </span>
                </div>
              ) : null}
              {activeSO.discountPercentGlobal && activeSO.discountPercentGlobal > 0 ? (
                <div className="flex justify-between w-64">
                  <span>Discount ({activeSO.discountPercentGlobal}%):</span>
                  <span className="font-bold text-white">
                    -${((activeSO.totalAmount * activeSO.discountPercentGlobal / 100)).toFixed(3)}
                  </span>
                </div>
              ) : null}
              {activeSO.discountValueGlobal && activeSO.discountValueGlobal > 0 ? (
                <div className="flex justify-between w-64">
                  <span>Discount ($):</span>
                  <span className="font-bold text-white">
                    -${activeSO.discountValueGlobal.toFixed(3)}
                  </span>
                </div>
              ) : null}
              {activeSO.deposit && activeSO.deposit > 0 ? (
                <div className="flex justify-between w-64 text-amber-300">
                  <span>Paid Deposit:</span>
                  <span className="font-bold">
                    -${activeSO.deposit.toFixed(3)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between w-64 text-sm font-bold border-t border-white/10 pt-1.5 text-cyan-300">
                <span>Grand Total:</span>
                <span>${(activeSO.grandTotal || activeSO.totalAmount).toFixed(3)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-xs p-3.5 bg-white/5 text-slate-200 rounded-xl border border-white/10 text-left">
              <strong className="text-cyan-300 mr-1 font-bold">Remark Note:</strong> {activeSO.remark || 'N/A'}
            </div>
            <div className="text-xs p-3.5 bg-white/5 text-slate-200 rounded-xl border border-white/10 text-left">
              <strong className="text-cyan-300 mr-1 font-bold">Memo Message:</strong> {activeSO.memo || 'N/A'}
            </div>
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
        </motion.div>
      ) : activeTab === 'form' ? (
        /* --- MAIN DUAL-COLUMN FORM LAYOUT (REPLICATING INVOICE DESIGN) --- */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Top Panel: Split 8-cols Grid Inserter & Table / 4-cols Customer Sidebar & Financials */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Column: All Grid & Line Items Table (8 columns) */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Table item inserter dropdown */}
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2.5 rounded-xl shadow-lg backdrop-blur-md relative z-20">
                <span className="text-xs font-bold text-cyan-400 shrink-0 uppercase tracking-wider pl-1 font-sans">
                  Add Stock Item to Grid:
                </span>
                <div className="flex-1">
                  <SearchableCombo
                    options={items.map((it) => ({
                      value: it.id,
                      label: `${it.code} - ${it.name}`,
                      subLabel: it.description || 'No description available',
                      rightLabel: `$${it.price.toFixed(2)} / ${it.um}`
                    }))}
                    value={selectedLineItemToAdd}
                    onChange={(val) => {
                      setSelectedLineItemToAdd(val);
                      handleAddItemToGrid(val);
                    }}
                    placeholder="---Please select stock item to insert---"
                  />
                </div>
              </div>

              {/* Table rendering panel */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-mono border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-white/10 text-slate-300 text-[10px] font-bold uppercase border-b border-white/10">
                        <th className="px-2 py-2 w-8 text-center">#</th>
                        <th className="px-2 py-2 w-16">Items</th>
                        <th className="px-2 py-2">Description</th>
                        <th className="px-2 py-2 w-28 text-center">Promo Mode</th>
                        <th className="px-2 py-2 w-44 text-center">Qty / Promo Package</th>
                        <th className="px-2 py-2 w-16 text-center text-emerald-400 font-bold">Free Qty</th>
                        <th className="px-2 py-2 w-12 text-center">UM</th>
                        <th className="px-2 py-2 w-20 text-right">Price</th>
                        <th className="px-2 py-2 w-16 text-center text-amber-300 font-bold">Disc (%)</th>
                        <th className="px-2 py-2 w-16 text-center text-purple-300 font-bold">VAT (%)</th>
                        <th className="px-2 py-2 w-20 text-right">Sub Total</th>
                        <th className="px-2 py-2 w-8 text-center">X</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {orderCart.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="text-center py-10 text-slate-400 italic">
                            No items loaded in the sales order grid layout. Please select an item above to insert.
                          </td>
                        </tr>
                      ) : (
                        orderCart.map((line, idx) => {
                          const originalItem = items.find(i => i.id === line.itemId);
                          const activeMode = line.promoMode || 'FREE';
                          return (
                            <tr key={idx} className="hover:bg-white/5">
                              <td className="px-2 py-1.5 text-center text-slate-400">{idx + 1}</td>
                              <td className="px-2 py-1.5 text-cyan-300 font-bold">{originalItem ? originalItem.code : 'ITEM'}</td>
                              <td className="px-2 py-1.5 text-white font-sans">
                                <div className="font-medium text-slate-100">{line.description}</div>
                              </td>
                              <td className="px-2 py-1 text-center">
                                {originalItem && originalItem.promoPackages && originalItem.promoPackages.length > 0 ? (
                                  <select
                                    value={activeMode}
                                    onChange={(e) => handlePromoModeChange(idx, e.target.value as 'FREE' | 'DIVIDED')}
                                    className="text-[10px] w-full max-w-[90px] px-2 py-1 bg-slate-800 border border-white/10 rounded text-slate-200 outline-none focus:border-cyan-400 font-sans cursor-pointer text-center font-semibold"
                                  >
                                    <option value="FREE" className="bg-slate-800 text-white">🎁 Free (FOC)</option>
                                    <option value="DIVIDED" className="bg-slate-800 text-white">➗ Divided</option>
                                  </select>
                                ) : (
                                  <span className="text-slate-500 text-xs italic">-</span>
                                )}
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <div className="relative inline-block w-28 text-center">
                                  <div className="relative flex items-center bg-white/10 border border-white/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 rounded-lg overflow-hidden h-8">
                                    <input
                                      type="number"
                                      min={1}
                                      value={line.qty}
                                      onChange={(e) => handleLineQtyChange(idx, parseInt(e.target.value) || 1)}
                                      className="w-full h-full bg-transparent text-center pl-2 pr-7 text-cyan-300 font-bold focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      title="Type manual quantity"
                                    />
                                    
                                    {originalItem && originalItem.promoPackages && originalItem.promoPackages.length > 0 && (
                                      <div className="absolute right-0 top-0 bottom-0 w-7 flex items-center justify-center bg-white/5 hover:bg-cyan-500/10 text-cyan-400 border-l border-white/10 transition-colors">
                                        <select
                                          value={
                                            originalItem.promoPackages.findIndex(p => p.buyQty === line.qty) !== -1
                                              ? String(originalItem.promoPackages.findIndex(p => p.buyQty === line.qty))
                                              : 'custom'
                                          }
                                          onChange={(e) => handlePromoPackageChange(idx, e.target.value)}
                                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                          title="Select a promotional package"
                                        >
                                          <option value="custom" className="bg-slate-900 text-slate-400">✍️ Custom</option>
                                          {originalItem.promoPackages.map((promo, pIdx) => (
                                            <option key={pIdx} value={pIdx} className="bg-slate-900 text-white font-sans text-xs">
                                              Buy {promo.buyQty} +{promo.freeQty} Free
                                            </option>
                                          ))}
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 pointer-events-none" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-1.5 text-center text-emerald-400 font-bold font-mono">
                                {line.freeQty && line.freeQty > 0 ? `+${line.freeQty}` : '-'}
                              </td>
                              <td className="px-2 py-1.5 text-center text-slate-400 font-semibold">{line.um}</td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={line.price}
                                  onChange={(e) => handleLinePriceChange(idx, parseFloat(e.target.value) || 0)}
                                  className="w-16 text-right px-1 py-0.5 bg-white/10 border border-white/10 text-white font-semibold rounded focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={line.discountPercent || 0}
                                  onChange={(e) => handleLineDiscountChange(idx, parseFloat(e.target.value) || 0)}
                                  className="w-10 text-center px-1 py-0.5 bg-white/10 border border-white/10 text-amber-300 text-[11px] rounded outline-none"
                                />
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  value={line.vatPercent || 0}
                                  onChange={(e) => handleLineVatChange(idx, parseFloat(e.target.value) || 0)}
                                  className="w-10 text-center px-1 py-0.5 bg-white/10 border border-white/10 text-purple-300 text-[11px] rounded outline-none"
                                />
                              </td>
                              <td className="px-2 py-1.5 text-right font-bold text-white">
                                ${line.subTotal.toFixed(2)}
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(idx)}
                                  className="text-rose-400 hover:text-rose-350 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column: Customer Metadata Sidebar & Stats (4 columns, matches Invoice sidebar completely) */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Primary Customer & Invoice Info Fields */}
              <div className="bg-white/5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md text-left relative z-30 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActivePanel(activePanel === 'customer' ? null : 'customer')}
                  className="w-full flex items-center justify-between p-4 select-none text-left focus:outline-none cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">
                    Customer & Order Details
                  </span>
                  <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${activePanel === 'customer' ? 'rotate-180' : ''}`} />
                </button>

                <motion.div
                  initial={false}
                  animate={{ height: activePanel === 'customer' ? 'auto' : 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-3.5 border-t border-white/5">
                    {/* Customer */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        Customer <span className="text-cyan-400 font-bold">*</span>
                      </label>
                      <SearchableCustomerSelect
                        customers={customers}
                        selectedId={selectedCustomerId}
                        onChange={handleCustomerChange}
                        required
                      />
                    </div>

                    {/* Tel & Sale Order No side by side */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Tel</label>
                        <input
                          type="text"
                          readOnly
                          placeholder="Phone account"
                          value={tel}
                          className="w-full text-xs px-2.5 py-1.5 bg-white/5 border border-white/5 rounded-lg outline-none cursor-not-allowed font-mono font-bold text-cyan-300"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1"># Order No</label>
                        <input
                          type="text"
                          value={orderNo}
                          onChange={(e) => setOrderNo(e.target.value)}
                          placeholder="SO-XXX"
                          className="w-full text-xs px-2.5 py-1.5 bg-white/10 border border-white/10 rounded-lg font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Date & District side by side */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">
                          Date <span className="text-cyan-400 font-bold">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={orderDate}
                          onChange={(e) => setOrderDate(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg font-semibold font-mono focus:outline-none focus:border-cyan-400 [color-scheme:dark]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">District</label>
                        <SearchableCombo
                          options={Array.from(new Set(customers.map(c => c.district).filter(Boolean))).map((dist) => ({
                            value: dist,
                            label: dist
                          }))}
                          value={district}
                          onChange={(val) => setDistrict(val)}
                          placeholder="Select district..."
                        />
                      </div>
                    </div>

                    {/* Contact Person & Due Date side by side */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Contact Person</label>
                        <input
                          type="text"
                          placeholder="Contact Name"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg font-semibold focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Due Date</label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg font-semibold font-mono focus:outline-none focus:border-cyan-400 [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    {/* PO No & Account Name side by side */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">PO No</label>
                        <input
                          type="text"
                          placeholder="P.O. Ref"
                          value={poNo}
                          onChange={(e) => setPoNo(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg font-semibold focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Account Name</label>
                        <input
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="Accounts label"
                          className="w-full text-xs px-2.5 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg font-semibold focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Class & Receiver side by side */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Class Name</label>
                        <input
                          type="text"
                          placeholder="Division/Class"
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg font-semibold focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Receiver</label>
                        <input
                          type="text"
                          placeholder="Recipient Name"
                          value={receiver}
                          onChange={(e) => setReceiver(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg font-semibold focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Warehouse Hub */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">Warehouse *</label>
                      <SearchableCombo
                        options={warehouses.map((w) => ({
                          value: w.id,
                          label: w.name,
                          rightLabel: w.code
                        }))}
                        value={selectedWarehouseId}
                        onChange={(val) => setSelectedWarehouseId(val)}
                        placeholder="Select warehouse..."
                      />
                    </div>

                    {/* Assigned Sales Representative */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">Sales Rep *</label>
                      <SearchableCombo
                        options={saleReps.map((sr) => ({
                          value: sr.id,
                          label: sr.name,
                          rightLabel: sr.code
                        }))}
                        value={selectedSaleRepId}
                        onChange={(val) => setSelectedSaleRepId(val)}
                        placeholder="Select agent..."
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* VAT & DISCOUNT CARD INPUTS */}
              <div className="bg-white/5 rounded-xl border border-white/10 shadow-xl text-left overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActivePanel(activePanel === 'vat' ? null : 'vat')}
                  className="w-full flex items-center justify-between p-4 select-none text-left focus:outline-none cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide">
                    VAT & Discount (%)
                  </span>
                  <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${activePanel === 'vat' ? 'rotate-180' : ''}`} />
                </button>

                <motion.div
                  initial={false}
                  animate={{ height: activePanel === 'vat' ? 'auto' : 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-3 border-t border-white/5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-300">VAT (%)</label>
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={vatPercentGlobal}
                          onChange={(e) => setVatPercentGlobal(parseFloat(e.target.value) || 0)}
                          className="w-24 text-right px-2.5 py-1 bg-white/10 border border-white/10 text-white rounded text-xs font-mono font-bold outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-300">Discount (%)</label>
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={discountPercentGlobal}
                          onChange={(e) => setDiscountPercentGlobal(parseFloat(e.target.value) || 0)}
                          className="w-24 text-right px-2.5 py-1 bg-white/10 border border-white/10 text-white rounded text-xs font-mono font-bold outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-300">Discount ($)</label>
                        <input
                          type="number"
                          step={0.01}
                          min={0}
                          value={discountValueGlobal}
                          onChange={(e) => setDiscountValueGlobal(parseFloat(e.target.value) || 0)}
                          className="w-24 text-right px-2.5 py-1 bg-white/10 border border-white/10 text-white rounded text-xs font-mono font-bold outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-300">Deposit</label>
                        <input
                          type="number"
                          step={0.01}
                          min={0}
                          value={deposit}
                          onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                          className="w-24 text-right px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-white rounded text-xs font-mono font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* SUMMARY HIGHLIGHT PANEL */}
              <div className="bg-[#0f1d3a]/75 border border-cyan-500/25 rounded-xl shadow-xl backdrop-blur-md text-left overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActivePanel(activePanel === 'summary' ? null : 'summary')}
                  className="w-full flex items-center justify-between p-4 select-none text-left focus:outline-none cursor-pointer hover:bg-cyan-500/5 transition-colors"
                >
                  <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide">
                    Order Summary
                  </span>
                  <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${activePanel === 'summary' ? 'rotate-180' : ''}`} />
                </button>

                <motion.div
                  initial={false}
                  animate={{ height: activePanel === 'summary' ? 'auto' : 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-3 border-t border-cyan-500/10">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <label className="text-xs font-semibold text-slate-300">Total</label>
                        <input
                          type="text"
                          readOnly
                          value={`$${subTotalAmount.toFixed(3)}`}
                          className="w-32 text-right px-2.5 py-1 bg-white/5 border border-white/5 rounded text-xs font-mono font-bold text-white shadow-inner focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-300">VAT ($)</label>
                        <input
                          type="text"
                          readOnly
                          value={`$${vatAmountGlobal.toFixed(3)}`}
                          className="w-32 text-right px-2.5 py-1 bg-white/5 border border-white/5 rounded text-xs font-mono font-bold text-white focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-300">Discount ($)</label>
                        <input
                          type="text"
                          readOnly
                          value={`$${discountAmountGlobal.toFixed(3)}`}
                          className="w-32 text-right px-2.5 py-1 bg-white/5 border border-white/5 rounded text-xs font-mono font-bold text-white focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                        <label className="text-xs font-bold text-emerald-300">Grand Total</label>
                        <input
                          type="text"
                          readOnly
                          value={`$${grandTotal.toFixed(3)}`}
                          className="w-32 text-right px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-mono font-bold text-emerald-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* REMARK & MEMO TEXT AREAS */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-xl space-y-3 text-left">
                <div>
                  <span className="block text-xs font-bold text-cyan-300 uppercase tracking-widest border-b border-white/10 pb-1 font-sans mb-1">
                    Remark &amp; Instructions
                  </span>
                  <textarea
                    rows={2}
                    placeholder="Insert custom order remarks or delivery instructions..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full text-xs p-2 bg-white/10 border border-white/10 text-white rounded-lg outline-none font-sans resize-none focus:border-cyan-400 placeholder-slate-400"
                  />
                </div>

                <div>
                  <span className="block text-xs font-bold text-cyan-300 uppercase tracking-widest border-b border-white/10 pb-1 font-sans mb-1">
                    Memo Settings
                  </span>
                  <textarea
                    rows={2}
                    placeholder="Enter custom memo message..."
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full text-xs p-2 bg-white/10 border border-white/10 text-white rounded-lg outline-none font-sans resize-none focus:border-cyan-400 placeholder-slate-400"
                  />
                </div>
              </div>

            </div>      </div>

          {/* Bottom Toolbar Section */}
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans select-none">
            
            {/* Record navigation walker */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => walkRecord('prev')}
                disabled={saleOrders.length === 0}
                className="bg-white/10 border border-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-45 transition-all"
              >
                &lt;&lt; Prev
              </button>
              <button
                type="button"
                onClick={() => walkRecord('next')}
                disabled={saleOrders.length === 0}
                className="bg-white/10 border border-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-45 transition-all"
              >
                Next &gt;&gt;
              </button>
              {currentIdx > -1 && (
                <span className="text-[10px] text-cyan-300 italic font-medium pl-1">
                  Editing Sale Order record #{currentIdx + 1}
                </span>
              )}
            </div>

            {/* Save / Discard buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFormValues}
                className="px-4 py-2 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors font-semibold"
              >
                Discard Form
              </button>

              <button
                type="button"
                onClick={() => handleSaveOrder(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 font-semibold cursor-pointer transition-all hover:-translate-y-0.5"
              >
                Save &amp; New
              </button>
              
              <button
                type="button"
                onClick={() => handleSaveOrder(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 font-semibold cursor-pointer transition-all hover:-translate-y-0.5"
              >
                Save
              </button>
            </div>

          </div>
        </motion.div>
      ) : (
        /* --- CATALOG REGISTER LIST TAB (REPLICATING INVOICE REGISTER TABLE STYLE) --- */
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
                  <th className="px-5 py-3 text-center w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {saleOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 italic">No sale orders recorded. Click &apos;Create Form&apos; to add one.</td>
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
                              onClick={() => {
                                const idx = saleOrders.findIndex(order => order.id === so.id);
                                if (idx > -1) {
                                  loadOrderToForm(idx);
                                  setActiveTab('form');
                                }
                              }}
                              className="p-1 px-2.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer text-[11px] transition-colors"
                            >
                              <Edit className="w-3 h-3 text-blue-400" />
                              <span>Edit</span>
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
            <p className="text-xs text-slate-300 leading-relaxed font-sans text-left">{confirmState.message}</p>
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

    </div>
  );
}
