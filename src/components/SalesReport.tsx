import { useMemo, useState } from 'react';
import { Invoice, CustomerInfo, CustomerType, SaleRep, Item } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Award,
  ArrowUpRight,
  TrendingDown,
  BarChart4,
  ChevronDown,
  Check,
  Filter
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
  items?: Item[];
}

export default function SalesReport({
  invoices,
  customers,
  customerTypes,
  saleReps,
  items = []
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

  // --- CHART 1: DAILY SALES TREND BY AGENT (LINE CHART SERIES) ---
  const repLineChartData = useMemo(() => {
    // 1. Gather all unique rep names
    const repNamesSet = new Set<string>();
    saleReps.forEach(r => {
      repNamesSet.add(r.name);
    });
    invoices.forEach(inv => {
      const matchedRep = saleReps.find(r => r.id === inv.saleRepId);
      if (matchedRep) {
        repNamesSet.add(matchedRep.name);
      } else if (inv.saleRepId) {
        repNamesSet.add(inv.saleRepId);
      }
    });
    const uniqueReps = Array.from(repNamesSet);

    // 2. Map date to rep sales values
    const dateMap: { [date: string]: { [repName: string]: number } } = {};

    invoices.forEach(inv => {
      const dateStr = inv.date;
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {};
        // Initialize with 0 for all reps on this date
        uniqueReps.forEach(name => {
          dateMap[dateStr][name] = 0;
        });
      }

      const matchedRep = saleReps.find(r => r.id === inv.saleRepId);
      const repName = matchedRep ? matchedRep.name : (inv.saleRepId || 'No Agent');
      
      dateMap[dateStr][repName] = (dateMap[dateStr][repName] || 0) + inv.grandTotal;
    });

    // 3. Format into a sorted list of data objects
    const chartData = Object.keys(dateMap).map(date => {
      const repValues = dateMap[date];
      const formattedValues: { [key: string]: number } = {};
      uniqueReps.forEach(name => {
        formattedValues[name] = parseFloat((repValues[name] || 0).toFixed(2));
      });

      return {
        date,
        ...formattedValues
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      chartData,
      uniqueReps
    };
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

  // --- METRIC STATE FOR SOLD PRODUCTS ---
  const [productMetric, setProductMetric] = useState<'qty' | 'revenue'>('qty');
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- REPS FILTER STATE ---
  const [selectedReps, setSelectedReps] = useState<Record<string, boolean>>({});
  const [isRepDropdownOpen, setIsRepDropdownOpen] = useState(false);

  // --- HOVER STATE FOR LINE HIGHLIGHTS ---
  const [hoveredProductLine, setHoveredProductLine] = useState<string | null>(null);
  const [hoveredRepLine, setHoveredRepLine] = useState<string | null>(null);

  const visibleRepsCount = useMemo(() => {
    return repLineChartData.uniqueReps.filter(name => selectedReps[name] !== false).length;
  }, [repLineChartData.uniqueReps, selectedReps]);

  const totalRepsCount = repLineChartData.uniqueReps.length;

  // --- CHART 4: DAILY SALES TREND BY PRODUCT (LINE CHART SERIES) ---
  const productLineChartData = useMemo(() => {
    // 1. Gather all unique product names that have been sold
    const productNamesSet = new Set<string>();
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        let name = item.description || 'Unknown Item';
        const matchedItem = items.find(i => i.id === item.itemId);
        if (matchedItem) {
          name = matchedItem.name;
        }
        productNamesSet.add(name);
      });
    });
    const uniqueProducts = Array.from(productNamesSet);

    // 2. Map date to product sales values
    const dateMap: { [date: string]: { [productName: string]: number } } = {};

    invoices.forEach(inv => {
      const dateStr = inv.date;
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {};
        // Initialize with 0 for all products on this date
        uniqueProducts.forEach(name => {
          dateMap[dateStr][name] = 0;
        });
      }

      inv.items.forEach(item => {
        let name = item.description || 'Unknown Item';
        const matchedItem = items.find(i => i.id === item.itemId);
        if (matchedItem) {
          name = matchedItem.name;
        }

        const value = productMetric === 'qty' ? item.qty : item.subTotal;
        dateMap[dateStr][name] += value;
      });
    });

    // 3. Format into a sorted list of data objects
    const chartData = Object.keys(dateMap).map(date => {
      const itemValues = dateMap[date];
      const formattedValues: { [key: string]: number } = {};
      uniqueProducts.forEach(name => {
        formattedValues[name] = parseFloat((itemValues[name] || 0).toFixed(2));
      });

      return {
        date,
        ...formattedValues
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      chartData,
      uniqueProducts
    };
  }, [invoices, items, productMetric]);

  const lineColors = [
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#f43f5e', // Rose
    '#14b8a6', // Teal
    '#ef4444', // Red
    '#a855f7'  // Purple
  ];

  const visibleCount = useMemo(() => {
    return productLineChartData.uniqueProducts.filter(name => selectedProducts[name] !== false).length;
  }, [productLineChartData.uniqueProducts, selectedProducts]);

  const totalCount = productLineChartData.uniqueProducts.length;

  return (
    <div id="sales-dashboard-panel" className="p-6 w-full space-y-6 font-sans select-none text-white">
      
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <BarChart4 className="w-4 h-4 text-cyan-450" />
              <span>របាយការណ៍លក់តាមកាលបរិច្ឆេទភ្នាក់ងារ / Agent Sales Trend by Date</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daily breakdown of total revenue generated by each sales representative over time.
            </p>
          </div>
          <span className="text-[11px] text-cyan-300 font-bold font-mono self-start sm:self-auto">Invoice Sales ($)</span>
        </div>

        {/* Interactive filter dropdown for Reps */}
        {repLineChartData.uniqueReps.length > 0 && (
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[11px] uppercase font-bold text-slate-400">បង្ហាញភ្នាក់ងារ / Sales Agents:</span>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRepDropdownOpen(!isRepDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold rounded-lg border border-white/10 text-slate-200 transition-all cursor-pointer shadow-md min-w-[220px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {visibleRepsCount === totalRepsCount 
                        ? 'បង្ហាញទាំងអស់ (Show All)' 
                        : visibleRepsCount === 0 
                          ? 'លាក់ទាំងអស់ (Hidden All)' 
                          : `បានជ្រើសរើស (${visibleRepsCount}/${totalRepsCount})`
                      }
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isRepDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isRepDropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsRepDropdownOpen(false)} 
                    />
                    
                    <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-white/15 rounded-xl shadow-2xl p-3 space-y-2.5 z-20 backdrop-blur-lg">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ជម្រើសភ្នាក់ងារ / Options</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setSelectedReps({})}
                            className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-all"
                          >
                            បង្ហាញទាំងអស់
                          </button>
                          <button
                            onClick={() => {
                              const allHidden: Record<string, boolean> = {};
                              repLineChartData.uniqueReps.forEach(repName => {
                                allHidden[repName] = false;
                              });
                              setSelectedReps(allHidden);
                            }}
                            className="px-2 py-0.5 text-[9px] font-bold rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-all"
                          >
                            លាក់ទាំងអស់
                          </button>
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {repLineChartData.uniqueReps.map((repName, index) => {
                          const isVisible = selectedReps[repName] !== false;
                          const color = lineColors[index % lineColors.length];
                          return (
                            <button
                              key={repName}
                              onClick={() => {
                                setSelectedReps(prev => ({
                                  ...prev,
                                  [repName]: !isVisible
                                }));
                              }}
                              className={`flex items-center justify-between w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isVisible 
                                  ? 'bg-white/5 text-white hover:bg-white/10' 
                                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: isVisible ? color : '#475569' }}
                                />
                                <span className={`truncate ${isVisible ? '' : 'line-through'}`}>{repName}</span>
                              </div>
                              {isVisible ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <span className="w-3.5 h-3.5 border border-slate-700 rounded flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Hovered Rep Name indicator */}
            {hoveredRepLine && (
              <div className="flex items-center gap-2 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-[11px] font-bold text-cyan-300">
                  កំពុងមើលភ្នាក់ងារ៖ {hoveredRepLine}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="h-80">
          {repLineChartData.chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
              No sales rep transactions accounted yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={repLineChartData.chartData}
                margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={true} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  shared={false}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  formatter={(val) => [`$${val}`, 'Revenue']} 
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }}
                />
                {repLineChartData.uniqueReps.map((repName, index) => {
                  const isHovered = hoveredRepLine === repName;
                  const isAnyHovered = hoveredRepLine !== null;
                  return (
                    <Line
                      key={repName}
                      type="monotone"
                      dataKey={repName}
                      stroke={lineColors[index % lineColors.length]}
                      strokeWidth={isHovered ? 4.5 : isAnyHovered ? 1 : 2.5}
                      strokeOpacity={!isAnyHovered || isHovered ? 1 : 0.15}
                      activeDot={{ r: 6 }}
                      dot={isHovered ? { r: 5 } : { r: 2 }}
                      hide={selectedReps[repName] === false}
                      onMouseEnter={() => setHoveredRepLine(repName)}
                      onMouseLeave={() => setHoveredRepLine(null)}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

        {/* Sales Trend by Date Chart */}
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <BarChart4 className="w-4 h-4 text-emerald-450" />
                <span>របាយការណ៍លក់តាមកាលបរិច្ឆេទ / Sales Trend by Date</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Daily breakdown of total quantity sold or revenue generated over time.
              </p>
            </div>
            
            {/* Toggle buttons */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 self-start">
              <button
                onClick={() => setProductMetric('qty')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  productMetric === 'qty'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                តាមចំនួនលក់ (Qty)
              </button>
              <button
                onClick={() => setProductMetric('revenue')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  productMetric === 'revenue'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                តាមចំណូលសរុប (Revenue)
              </button>
            </div>
          </div>

          {/* Interactive filter dropdown */}
          {productLineChartData.uniqueProducts.length > 0 && (
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-[11px] uppercase font-bold text-slate-400">បង្ហាញទំនិញ / Products:</span>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold rounded-lg border border-white/10 text-slate-200 transition-all cursor-pointer shadow-md min-w-[220px] justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {visibleCount === totalCount 
                          ? 'បង្ហាញទាំងអស់ (Show All)' 
                          : visibleCount === 0 
                            ? 'លាក់ទាំងអស់ (Hidden All)' 
                            : `បានជ្រើសរើស (${visibleCount}/${totalCount})`
                        }
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsDropdownOpen(false)} 
                      />
                      
                      <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-white/15 rounded-xl shadow-2xl p-3 space-y-2.5 z-20 backdrop-blur-lg">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ជម្រើសទំនិញ / Options</span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setSelectedProducts({})}
                              className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-all"
                            >
                              បង្ហាញទាំងអស់
                            </button>
                            <button
                              onClick={() => {
                                const allHidden: Record<string, boolean> = {};
                                productLineChartData.uniqueProducts.forEach(name => {
                                  allHidden[name] = false;
                                });
                                setSelectedProducts(allHidden);
                              }}
                              className="px-2 py-0.5 text-[9px] font-bold rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-all"
                            >
                              លាក់ទាំងអស់
                            </button>
                          </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {productLineChartData.uniqueProducts.map((prodName, index) => {
                            const isVisible = selectedProducts[prodName] !== false;
                            const color = lineColors[index % lineColors.length];
                            return (
                              <button
                                key={prodName}
                                onClick={() => {
                                  setSelectedProducts(prev => ({
                                    ...prev,
                                    [prodName]: !isVisible
                                  }));
                                }}
                                className={`flex items-center justify-between w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isVisible 
                                    ? 'bg-white/5 text-white hover:bg-white/10' 
                                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-400'
                                }`}
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: isVisible ? color : '#475569' }}
                                  />
                                  <span className={`truncate ${isVisible ? '' : 'line-through'}`}>{prodName}</span>
                                </div>
                                {isVisible ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                ) : (
                                  <span className="w-3.5 h-3.5 border border-slate-700 rounded flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Hovered Product Name indicator */}
              {hoveredProductLine && (
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[11px] font-bold text-emerald-300">
                    កំពុងមើលទំនិញ៖ {hoveredProductLine}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="h-80">
            {productLineChartData.chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                No sales recorded yet. Add invoices with items first.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={productLineChartData.chartData}
                  margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={true} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => productMetric === 'qty' ? `${val}` : `$${val}`} />
                  <Tooltip
                    shared={false}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    formatter={(value) => {
                      if (productMetric === 'qty') {
                        return [`${value} cases`, 'Quantity Sold'];
                      } else {
                        return [`$${value}`, 'Revenue'];
                      }
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }}
                  />
                  {productLineChartData.uniqueProducts.map((prodName, index) => {
                    const isHovered = hoveredProductLine === prodName;
                    const isAnyHovered = hoveredProductLine !== null;
                    return (
                      <Line
                        key={prodName}
                        type="monotone"
                        dataKey={prodName}
                        stroke={lineColors[index % lineColors.length]}
                        strokeWidth={isHovered ? 4.5 : isAnyHovered ? 1 : 2.5}
                        strokeOpacity={!isAnyHovered || isHovered ? 1 : 0.15}
                        activeDot={{ r: 6 }}
                        dot={isHovered ? { r: 5 } : { r: 2 }}
                        hide={selectedProducts[prodName] === false}
                        onMouseEnter={() => setHoveredProductLine(prodName)}
                        onMouseLeave={() => setHoveredProductLine(null)}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
    </div>
  );
}
