import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ComboOption {
  value: string;
  label: string;
  subLabel?: string;
  rightLabel?: string;
}

interface SearchableComboProps {
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SearchableCombo({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  disabled = false,
}: SearchableComboProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(search.toLowerCase())) ||
      (opt.value && opt.value.toLowerCase().includes(search.toLowerCase()))
  );

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when dropdown closes or opens
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-xs px-3 py-2 bg-white/5 border ${
          isOpen ? 'border-cyan-500/50 ring-1 ring-cyan-500/30' : 'border-white/10 hover:border-white/20'
        } rounded-xl text-white font-medium outline-none transition-all cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="truncate pr-2">
          {selectedOption ? (
            <div className="flex flex-col">
              <span className="font-semibold text-white truncate">{selectedOption.label}</span>
              {selectedOption.subLabel && (
                <span className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                  {selectedOption.subLabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 w-full mt-1.5 bg-slate-900/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md max-h-60 flex flex-col"
          >
            {/* Search Input Area */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-white/5 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-xs text-white placeholder-slate-400 outline-none p-0 focus:ring-0"
                autoFocus
              />
            </div>

            {/* List Option Entries */}
            <div className="overflow-y-auto max-h-48 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400 italic">
                  No matching results found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer hover:bg-white/10 ${
                        isSelected ? 'bg-cyan-500/10' : ''
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold truncate ${isSelected ? 'text-cyan-400' : 'text-slate-200'}`}>
                            {opt.label}
                          </span>
                        </div>
                        {opt.subLabel && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {opt.subLabel}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {opt.rightLabel && (
                          <span className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-400 border border-white/5">
                            {opt.rightLabel}
                          </span>
                        )}
                        {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
