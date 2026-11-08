import React, { useEffect, useState } from 'react';
import { Search, Sparkles, ArrowRight, CheckCircle2, X } from 'lucide-react';
import type { DrugSearchItem, SupportedLang } from '../../types/api';
import { searchDrugs } from '../../services/apiClient';
import { formatUzs, type TranslationDict } from '../../i18n/translations';

interface DrugSearchBarProps {
  t: TranslationDict;
  lang: SupportedLang;
  isLoading: boolean;
  onSelectDrugId: (drugId: number) => void;
  onAiLookupQuery: (query: string) => void;
}

const POPULAR_PILLS_LATN = [
  'Sumamed',
  'Klatsid',
  'Augmentin',
  'Nimesil',
  'Kreon',
  'No-shpa',
  'Konkor',
  'Magne B6',
];

const POPULAR_PILLS_CYRL = [
  'Сумамед',
  'Клацид',
  'Аугментин',
  'Нимесил',
  'Креон',
  'Но-шпа',
  'Конкор',
  'Магне B6',
];

export const DrugSearchBar: React.FC<DrugSearchBarProps> = ({
  t,
  lang,
  isLoading,
  onSelectDrugId,
  onAiLookupQuery,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DrugSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const items = await searchDrugs(query, lang);
        if (active) setResults(items);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, lang]);

  const pills = lang === 'uz' ? POPULAR_PILLS_LATN : POPULAR_PILLS_CYRL;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        {/* Search Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim().length >= 2) {
                if (results.length > 0) {
                  onSelectDrugId(results[0].id);
                } else {
                  onAiLookupQuery(query.trim());
                }
              }
            }}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-11 text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Popular Drugs Pills */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            {t.popularDrugsLabel}
          </span>
          {pills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => setQuery(pill)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="mt-5 space-y-2.5">
          {isSearching && (
            <p className="py-3 text-center text-xs font-semibold text-slate-400">
              {t.searchingLabel}
            </p>
          )}

          {!isSearching &&
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={isLoading}
                onClick={() => onSelectDrugId(item.id)}
                className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 text-left transition hover:border-emerald-400 hover:bg-emerald-50/30 hover:shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800">
                      {item.trade_name}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{item.dosage}</span>
                    {item.is_local_uz && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        🇺🇿 UZ
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    <span className="font-semibold text-blue-700">{item.inn_localized}</span> •{' '}
                    {item.manufacturer} ({item.country})
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-extrabold text-slate-900">
                    ~{formatUzs(item.avg_price_uzs, lang)}
                  </div>
                  {item.cheapest_analog_uzs !== null ? (
                    <div className="mt-0.5 inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      {t.cheapestFrom} {formatUzs(item.cheapest_analog_uzs, lang)}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-[11px] font-semibold text-slate-400">
                      {item.analogs_count} {t.analogsAvailable}
                    </div>
                  )}
                </div>
              </button>
            ))}

          {/* Hybrid AI Fallback Lookup Button */}
          {query.trim().length >= 2 && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onAiLookupQuery(query.trim())}
              className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50 p-4 text-left transition hover:border-blue-400 hover:shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">{t.aiHybridBtn}</p>
                  <p className="text-xs text-slate-600">«{query.trim()}»</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-blue-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
