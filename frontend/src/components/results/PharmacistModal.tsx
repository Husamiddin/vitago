import React from 'react';
import { X, Send, Copy, Store } from 'lucide-react';
import type { AnalyzedDrugResult, DrugAnalogOption, SupportedLang } from '../../types/api';
import { formatUzs, type TranslationDict } from '../../i18n/translations';

interface PharmacistModalProps {
  open: boolean;
  onClose: () => void;
  items: AnalyzedDrugResult[];
  selectedMap: Record<string, { key: string; analog: DrugAnalogOption | null }>;
  totalSelectedUzs: number;
  totalSavingsUzs: number;
  disclaimer: string;
  t: TranslationDict;
  lang: SupportedLang;
  onShareTelegram: () => void;
  onCopyChecklist: () => void;
}

export const PharmacistModal: React.FC<PharmacistModalProps> = ({
  open,
  onClose,
  items,
  selectedMap,
  totalSelectedUzs,
  totalSavingsUzs,
  disclaimer,
  t,
  lang,
  onShareTelegram,
  onCopyChecklist,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/65 p-0 sm:p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full sm:max-w-xl overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">{t.pharmacistModalTitle}</h3>
              <p className="text-xs text-slate-500">{t.pharmacistModalSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((item, idx) => {
            const chosen = selectedMap[item.item_id]?.analog;
            const displayName = chosen ? chosen.trade_name : item.prescribed_name;
            const displayDosage = chosen ? chosen.dosage : item.dosage;
            const displayMaker = chosen ? chosen.manufacturer : item.manufacturer;
            const displayPrice = chosen ? chosen.price_uzs : item.prescribed_price_uzs;

            return (
              <div
                key={item.item_id}
                className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      #{idx + 1} • XPN: {item.inn}
                    </span>
                    <p className="mt-0.5 text-lg font-black text-slate-900">
                      {displayName}{' '}
                      <span className="text-sm font-bold text-slate-600">({displayDosage})</span>
                    </p>
                    <p className="text-xs text-slate-500">{displayMaker}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-700">
                      ~{formatUzs(displayPrice, lang)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800">{t.analogsTotalLabel}</p>
            <p className="text-xl font-black text-emerald-950">
              ~{formatUzs(totalSelectedUzs, lang)}
            </p>
          </div>
          {totalSavingsUzs > 0 && (
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-700">{t.yourSavingsLabel}</p>
              <p className="text-lg font-extrabold text-emerald-600">
                -{formatUzs(totalSavingsUzs, lang)}
              </p>
            </div>
          )}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{disclaimer}</p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onShareTelegram}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            {t.telegramShareBtn}
          </button>
          <button
            type="button"
            onClick={onCopyChecklist}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <Copy className="h-4 w-4" />
            {t.copyListBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
