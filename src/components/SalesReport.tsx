import { useMemo } from 'react';
import { Invoice, CustomerInfo, CustomerType, SaleRep } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Award,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface SalesReportProps {
  invoices: Invoice[];
  customers: CustomerInfo[];
  customerTypes: CustomerType[];
  saleReps: SaleRep[];
}

export default function SalesReport({
  invoices,
  customers,
  customerTypes,
  saleReps
}: SalesReportProps) {

  // --- COMPUTE REALTIME ANALYTICS VARIABLES ---
  const stats = useMemo(() => {
    let salesTotal = 0;
    let productsListCount = 0;
    let activeCustomerIds = new Set<string>();

    invoices.forEach(inv => {
      salesTotal += inv.grandTotal;
      activeCustomerIds.add(inv.customerId);
      inv.items.forEach(item => {
        productsListCount += item.qty;
      });
    });

    const averageInvoiceSize = invoices.length > 0 ? salesTotal / invoices.length : 0;

    return {
      salesTotal,
      productsListCount,
      activeCustomers: activeCustomerIds.size,
      averageInvoiceSize
    };
  }, [invoices]);

  // --- CHART 1: REPS PERFORMANCE ANALYSIS ---
  const repPerformanceData = useMemo(() => {
    const dataMap: { [key: string]: number } = {};
    
    // Seed and loop
    saleReps.forEach(r => { dataMap[r.name] = 0; });

    invoices.forEach(inv => {
      const matchedRep = saleReps.find(r => r.id === inv.saleRepId);
      if (matchedRep) {
        dataMap[matchedRep.name] = (dataMap[matchedRep.name] || 0) + inv.grandTotal;
      } else if (inv.saleRepId) {
        dataMap[inv.saleRepId] = (dataMap[inv.saleRepId] || 0) + inv.grandTotal;
      }
    });

    return Object.keys(dataMap).map(repName => ({
      name: repName.split(' (')[0], // trim Khmer labels for graphs
      Sales: parseFloat(dataMap[repName].toFixed(2))
    }));
  }, [invoices, saleReps]);

  // --- CHART 2: CUSTOMER GROUP SPLIT PIE CHART ---
  const customerTypePieData = useMemo(() => {
    const dataMap: { [key: string]: number } = {};
    customerTypes.forEach(t => { dataMap[t.name] = 0; });

    invoices.forEach(inv => {
      const cust = customers.find(c => c.id === inv.customerId);
      if (cust) {
        const type = customerTypes.find(t => t.id === cust.typeId);
        if (type) {
          dataMap[type.name] = (dataMap[type.name] || 0) + inv.grandTotal;
        }
      }
    });

    const colors = ['#0f766e', '#6d28d9', '#4f46e5', '#db2777', '#f59e0b'];

    return Object.keys(dataMap)
      .filter(key => dataMap[key] > 0)
      .map((typeName, index) => ({
        name: typeName.split(' / ')[0], // clean label
        value: parseFloat(dataMap[typeName].toFixed(2)),
        color: colors[index % colors.length]
      }));
  }, [invoices, customers, customerTypes]);

  // --- CHART 3: RECENT INVOICING TIMELINE TREND ---
  const invoicingTimelineData = useMemo(() => {
    // Sort invoices by date
    const sorted = [...invoices].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sorted.map(inv => ({
      date: inv.date.substring(5), // MM-DD format
      Amount: parseFloat(inv.grandTotal.toFixed(2)),
      Invoice: inv.invoiceNo
    }));
  }, [invoices]);

  return (
    <div id="sales-dashboard-panel" className="p-6 max-w-7xl mx-auto space-y-6 font-sans select-none text-white">
      
      {/* Title */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400 font-bold" />
          <span>Sales Intelligence Dashboard</span>
        </h1>
        <p className="text-xs text-slate-350 mt-1">
          Monitor your real-time distribution performance, team billing tallies, and shop classifications.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md flex items-center justify-between hover:bg-white/10 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Sales Invoiced</span>
            <div className="text-xl font-extrabold text-cyan-300">
              ${stats.salesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Fully Persistent
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-cyan-300 border border-white/10">
            <DollarSign className="w-5 h-5 font-bold" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md flex items-center justify-between hover:bg-white/10 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Quantity Dispatched</span>
            <div className="text-xl font-extrabold text-white">{stats.productsListCount} cases</div>
            <span className="text-[10px] text-slate-400 font-medium">FMCG beverages & water</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-purple-300 border border-white/10">
            <ShoppingBag className="w-5 h-5 font-bold" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md flex items-center justify-between hover:bg-white/10 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Client Reach</span>
            <div className="text-xl font-extrabold text-white">{stats.activeCustomers} outlets</div>
            <span className="text-[10px] text-cyan-400 font-semibold">Tied to distribution maps</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-cyan-400 border border-white/10">
            <Users className="w-5 h-5 font-bold" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md flex items-center justify-between hover:bg-white/10 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Invoice Slip</span>
            <div className="text-xl font-extrabold text-emerald-300">${stats.averageInvoiceSize.toFixed(2)}</div>
            <span className="text-[10px] text-slate-400 font-medium">Invoice order target value</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-emerald-350 border border-white/10">
            <Award className="w-5 h-5 font-bold" />
          </div>
        </div>
      </div>

      {/* Graphs panel row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graph 1: Sale trends (Left, 7 cols) */}
        <div className="lg:col-span-7 bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
              Individual Invoice Despatches timeline
            </h3>
            <span className="text-[11px] text-cyan-300 font-semibold font-mono">Invoice Amounts ($)</span>
          </div>

          <div className="h-68">
            {invoicingTimelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                No invoices found to plot a trend. Add non-tax or tax invoices first.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={invoicingTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    formatter={(value, name, props) => [`$${value}`, `No: ${props.payload.Invoice}`]} 
                  />
                  <Line type="monotone" dataKey="Amount" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5, fill: '#06b6d4', strokeWidth: 1, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Graph 2: Customer type share (Right, 5 cols) */}
        <div className="lg:col-span-5 bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
              Earnings share by Customer Class Type
            </h3>
            <span className="text-[11px] text-purple-300 font-semibold font-mono">Outlets %</span>
          </div>

          <div className="h-68 flex items-center justify-center">
            {customerTypePieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                No data available. Register dynamic customer categories first.
              </div>
            ) : (
              <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerTypePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {customerTypePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                        formatter={(val) => `$${val}`} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom list layout */}
                <div className="w-1/2 space-y-2">
                  {customerTypePieData.map((item, idx) => (
                    <div key={idx} className="flex flex-col text-[11px]">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="pl-4 font-bold text-white font-mono">${item.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom graph row: Sale Rep billing charts */}
      <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
            Sales agent Performance Leaderboard
          </h3>
          <span className="text-[11px] text-cyan-300 font-bold font-mono">Invoice Sales ($)</span>
        </div>

        <div className="h-64">
          {repPerformanceData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
              No sales rep transactions accounted yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  formatter={(val) => [`$${val}`, 'Sales Total']} 
                />
                <Bar dataKey="Sales" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {repPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#06b6d4" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
