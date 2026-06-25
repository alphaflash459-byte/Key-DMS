import { useState, useEffect } from 'react';
import { CustomerInfo, Warehouse, SaleRep, Item, SaleOrder, Invoice, InvoiceItem } from '../types';
import { calculateFreePromoQty, calculateDividedPrice } from '../utils';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Printer, 
  CheckCircle,
  FileText,
  AlertTriangle,
  ChevronDown,
  Gift
} from 'lucide-react';
import { motion } from 'motion/react';
import { SearchableCustomerSelect } from './SearchableCustomerSelect';
import SearchableCombo from './SearchableCombo';

interface InvoiceFormProps {
  type: 'TAX' | 'NON_TAX';
  customers: CustomerInfo[];
  warehouses: Warehouse[];
  saleReps: SaleRep[];
  items: Item[];
  saleOrders: SaleOrder[];
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  initialSelectedSO?: SaleOrder | null;
  onClearInitialSO?: () => void;
  onLineItemAdded?: () => void;
}

export default function InvoiceForm({
  type,
  customers,
  warehouses,
  saleReps,
  items,
  saleOrders,
  invoices,
  setInvoices,
  initialSelectedSO,
  onClearInitialSO,
  onLineItemAdded
}: InvoiceFormProps) {
  // Toggle between Form and Register List view
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [currentIdx, setCurrentIdx] = useState<number>(-1); // for navigation arrows

  // --- FORM STATES (REPLICATING SCREENSHOT) ---
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [tel, setTel] = useState('');
  
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [soNo, setSoNo] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [saleRepId, setSaleRepId] = useState('');
  const [district, setDistrict] = useState('');
  
  const [remark, setRemark] = useState(
    'Please make sure to receive a receipt and sign properly to confirm your payment. Purchased goods are non-refundable.'
  );

  // Line row configuration
  const [poNo, setPoNo] = useState('');
  const [accountName, setAccountName] = useState('1500-Account Receivables');
  const [className, setClassName] = useState('');
  const [receiver, setReceiver] = useState('');

  // Main table list items
  const [invoiceLines, setInvoiceLines] = useState<InvoiceItem[]>([]);
  const [selectedLineItemToAdd, setSelectedLineItemToAdd] = useState('');

  // Right column VAT, Discounts, Deposit
  const [vatPercentGlobal, setVatPercentGlobal] = useState<number>(type === 'TAX' ? 10 : 0);
  const [discountPercentGlobal, setDiscountPercentGlobal] = useState<number>(0);
  const [discountValueGlobal, setDiscountValueGlobal] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  
  // Memo
  const [memo, setMemo] = useState('');

  // Sidebar collapsible panels (accordion behavior)
  const [activePanel, setActivePanel] = useState<'customer' | 'vat' | 'summary' | null>('customer');

  // Notification notification
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Auto-generate invoice number on component mount
  useEffect(() => {
    generateNewInvoiceNo();
    if (warehouses.length > 0) {
      setWarehouseId(warehouses[0].id); // SRA Drinkshop by default
    }
  }, [type, warehouses]);

  // Handle imported sales order from parent (passed via state)
  useEffect(() => {
    if (initialSelectedSO) {
      importSalesOrder(initialSelectedSO);
      if (onClearInitialSO) onClearInitialSO();
    }
  }, [initialSelectedSO]);

  const generateNewInvoiceNo = () => {
    const prefix = type === 'TAX' ? 'T-INV' : 'INV';
    const rand = Math.floor(100000 + Math.random() * 900000);
    setInvoiceNo(`${prefix}${rand}`);
  };

  // Import lines from Selected Sales Order
  const importSalesOrder = (so: SaleOrder) => {
    setSelectedCustomerId(so.customerId);
    const relatedCust = customers.find(c => c.id === so.customerId);
    if (relatedCust) {
      setContactPerson(relatedCust.contactPerson);
      setTel(relatedCust.tel);
      setDistrict(relatedCust.district);
    }
    setSoNo(so.orderNo);
    setWarehouseId(so.warehouseId);
    setSaleRepId(so.saleRepId);
    setRemark(so.remark || remark);

    const importedLines: InvoiceItem[] = so.items.map(item => {
      const lineItem = items.find(i => i.id === item.itemId);
      return {
        itemId: item.itemId,
        description: item.description,
        otherField: 'SO IMPORT',
        qty: item.qty,
        freeQty: item.freeQty || 0,
        um: item.um,
        price: item.price,
        discountPercent: 0,
        vatPercent: type === 'TAX' ? 10 : 0,
        subTotal: item.qty * item.price
      };
    });

    setInvoiceLines(importedLines);
    setAlertMsg({ type: 'success', text: `Successfully imported Sale Order ${so.orderNo}!` });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Customer change auto-populates details
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

  // Sales Order change lookup from dropdown
  const handleSOChange = (orderNoValue: string) => {
    setSoNo(orderNoValue);
    if (!orderNoValue) return;
    const matchedSO = saleOrders.find(so => so.orderNo === orderNoValue);
    if (matchedSO) {
      importSalesOrder(matchedSO);
    }
  };

  // Add selected item to grid list
  const handleAddLineItem = (itemId: string) => {
    if (!itemId) return;
    const item = items.find(i => i.id === itemId);
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

    const newLine: InvoiceItem = {
      itemId: item.id,
      description: item.description || item.name,
      otherField: '',
      qty: initialQty,
      freeQty: finalFreeQty,
      promoMode: hasPromo ? mode : undefined,
      um: item.um,
      price: finalPrice,
      discountPercent: 0,
      vatPercent: type === 'TAX' ? 10 : 0,
      subTotal: finalPrice
    };
    setInvoiceLines([...invoiceLines, newLine]);
    setSelectedLineItemToAdd(''); // clear dropdown placeholder
    onLineItemAdded?.();
  };

  // Line modification functions
  const handleLineQtyChange = (idx: number, qty: number) => {
    const updated = [...invoiceLines];
    const safeQty = Math.max(1, qty);
    updated[idx].qty = safeQty;

    // Dynamically calculate and apply free promo items or divided price
    const item = items.find(i => i.id === updated[idx].itemId);
    if (item) {
      const hasPromo = item.promoPackages && item.promoPackages.length > 0;
      if (hasPromo) {
        // Auto-detect promo mode: if safeQty fits any package's buyQty perfectly, use FREE, otherwise DIVIDED
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
    setInvoiceLines(updated);
  };

  const handlePromoModeChange = (idx: number, mode: 'FREE' | 'DIVIDED') => {
    const updated = [...invoiceLines];
    updated[idx].promoMode = mode;

    const item = items.find(i => i.id === updated[idx].itemId);
    if (item) {
      if (mode === 'FREE') {
        const { freeQty } = calculateFreePromoQty(item, updated[idx].qty);
        updated[idx].freeQty = freeQty || 0;
        updated[idx].price = item.price; // reset to standard
      } else if (mode === 'DIVIDED') {
        updated[idx].freeQty = 0;
        const { price: divPrice } = calculateDividedPrice(item, updated[idx].qty);
        updated[idx].price = divPrice;
      }
    }

    updated[idx].subTotal = calculateLineSubtotal(updated[idx]);
    setInvoiceLines(updated);
  };

  const handlePromoPackageChange = (idx: number, pkgVal: string) => {
    if (pkgVal === 'custom') return;
    const updated = [...invoiceLines];
    const item = items.find(i => i.id === updated[idx].itemId);
    if (!item || !item.promoPackages) return;

    const pkgIdx = parseInt(pkgVal, 10);
    const promo = item.promoPackages[pkgIdx];
    if (promo) {
      updated[idx].qty = promo.buyQty;
      // Always automatically set mode to 'FREE' and populate the free quantity
      updated[idx].promoMode = 'FREE';
      updated[idx].freeQty = promo.freeQty;
      updated[idx].price = item.price;
      updated[idx].subTotal = calculateLineSubtotal(updated[idx]);
      setInvoiceLines(updated);
    }
  };

  const handleLinePriceChange = (idx: number, price: number) => {
    const updated = [...invoiceLines];
    updated[idx].price = Math.max(0, price);
    updated[idx].subTotal = calculateLineSubtotal(updated[idx]);
    setInvoiceLines(updated);
  };

  const handleLineDiscountChange = (idx: number, disc: number) => {
    const updated = [...invoiceLines];
    updated[idx].discountPercent = Math.max(0, Math.min(100, disc));
    updated[idx].subTotal = calculateLineSubtotal(updated[idx]);
    setInvoiceLines(updated);
  };

  const handleLineVatChange = (idx: number, vat: number) => {
    const updated = [...invoiceLines];
    updated[idx].vatPercent = Math.max(0, vat);
    updated[idx].subTotal = calculateLineSubtotal(updated[idx]);
    setInvoiceLines(updated);
  };

  const handleLineOtherFieldChange = (idx: number, text: string) => {
    const updated = [...invoiceLines];
    updated[idx].otherField = text;
    setInvoiceLines(updated);
  };

  const handleRemoveLine = (idx: number) => {
    setInvoiceLines(invoiceLines.filter((_, i) => i !== idx));
  };

  const handleDeleteInvoice = (id: string, invoiceNumber: string) => {
    setConfirmState({
      title: 'Delete Invoice',
      message: `Are you sure you want to delete invoice ${invoiceNumber}? This action is irreversible.`,
      onConfirm: () => {
        setInvoices(invoices.filter(i => i.id !== id));
        setConfirmState(null);
        setAlertMsg({ type: 'success', text: `Invoice ${invoiceNumber} deleted successfully.` });
        setTimeout(() => setAlertMsg(null), 3000);
      }
    });
  };

  // Line Sub-Total Formula: (Qty * Price) - applied line discount
  const calculateLineSubtotal = (line: InvoiceItem) => {
    const grossPrice = line.qty * line.price;
    const discountAmount = grossPrice * (line.discountPercent / 100);
    return Math.max(0, grossPrice - discountAmount);
  };

  // --- CALCULATION OF EXCEL SUMMARY BLOCK ---
  // SubTotal of all item rows
  const subTotalAmount = invoiceLines.reduce((sum, line) => sum + line.subTotal, 0);

  // Global applied VAT
  const vatAmountGlobal = subTotalAmount * (vatPercentGlobal / 100);

  // Global Discount amount: sum of discount % + outright discount $
  const discountAmountGlobal = (subTotalAmount * (discountPercentGlobal / 100)) + discountValueGlobal;

  // Grand Total = (SubTotal + Global VAT) - Global Discount - Deposit
  const grandTotal = Math.max(0, (subTotalAmount + vatAmountGlobal) - discountAmountGlobal - deposit);

  const resetAllFormValues = () => {
    setSelectedCustomerId('');
    setContactPerson('');
    setTel('');
    generateNewInvoiceNo();
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setSoNo('');
    setDistrict('');
    setPoNo('');
    setClassName('');
    setReceiver('');
    setInvoiceLines([]);
    setVatPercentGlobal(type === 'TAX' ? 10 : 0);
    setDiscountPercentGlobal(0);
    setDiscountValueGlobal(0);
    setDeposit(0);
    setMemo('');
  };

  // Save Invoice Records
  const handleSaveInvoice = (andNew: boolean) => {
    if (!selectedCustomerId) {
      setAlertMsg({ type: 'error', text: 'Error: Customer selection is mandatory. Please select a Customer first.' });
      setTimeout(() => setAlertMsg(null), 4000);
      return;
    }
    if (invoiceNo === '') {
      setAlertMsg({ type: 'error', text: 'Error: Invoice No cannot be empty.' });
      setTimeout(() => setAlertMsg(null), 4000);
      return;
    }
    if (invoiceLines.length === 0) {
      setAlertMsg({ type: 'error', text: 'Error: Table must contain at least 1 item.' });
      setTimeout(() => setAlertMsg(null), 4000);
      return;
    }

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      type: type,
      invoiceNo: invoiceNo,
      date: date,
      dueDate: dueDate || date,
      customerId: selectedCustomerId,
      contactPerson: contactPerson,
      tel: tel,
      soNo: soNo,
      warehouseId: warehouseId,
      saleRepId: saleRepId,
      district: district,
      remark: remark,
      poNo: poNo,
      accountName: accountName,
      className: className,
      receiver: receiver,
      items: invoiceLines,
      vatPercentGlobal: vatPercentGlobal,
      discountPercentGlobal: discountPercentGlobal,
      discountValueGlobal: discountValueGlobal,
      deposit: deposit,
      subTotalAmount: parseFloat(subTotalAmount.toFixed(3)),
      vatAmountGlobal: parseFloat(vatAmountGlobal.toFixed(3)),
      discountAmountGlobal: parseFloat(discountAmountGlobal.toFixed(3)),
      grandTotal: parseFloat(grandTotal.toFixed(3)),
      memo: memo
    };

    setInvoices([newInvoice, ...invoices]);
    setAlertMsg({ 
      type: 'success', 
      text: `Successfully recorded ${type === 'TAX' ? 'Tax' : 'Non-Tax'} Invoice ${invoiceNo}!` 
    });

    setTimeout(() => {
      setAlertMsg(null);
    }, 4500);

    if (andNew) {
      resetAllFormValues();
    } else {
      setActiveTab('list');
    }
  };

  // Arrow navigation triggers
  const walkRecord = (direction: 'prev' | 'next') => {
    if (invoices.length === 0) return;
    let nextIdx = currentIdx;
    if (direction === 'prev') {
      nextIdx = currentIdx === -1 ? invoices.length - 1 : Math.max(0, currentIdx - 1);
    } else {
      nextIdx = currentIdx === -1 ? 0 : Math.min(invoices.length - 1, currentIdx + 1);
    }

    const rec = invoices[nextIdx];
    if (rec) {
      setCurrentIdx(nextIdx);
      // Load values
      setSelectedCustomerId(rec.customerId);
      setContactPerson(rec.contactPerson);
      setTel(rec.tel);
      setInvoiceNo(rec.invoiceNo);
      setDate(rec.date);
      setDueDate(rec.dueDate);
      setSoNo(rec.soNo || '');
      setWarehouseId(rec.warehouseId);
      setSaleRepId(rec.saleRepId);
      setDistrict(rec.district);
      setRemark(rec.remark);
      setPoNo(rec.poNo);
      setAccountName(rec.accountName);
      setClassName(rec.className);
      setReceiver(rec.receiver);
      setInvoiceLines(rec.items);
      setVatPercentGlobal(rec.vatPercentGlobal);
      setDiscountPercentGlobal(rec.discountPercentGlobal);
      setDiscountValueGlobal(rec.discountValueGlobal);
      setDeposit(rec.deposit);
      setMemo(rec.memo);
    }
  };

  return (
    <div id="invoice-workspace" className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-white">
      
      {/* Alert toast notifications */}
      {alertMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 right-6 z-50 bg-[#0f172a]/95 backdrop-blur-md text-white border border-cyan-500/30 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-semibold text-xs"
        >
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{alertMsg.text}</span>
        </motion.div>
      )}

      {/* Mode selectors */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm uppercase tracking-wider text-white border-l-4 border-cyan-400 pl-2">
            Workspace: {type === 'TAX' ? 'Tax Invoicing' : 'Invoice Non Tax'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              activeTab === 'form' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Form
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              activeTab === 'list' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            Invoices List ({invoices.filter(i => i.type === type).length})
          </button>
        </div>
      </div>

      {activeTab === 'form' ? (
        /* --- MAIN FORM (MATCHES SCREENSHOT) --- */
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
                      handleAddLineItem(val);
                    }}
                    placeholder="---Please select stock item to insert---"
                  />
                </div>
              </div>

              {/* Table rendering panel */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-mono border-collapse min-w-[720px]">
                    <thead>
                      <tr className="bg-white/10 text-slate-300 text-[10px] font-bold uppercase border-b border-white/10">
                        <th className="px-2 py-2 w-8 text-center">#</th>
                        <th className="px-2 py-2 w-16">Items</th>
                        <th className="px-2 py-2">Description</th>
                        <th className="px-2 py-2 w-28 text-center">Promo Mode</th>
                        <th className="px-2 py-2 w-44 text-center">Qty / Promo Package</th>
                        <th className="px-2 py-2 w-16 text-center text-emerald-400">Free Qty</th>
                        <th className="px-2 py-2 w-12 text-center">UM</th>
                        <th className="px-2 py-2 w-20 text-right">Price</th>
                        <th className="px-2 py-2 w-12 text-center">Disc (%)</th>
                        <th className="px-2 py-2 w-12 text-center">VAT (%)</th>
                        <th className="px-2 py-2 w-20 text-right">Sub Total</th>
                        <th className="px-2 py-2 w-8 text-center">X</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {invoiceLines.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="text-center py-10 text-slate-400 italic">
                            No items loaded in the invoice grid layout. Please select an item above or import a Sales Order.
                          </td>
                        </tr>
                      ) : (
                        invoiceLines.map((line, idx) => {
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
                                  value={line.discountPercent}
                                  onChange={(e) => handleLineDiscountChange(idx, parseFloat(e.target.value) || 0)}
                                  className="w-10 text-center px-1 py-0.5 bg-white/10 border border-white/10 text-amber-300 text-[11px] rounded"
                                />
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  value={line.vatPercent}
                                  onChange={(e) => handleLineVatChange(idx, parseFloat(e.target.value) || 0)}
                                  className="w-10 text-center px-1 py-0.5 bg-white/10 border border-white/10 text-purple-300 text-[11px] rounded"
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

            {/* Right Column: Customer Metadata Sidebar & Financial Stats (4 columns, matches user screenshot exactly) */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Primary Customer & Invoice Info Fields */}
              <div className="bg-white/5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md text-left relative z-30 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActivePanel(activePanel === 'customer' ? null : 'customer')}
                  className="w-full flex items-center justify-between p-4 select-none text-left focus:outline-none cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">
                    Customer & Invoice
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

                    {/* Tel & Invoice No in 2-cols layout side by side */}
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
                        <label className="block text-[10px] font-[700] text-slate-300 mb-1"># Invoice No</label>
                        <input
                          type="text"
                          value={invoiceNo}
                          onChange={(e) => setInvoiceNo(e.target.value)}
                          placeholder="INV-XXX"
                          className="w-full text-xs px-2.5 py-1.5 bg-white/10 border border-white/10 rounded-lg font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Date & District side by side */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">
                          Date <span className="text-cyan-450 font-bold">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
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

                    {/* Warehouse */}
                    <div>
                      <label className="block text-[10px] font-[700] text-slate-300 mb-1">Warehouse</label>
                      <SearchableCombo
                        options={warehouses.map((w) => ({
                          value: w.id,
                          label: w.name,
                          subLabel: w.location ? `Loc: ${w.location}` : undefined,
                          rightLabel: w.code
                        }))}
                        value={warehouseId}
                        onChange={(val) => setWarehouseId(val)}
                        placeholder="Select warehouse..."
                      />
                    </div>

                    {/* Sale Rep */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">Sale Rep</label>
                      <SearchableCombo
                        options={saleReps.map((sr) => ({
                          value: sr.id,
                          label: sr.name,
                          rightLabel: sr.code
                        }))}
                        value={saleRepId}
                        onChange={(val) => setSaleRepId(val)}
                        placeholder="---Please select---"
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
                        <label className="text-xs font-semibold text-slate-300">VAT(%)</label>
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={vatPercentGlobal}
                          onChange={(e) => setVatPercentGlobal(parseFloat(e.target.value) || 0)}
                          className="w-24 text-right px-2.5 py-1 bg-white/10 border border-white/10 text-white rounded text-xs font-mono font-bold"
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
                          className="w-24 text-right px-2.5 py-1 bg-white/10 border border-white/10 text-white rounded text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-300">Discount($)</label>
                        <input
                          type="number"
                          step={0.01}
                          min={0}
                          value={discountValueGlobal}
                          onChange={(e) => setDiscountValueGlobal(parseFloat(e.target.value) || 0)}
                          className="w-24 text-right px-2.5 py-1 bg-white/10 border border-white/10 text-white rounded text-xs font-mono font-bold"
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
                          className="w-24 text-right px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-white rounded text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* SUMMARY HIGHLIGHT BLOCK */}
              <div className="bg-[#0f1d3a]/75 border border-cyan-500/25 rounded-xl shadow-xl backdrop-blur-md text-left overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActivePanel(activePanel === 'summary' ? null : 'summary')}
                  className="w-full flex items-center justify-between p-4 select-none text-left focus:outline-none cursor-pointer hover:bg-cyan-500/5 transition-colors"
                >
                  <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide">
                    Invoice Summary
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
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-300">Total</label>
                        <input
                          type="text"
                          readOnly
                          value={subTotalAmount.toFixed(3)}
                          className="w-32 text-right px-2.5 py-1 bg-white/5 border border-white/5 rounded text-xs font-mono font-bold text-white shadow-inner focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-300">VAT ($)</label>
                        <input
                          type="text"
                          readOnly
                          value={vatAmountGlobal.toFixed(3)}
                          className="w-32 text-right px-2.5 py-1 bg-white/5 border border-white/5 rounded text-xs font-mono font-bold text-white focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-300">Discount($)</label>
                        <input
                          type="text"
                          readOnly
                          value={discountAmountGlobal.toFixed(3)}
                          className="w-32 text-right px-2.5 py-1 bg-white/5 border border-white/5 rounded text-xs font-mono font-bold text-white focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                        <label className="text-xs font-bold text-emerald-300">Grand Total</label>
                        <input
                          type="text"
                          readOnly
                          value={grandTotal.toFixed(3)}
                          className="w-32 text-right px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-mono font-bold text-emerald-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* MEMO TEXT AREA */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-xl space-y-2 text-left">
                <span className="block text-xs font-bold text-cyan-300 uppercase tracking-widest border-b border-white/10 pb-1 font-sans">
                  Memo Settings
                </span>
                <textarea
                  rows={3}
                  placeholder="Insert memo comments..."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full text-xs p-2 bg-white/10 border border-white/10 text-white rounded-lg outline-none font-sans resize-none focus:border-cyan-400 placeholder-slate-400"
                />
              </div>

            </div>

          </div>

          {/* Bottom Toolbar section (Save & New, Save, Cancel, page walk arrows) */}
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans select-none">
            
            {/* Navigation page arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => walkRecord('prev')}
                disabled={invoices.length === 0}
                className="bg-white/10 border border-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-45 transition-all text-shadow-sm"
              >
                &lt;&lt; Prev
              </button>
              <button
                type="button"
                onClick={() => walkRecord('next')}
                disabled={invoices.length === 0}
                className="bg-white/10 border border-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-45 transition-all text-shadow-sm"
              >
                Next &gt;&gt;
              </button>
              {currentIdx > -1 && (
                <span className="text-[10px] text-cyan-300 italic font-medium pl-1">
                  Viewing Invoice record #{currentIdx + 1}
                </span>
              )}
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveInvoice(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 font-semibold cursor-pointer transition-all hover:-translate-y-0.5"
              >
                Save &amp; New
              </button>
              
              <button
                type="button"
                onClick={() => handleSaveInvoice(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 font-semibold cursor-pointer transition-all hover:-translate-y-0.5"
              >
                Save
              </button>

              <button
                type="button"
                onClick={resetAllFormValues}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-500/25 font-semibold cursor-pointer transition-all hover:-translate-y-0.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        /* --- LIST LAYOUT OF REGISTERED INVOICES --- */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md text-white"
        >
          <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Invoices Log Book ({type})</span>
            </h3>
            
            <button
              onClick={resetAllFormValues}
              className="text-white bg-blue-600 hover:bg-blue-500 font-semibold text-xs px-4 py-2 rounded-xl shadow-lg shadow-blue-500/25 cursor-pointer transition-all"
            >
              + Create Invoice Form
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/10 text-slate-300 text-[10px] uppercase font-bold border-b border-white/10">
                  <th className="px-5 py-3 font-semibold">Invoice No</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Invoice Date</th>
                  <th className="px-5 py-3 font-semibold font-mono text-center">Lines Count</th>
                  <th className="px-5 py-3 font-semibold text-right">Subtotal</th>
                  <th className="px-5 py-3 font-semibold text-right">VAT Value</th>
                  <th className="px-5 py-3 font-semibold text-right">Discount</th>
                  <th className="px-5 py-3 font-semibold text-right">Grand Total</th>
                  <th className="px-5 py-3 font-semibold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {invoices.filter((i) => i.type === type).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400 italic">No invoices drafted yet for this selection. Toggle to Form and hit Save.</td>
                  </tr>
                ) : (
                  invoices
                    .filter((i) => i.type === type)
                    .map((item, idX) => {
                      const relatedCust = customers.find(c => c.id === item.customerId);
                      return (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold text-cyan-300">{item.invoiceNo}</td>
                          <td className="px-5 py-3 font-medium text-white">{relatedCust?.name || 'Unknown'}</td>
                          <td className="px-5 py-3 font-mono text-slate-400">{item.date}</td>
                          <td className="px-5 py-3 font-mono text-center text-cyan-300 font-bold">{item.items.length} lines</td>
                          <td className="px-5 py-3 text-right font-mono">${item.subTotalAmount.toFixed(2)}</td>
                          <td className="px-5 py-3 text-right font-mono text-purple-300">${item.vatAmountGlobal.toFixed(2)}</td>
                          <td className="px-5 py-3 text-right font-mono text-rose-300">${item.discountAmountGlobal.toFixed(2)}</td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-emerald-300 bg-emerald-500/10">${item.grandTotal.toFixed(2)}</td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-sans">
                              <button
                                onClick={() => {
                                  // Locate global index
                                  const globIdx = invoices.findIndex(i => i.id === item.id);
                                  setCurrentIdx(globIdx);
                                  setSelectedCustomerId(item.customerId);
                                  setContactPerson(item.contactPerson);
                                  setTel(item.tel);
                                  setInvoiceNo(item.invoiceNo);
                                  setDate(item.date);
                                  setDueDate(item.dueDate);
                                  setSoNo(item.soNo || '');
                                  setWarehouseId(item.warehouseId);
                                  setSaleRepId(item.saleRepId);
                                  setDistrict(item.district);
                                  setRemark(item.remark);
                                  setPoNo(item.poNo);
                                  setAccountName(item.accountName);
                                  setClassName(item.className);
                                  setReceiver(item.receiver);
                                  setInvoiceLines(item.items);
                                  setVatPercentGlobal(item.vatPercentGlobal);
                                  setDiscountPercentGlobal(item.discountPercentGlobal);
                                  setDiscountValueGlobal(item.discountValueGlobal);
                                  setDeposit(item.deposit);
                                  setMemo(item.memo);
                                  setActiveTab('form');
                                }}
                                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 rounded-lg font-semibold cursor-pointer text-[10px]"
                              >
                                Edit/Load
                              </button>
                              <button
                                onClick={() => handleDeleteInvoice(item.id, item.invoiceNo)}
                                className="p-1 px-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer text-[10px] transition-colors"
                                title="Delete Invoice"
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
        </motion.div>
      )}
      {/* Custom Confirmation Dialog */}
      {confirmState && (
        <div id="confirm-modal-invoice" className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
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
    </div>
  );
}
