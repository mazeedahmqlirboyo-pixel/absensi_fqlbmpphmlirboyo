import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export default function CustomSelect({ value, onChange, options, placeholder = "Pilih..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-navy focus:border-transparent transition-all outline-none flex items-center justify-between text-slate-800 text-sm font-semibold shadow-sm"
      >
        <span className={clsx("truncate", !value && "text-slate-400 font-normal")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={clsx("w-5 h-5 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1.5">
            {options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                disabled={opt.disabled}
                className={clsx(
                  "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between",
                  value === opt.value ? "bg-navy text-white font-bold" : "text-slate-700 hover:bg-slate-100 font-medium",
                  opt.disabled && "opacity-50 cursor-not-allowed",
                  idx !== options.length - 1 && "mb-0.5"
                )}
              >
                <span>{opt.label}</span>
                {opt.helperText && (
                  <span className={clsx("text-[10px]", value === opt.value ? "text-blue-200" : "text-slate-400")}>
                    {opt.helperText}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
