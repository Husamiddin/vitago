import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { SupportedLang } from '../../types/api';
import logoIcon from '../../assets/logo_icon.png';

interface BrandLogoProps {
  compact?: boolean;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ compact = false, onClick }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none cursor-pointer shrink-0"
    >
      {/* Official VitaGo Logo */}
      <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-sm shadow-emerald-500/20 transition-transform group-hover:scale-105 border border-emerald-200/80 bg-white">
        {!imgError ? (
          <img
            src={logoIcon}
            alt="VitaGo Logo"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-xs">
            VG
          </div>
        )}
      </div>

      <div className="leading-tight shrink-0">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
            Vita<span className="text-emerald-600">Go</span>
          </span>
          <span className="rounded-md bg-emerald-100 px-1 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
            AI
          </span>
        </div>
        {!compact && (
          <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 hidden sm:block">
            Health • Sport • Life
          </p>
        )}
      </div>
    </button>
  );
};

interface LanguageSwitcherProps {
  lang: SupportedLang;
  onChange: (lang: SupportedLang) => void;
}

const LANG_OPTIONS: { code: SupportedLang; label: string; fullLabel: string; flag: string }[] = [
  { code: 'uz', label: "O'zb", fullLabel: "O'zbekcha (Lotin)", flag: '🇺🇿' },
  { code: 'uz_cyrl', label: 'Ўзб', fullLabel: 'Ўзбекча (Кирилл)', flag: '🇺🇿' },
  { code: 'ru', label: 'Рус', fullLabel: 'Русский', flag: '🇷🇺' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ lang, onChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownOpen]);

  const currentOpt = LANG_OPTIONS.find((o) => o.code === lang) || LANG_OPTIONS[0];

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Desktop view: side-by-side tabs */}
      <div className="hidden sm:inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
        {LANG_OPTIONS.map((opt) => {
          const active = lang === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => onChange(opt.code)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                active
                  ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Mobile view: compact dropdown pill with elevated, unclipped menu */}
      <div className="sm:hidden shrink-0">
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold border transition cursor-pointer whitespace-nowrap shrink-0 ${
            dropdownOpen
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-slate-100 text-slate-800 border-slate-200/90 active:bg-slate-200'
          }`}
          aria-label="Tilni almashtirish"
        >
          <span className="text-emerald-700 font-extrabold">{currentOpt.label}</span>
          <ChevronDown
            className={`h-3 w-3 text-slate-600 transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180 text-emerald-700' : ''
            }`}
          />
        </button>

        {dropdownOpen && (
          <>
            {/* Backdrop for easy mobile tap-to-close */}
            <div
              className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-[1px]"
              onClick={() => setDropdownOpen(false)}
            />

            {/* Elevated Dropdown Menu showing ALL available languages */}
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-[100] animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                Tilni tanlang
              </div>
              {LANG_OPTIONS.map((opt) => {
                const active = lang === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      onChange(opt.code);
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                      active
                        ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                        : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{opt.flag}</span>
                      <span>{opt.fullLabel}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
