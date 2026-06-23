import { useState } from 'react';
import { Menu, Globe, LogOut, Bell, Shield } from 'lucide-react';

interface HeaderProps {
  currentView: string;
}

export default function Header({ currentView }: HeaderProps) {
  const [lang, setLang] = useState<'EN' | 'KH'>('KH');

  const getFriendlyTitle = () => {
    switch (currentView) {
      case 'setup-customer-type':
        return 'SETUP CUSTOMER TYPE';
      case 'setup-customer-info':
        return 'SETUP CUSTOMER INFO';
      case 'sale-order':
        return 'SALE ORDERS (ការបញ្ជាទិញ)';
      case 'invoice-non-tax':
        return 'INVOICE NON TAX (វិក្កយបត្រគ្មានពន្ធ)';
      case 'invoice-tax':
        return 'INVOICE TAX (វិក្កយបត្រពន្ធ)';
      case 'sales-dashboard':
        return 'SALES PERFORMANCE REPORT (របាយការណ៍លក់)';
      case 'general-setup':
        return 'GENERAL SYSTEM SETUP';
      default:
        return 'SYSTEM INFO!';
    }
  };

  return (
    <header className="bg-white/5 backdrop-blur-md border-b border-white/10 h-14 text-white flex items-center justify-between px-4 shrink-0 select-none z-10">
      {/* Left section: Hamburger / Navigation info */}
      <div className="flex items-center gap-3">
        <button className="text-white hover:bg-white/10 p-1.5 rounded transition-colors focus:outline-none">
          <Menu className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-semibold text-base tracking-wider text-white/90 hidden md:inline-block">
          System Info!
        </span>
      </div>

      {/* Middle section: Current View Status */}
      <div className="text-center">
        <span className="bg-white/10 text-cyan-300 border border-white/10 px-3 py-1 rounded text-xs tracking-wider uppercase font-semibold hidden sm:inline-block shadow-sm">
          {getFriendlyTitle()}
        </span>
      </div>

      {/* Right section: Profile, Language, Screen states */}
      <div className="flex items-center gap-4">
        {/* Language selector */}
        <button 
          onClick={() => setLang(lang === 'EN' ? 'KH' : 'EN')}
          className="flex items-center gap-1.5 hover:bg-white/10 px-2.5 py-1 rounded transition-colors text-xs font-semibold uppercase border border-white/10 cursor-pointer text-slate-200"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'EN' ? 'English (EN)' : 'ខ្មែរ (KH)'}</span>
        </button>

        {/* User Account Info */}
        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <div className="flex flex-col text-right hidden lg:block">
            <span className="text-xs font-bold text-slate-200 leading-tight">YII</span>
            <span className="text-[10px] text-slate-400">Administrator</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm shadow-md text-white border border-white/20">
            YI
          </div>
        </div>

        {/* Windows-like controls in image */}
        <div className="flex items-center gap-1.5 pl-2">
          {/* Orange-styled minimize/close buttons */}
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer" title="Minimize" />
          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors cursor-pointer" title="Close" />
        </div>
      </div>
    </header>
  );
}
