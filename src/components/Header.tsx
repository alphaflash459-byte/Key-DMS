import { Menu } from 'lucide-react';

interface HeaderProps {
  currentView: string;
}

export default function Header({ currentView }: HeaderProps) {
  const getFriendlyTitle = () => {
    switch (currentView) {
      case 'setup-customer-type':
        return 'SETUP CUSTOMER TYPE';
      case 'setup-customer-info':
        return 'SETUP CUSTOMER INFO';
      case 'sale-order':
        return 'SALE ORDERS';
      case 'invoice-non-tax':
        return 'INVOICE NON TAX';
      case 'invoice-tax':
        return 'INVOICE TAX';
      case 'sales-dashboard':
        return 'SALES PERFORMANCE REPORT';
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
        {/* Removed User Account Info, Windows-like controls and Language Selector as requested */}
      </div>
    </header>
  );
}
