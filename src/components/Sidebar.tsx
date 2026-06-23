import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  FileSpreadsheet, 
  Settings, 
  TrendingUp, 
  Menu, 
  Activity,
  Layers,
  ShoppingBag,
  LogOut
} from 'lucide-react';
import { User } from 'firebase/auth';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  user: User | any;
  onLogout: () => void;
}

export default function Sidebar({ currentView, onViewChange, user, onLogout }: SidebarProps) {
  const [customerOpen, setCustomerOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);
  const [setupOpen, setSetupOpen] = useState(true);

  return (
    <aside id="dms-sidebar" className="w-68 bg-white/5 border-r border-white/10 backdrop-blur-xl flex flex-col h-screen select-none shrink-0 font-sans text-white z-20">
      {/* Top Left Branding block - matching RAKOT TCS logo background with Frosted Glass look */}
      <div className="bg-white/10 px-4 py-3 flex items-center gap-2 text-white h-14 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center border border-white/20 shadow-lg shrink-0">
          <Activity className="w-4 h-4 text-white animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-wider leading-none text-base">RAKOT TCS</span>
          <span className="text-[10px] text-cyan-200 uppercase tracking-widest mt-0.5">Distribution System</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        {/* Category: ADMINISTRATION */}
        <div>
          <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Administration
          </span>
          
          {/* Group: CUSTOMER */}
          <div className="space-y-1">
            <button
              onClick={() => setCustomerOpen(!customerOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-white/10 rounded-md transition-colors font-medium text-left"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>CUSTOMER</span>
              </div>
              {customerOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {customerOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden pl-7 pr-1 space-y-0.5"
                >
                  <button
                    onClick={() => onViewChange('setup-customer-type')}
                    className={`w-full text-left px-3 py-2 text-xs rounded transition-all font-medium flex items-center gap-1.5 ${
                      currentView === 'setup-customer-type'
                        ? 'bg-white/15 text-cyan-300 font-bold border-l-4 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 opacity-70" />
                    <span>Setup customer type</span>
                  </button>
                  
                  <button
                    onClick={() => onViewChange('setup-customer-info')}
                    className={`w-full text-left px-3 py-2 text-xs rounded transition-all font-medium flex items-center gap-1.5 ${
                      currentView === 'setup-customer-info'
                        ? 'bg-white/15 text-cyan-300 font-bold border-l-4 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 opacity-70" />
                    <span>Setup customer info</span>
                  </button>

                  <button
                    onClick={() => onViewChange('sale-order')}
                    className={`w-full text-left px-3 py-2 text-xs rounded transition-all font-medium flex items-center gap-1.5 ${
                      currentView === 'sale-order'
                        ? 'bg-white/15 text-cyan-300 font-bold border-l-4 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 opacity-70" />
                    <span>Sale order</span>
                  </button>

                  <button
                    onClick={() => onViewChange('invoice-non-tax')}
                    className={`w-full text-left px-3 py-2 text-xs rounded transition-all font-medium flex items-center gap-1.5 ${
                      currentView === 'invoice-non-tax'
                        ? 'bg-white/15 text-cyan-300 font-bold border-l-4 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 opacity-70" />
                    <span>Invoice-non-tax</span>
                  </button>

                  <button
                    onClick={() => onViewChange('invoice-tax')}
                    className={`w-full text-left px-3 py-2 text-xs rounded transition-all font-medium flex items-center gap-1.5 ${
                      currentView === 'invoice-tax'
                        ? 'bg-white/15 text-cyan-300 font-bold border-l-4 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 opacity-70" />
                    <span>Invoice-tax</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Group: REPORT SALES */}
          <div className="space-y-1 mt-2">
            <button
              onClick={() => setReportsOpen(!reportsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-white/10 rounded-md transition-colors font-medium text-left"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>Report sales</span>
              </div>
              {reportsOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {reportsOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden pl-7 pr-1 space-y-0.5"
                >
                  <button
                    onClick={() => onViewChange('sales-dashboard')}
                    className={`w-full text-left px-3 py-2 text-xs rounded transition-all font-medium flex items-center gap-1.5 ${
                      currentView === 'sales-dashboard'
                        ? 'bg-white/15 text-cyan-300 font-bold border-l-4 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 opacity-70" />
                    <span>Sales Performance</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Category: SYSTEM & SECURITY */}
        <div className="pt-2 border-t border-white/10">
          <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            System & Security
          </span>

          <div className="space-y-1">
            <button
              onClick={() => setSetupOpen(!setupOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-white/10 rounded-md transition-colors font-medium text-left"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>GENERAL SETUP</span>
              </div>
              {setupOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {setupOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden pl-7 pr-1 space-y-0.5"
                >
                  <button
                    onClick={() => onViewChange('general-setup')}
                    className={`w-full text-left px-3 py-2 text-xs rounded transition-all font-medium flex items-center gap-1.5 ${
                      currentView === 'general-setup'
                        ? 'bg-white/15 text-cyan-300 font-bold border-l-4 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 opacity-70" />
                    <span>System Settings & Masters</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

       {/* User Profile & Sign Out Block */}
      {user && (
        <div className="bg-[#0f1422]/60 px-4 py-3 flex items-center justify-between border-t border-white/10 select-none">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="User Avatar" 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-slate-950 shadow-md text-xs tracking-wider uppercase">
                {(user.displayName || user.email || 'U').substring(0, 2)}
              </div>
            )}
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-bold text-white truncate max-w-[120px]">
                {user.displayName || 'Demo User'}
              </span>
              <span className="text-[10px] text-cyan-300 truncate max-w-[120px]">
                {user.email || 'offline'}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out / ចាកចេញ"
            className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer Details */}
      <div className="bg-[#0d101d] border-t border-white/10 p-3 text-[10px] text-slate-400 font-mono flex flex-col gap-0.5">
        <div className="flex justify-between items-center">
          <span>App Mode:</span>
          {user && user.uid !== 'demo_offline_user' ? (
            <span className="text-emerald-400 font-bold">Google Cloud Sync</span>
          ) : (
            <span className="text-cyan-400 font-bold">Offline Persistent</span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span>Engine v2.4.0:</span>
          <span className="text-slate-400">Active</span>
        </div>
      </div>
    </aside>
  );
}
