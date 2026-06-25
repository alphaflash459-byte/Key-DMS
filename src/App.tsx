import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CustomerManagement from './components/CustomerManagement';
import SaleOrderManagement from './components/SaleOrderManagement';
import InvoiceForm from './components/InvoiceForm';
import SalesReport from './components/SalesReport';
import GeneralSetup from './components/GeneralSetup';

import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { 
  loadUserDataFromCloud, 
  saveFullUserDataToCloud 
} from './sync';
import AuthScreen from './components/AuthScreen';
import { Activity } from 'lucide-react';



import { 
  CustomerType, 
  CustomerInfo, 
  Warehouse, 
  SaleRep, 
  Item, 
  SaleOrder, 
  Invoice, 
  DMSConfig 
} from './types';

import { 
  INITIAL_CUSTOMER_TYPES, 
  INITIAL_CUSTOMERS, 
  INITIAL_WAREHOUSES, 
  INITIAL_SALE_REPS, 
  INITIAL_ITEMS, 
  INITIAL_SALE_ORDERS, 
  INITIAL_INVOICES, 
  INITIAL_CONFIG 
} from './sampleData';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('invoice-non-tax'); // Default to INVOICE NON TAX as requested in screen description!
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // --- AUTHENTICATION STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [demoUser, setDemoUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncingFromCloud, setSyncingFromCloud] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const activeUser = user || demoUser;

  // --- PERSISTED STATE BLOCKS ---
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>(() => {
    const saved = localStorage.getItem('dms_customer_types');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_TYPES;
  });

  const [customers, setCustomers] = useState<CustomerInfo[]>(() => {
    const saved = localStorage.getItem('dms_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem('dms_warehouses');
    return saved ? JSON.parse(saved) : INITIAL_WAREHOUSES;
  });

  const [saleReps, setSaleReps] = useState<SaleRep[]>(() => {
    const saved = localStorage.getItem('dms_sale_reps');
    return saved ? JSON.parse(saved) : INITIAL_SALE_REPS;
  });

  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('dms_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>(() => {
    const saved = localStorage.getItem('dms_sale_orders');
    return saved ? JSON.parse(saved) : INITIAL_SALE_ORDERS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('dms_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [config, setConfig] = useState<DMSConfig>(() => {
    const saved = localStorage.getItem('dms_config');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  // State to hold a Sale Order that was selected to be converted to an Invoice
  const [selectedSOToInvoice, setSelectedSOToInvoice] = useState<SaleOrder | null>(null);

  // --- SYNC ENGINE FOR FIREBASE ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setSyncingFromCloud(true);
        setIsLoaded(false);
        isFirstSyncRef.current = true;
        try {
          const cloudData = await loadUserDataFromCloud(currentUser.uid);
          if (cloudData) {
            if (cloudData.customerTypes) setCustomerTypes(cloudData.customerTypes);
            if (cloudData.customers) setCustomers(cloudData.customers);
            if (cloudData.warehouses) setWarehouses(cloudData.warehouses);
            if (cloudData.saleReps) setSaleReps(cloudData.saleReps);
            if (cloudData.items) setItems(cloudData.items);
            if (cloudData.saleOrders) setSaleOrders(cloudData.saleOrders);
            if (cloudData.invoices) setInvoices(cloudData.invoices);
            if (cloudData.config) setConfig(cloudData.config);
          } else {
            // If cloud has no state (new user), upload our existing state
            await saveFullUserDataToCloud(currentUser.uid, {
              customerTypes,
              customers,
              warehouses,
              saleReps,
              items,
              saleOrders,
              invoices,
              config
            });
          }
        } catch (err) {
          console.error('Error loading data from cloud on auth state change:', err);
        } finally {
          setSyncingFromCloud(false);
          setIsLoaded(true);
        }
      } else {
        setUser(null);
        setIsLoaded(true);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      setAuthLoading(true);
      isFirstSyncRef.current = true;
      setIsLoaded(false);
      if (user) {
        await signOut(auth);
      }
      setDemoUser(null);
      // Clean up states back to samples or empty, can keep local storage or reset
      setCustomerTypes(INITIAL_CUSTOMER_TYPES);
      setCustomers(INITIAL_CUSTOMERS);
      setWarehouses(INITIAL_WAREHOUSES);
      setSaleReps(INITIAL_SALE_REPS);
      setItems(INITIAL_ITEMS);
      setSaleOrders(INITIAL_SALE_ORDERS);
      setInvoices(INITIAL_INVOICES);
      setConfig(INITIAL_CONFIG);
      localStorage.clear();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  // --- SAVE HOOKS TO LOCAL STORAGE ---
  useEffect(() => {
    localStorage.setItem('dms_customer_types', JSON.stringify(customerTypes));
  }, [customerTypes]);

  useEffect(() => {
    localStorage.setItem('dms_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('dms_warehouses', JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem('dms_sale_reps', JSON.stringify(saleReps));
  }, [saleReps]);

  useEffect(() => {
    localStorage.setItem('dms_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('dms_sale_orders', JSON.stringify(saleOrders));
  }, [saleOrders]);

  useEffect(() => {
    localStorage.setItem('dms_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('dms_config', JSON.stringify(config));
  }, [config]);

  // --- CLOUD SYNC DEBOUNCED ENGINE ---
  const isFirstSyncRef = useRef(true);

  useEffect(() => {
    if (!user || !isLoaded) return;

    if (isFirstSyncRef.current) {
      isFirstSyncRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        console.log('Debounced saving entire state to Firestore for user:', user.uid);
        await saveFullUserDataToCloud(user.uid, {
          customerTypes,
          customers,
          warehouses,
          saleReps,
          items,
          saleOrders,
          invoices,
          config
        });
      } catch (err) {
        console.error('Error in debounced cloud sync:', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    user,
    isLoaded,
    customerTypes,
    customers,
    warehouses,
    saleReps,
    items,
    saleOrders,
    invoices,
    config
  ]);


  // Action: Convert Sale Order into an Invoice
  const handleCreateInvoiceFromSO = (so: SaleOrder) => {
    setSelectedSOToInvoice(so);
    
    // Mark sales order as Invoiced
    setSaleOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === so.id ? { ...order, status: 'Invoiced' } : order
      )
    );

    // Switch view to invoice-non-tax
    setCurrentView('invoice-non-tax');
  };

  const clearSelectedSO = () => {
    setSelectedSOToInvoice(null);
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0b0f19] text-white font-sans relative">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[130px] pointer-events-none"></div>
        <div className="flex flex-col items-center z-10 select-none">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center border border-white/20 shadow-2xl mb-4 relative">
            <span className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"></span>
            <Activity className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-xs font-semibold tracking-widest text-cyan-300 uppercase animate-pulse">Loading System State...</p>
        </div>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <AuthScreen 
        onSuccess={() => {}} 
        onDemoMode={() => {
          setDemoUser({
            uid: 'demo_offline_user',
            email: 'demo@rakottcs.com',
            displayName: 'Demo (Offline Mode)'
          });
        }} 
      />
    );
  }

  return (
    <div id="dfm-container" className="flex h-screen w-screen bg-[#0b0f19] text-white overflow-hidden font-sans relative">
      {/* Mesh Gradient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[130px] pointer-events-none z-0"></div>

      {/* Sidebar Component */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        user={activeUser} 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen} 
      />

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10">
        {/* Top Header Navigation matching active screen titles */}
        <Header 
          currentView={currentView} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        {/* View content switch board */}
        <main className="flex-1 overflow-y-auto bg-[#0b0f19]/30 backdrop-blur-sm">
          {currentView === 'setup-customer-type' && (
            <CustomerManagement 
              viewMode="type"
              customerTypes={customerTypes} 
              customers={customers}
              setCustomerTypes={setCustomerTypes}
              setCustomers={setCustomers}
            />
          )}

          {currentView === 'setup-customer-info' && (
            <CustomerManagement 
              viewMode="info"
              customerTypes={customerTypes} 
              customers={customers}
              setCustomerTypes={setCustomerTypes}
              setCustomers={setCustomers}
            />
          )}

          {currentView === 'sale-order' && (
            <SaleOrderManagement 
              customers={customers}
              warehouses={warehouses}
              saleReps={saleReps}
              items={items}
              saleOrders={saleOrders}
              setSaleOrders={setSaleOrders}
              onCreateInvoiceFromSO={handleCreateInvoiceFromSO}
            />
          )}

          {currentView === 'invoice-non-tax' && (
            <InvoiceForm 
              type="NON_TAX"
              customers={customers}
              warehouses={warehouses}
              saleReps={saleReps}
              items={items}
              saleOrders={saleOrders}
              invoices={invoices}
              setInvoices={setInvoices}
              initialSelectedSO={selectedSOToInvoice}
              onClearInitialSO={clearSelectedSO}
              onLineItemAdded={() => setIsSidebarOpen(false)}
            />
          )}

          {currentView === 'invoice-tax' && (
            <InvoiceForm 
              type="TAX"
              customers={customers}
              warehouses={warehouses}
              saleReps={saleReps}
              items={items}
              saleOrders={saleOrders}
              invoices={invoices}
              setInvoices={setInvoices}
              initialSelectedSO={selectedSOToInvoice}
              onClearInitialSO={clearSelectedSO}
              onLineItemAdded={() => setIsSidebarOpen(false)}
            />
          )}

          {currentView === 'sales-dashboard' && (
            <SalesReport 
              invoices={invoices}
              customers={customers}
              customerTypes={customerTypes}
              saleReps={saleReps}
            />
          )}

          {currentView === 'general-setup' && (
            <GeneralSetup 
              warehouses={warehouses}
              setWarehouses={setWarehouses}
              items={items}
              setItems={setItems}
              saleReps={saleReps}
              setSaleReps={setSaleReps}
              config={config}
              setConfig={setConfig}
            />
          )}
        </main>
      </div>
    </div>
  );
}
