import React, { useState, useEffect, useRef } from 'react';
import { CustomerInfo } from '../types';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface SearchableCustomerSelectProps {
  customers: CustomerInfo[];
  selectedId: string;
  onChange: (id: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function SearchableCustomerSelect({
  customers,
  selectedId,
  onChange,
  placeholder = '-- Select Customer --',
  required = false,
}: SearchableCustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = customers.find((c) => c.id === selectedId);

  // Sync display term when active customer selection changes
  useEffect(() => {
    if (selectedCustomer) {
      setSearchTerm(`${selectedCustomer.name} (${selectedCustomer.code})`);
    } else {
      setSearchTerm('');
    }
  }, [selectedId, customers, selectedCustomer]);

  // Click outside handling
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Revert displayed text to selected customer
        if (selectedCustomer) {
          setSearchTerm(`${selectedCustomer.name} (${selectedCustomer.code})`);
        } else {
          setSearchTerm('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCustomer]);

  const handleFocus = () => {
    setIsOpen(true);
    setSearchTerm(''); // Clear text when focusing to let user start searching immediately
  };

  const handleItemSelect = (customer: CustomerInfo) => {
    onChange(customer.id);
    setSearchTerm(`${customer.name} (${customer.code})`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
  };

  // Multiple levels of matching: Name, Code, Phone, District
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true; // Show all if typing is empty

    return (
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.tel.toLowerCase().includes(term) ||
      c.district.toLowerCase().includes(term)
    );
  });

  return (
    <div ref={containerRef} className="relative w-full text-xs font-sans">
      <div className="relative">
        <input
          type="text"
          required={required && !selectedId}
          placeholder={placeholder}
          value={searchTerm}
          onFocus={handleFocus}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs pl-8 pr-16 py-2 bg-white/10 border border-white/10 text-white rounded-lg outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium placeholder-slate-400"
        />

        {/* Input Icons */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search className="w-3.5 h-3.5" />
        </div>

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedId && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown popup */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-slate-900 border border-white/15 rounded-xl shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
          {filteredCustomers.length === 0 ? (
            <div className="px-4 py-3 text-slate-400 text-center italic text-[11px]">
              No matching customers found
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const isSelected = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleItemSelect(c)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-cyan-500/10 flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-slate-400 font-mono">
                        {c.code}
                      </span>
                    </div>
                    {(c.district || c.tel) && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-3">
                        {c.district && <span>📍 {c.district}</span>}
                        {c.tel && <span>📞 {c.tel}</span>}
                      </div>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0ml-2" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
