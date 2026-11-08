import React, { useState } from 'react';
import {
  Wallet,
  Send,
  Copy,
  Check,
  Store,
  RotateCcw,
  TrendingDown,
} from 'lucide-react';
import type { SupportedLang } from '../../types/api';
import { formatUzs, type TranslationDict } from '../../i18n/translations';

interface SavingsCalculatorCardProps {
  t: TranslationDict;
  lang: SupportedLang;
  summaryText: string;
  totalPrescribedUzs: number;
  totalSelectedUzs: number;
  onShowPharmacist: () => void;
  onShareTelegram: () => void;
  onCopyChecklist: () => void;
  onReset: () => void;
}

export const SavingsCalculatorCard: React.FC<SavingsCalculatorCardProps> = ({
  t,
  lang,
  summaryText,
  totalPrescribedUzs,
  totalSelectedUzs,
  onShowPharmacist,
  onShareTelegram,
  onCopyChecklist,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const savedUzs = Math.max(0, totalPrescribedUzs - totalSelectedUzs);
  const savedPct =
    totalPrescribedUzs > 0 ? Math.round((savedUzs / totalPrescribedUzs) * 100) : 0;

  const handleCopy = () => {
    onCopyChecklist();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 p-5 sm:p-7 text-white shadow-xl shadow-emerald-600/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold backdrop-blur-sm">
          <Wallet className="h-4 w-4 text-emerald-200" />
          <span>{t.savingsCardTitle}</span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/25 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t.newScanBtn}
        </button>
      </div>

      {summaryText && (
        <p className="mt-3.5 rounded-2xl bg-black/15 p-3.5 text-xs sm:text-sm leading-relaxed text-emerald-50">
          {summaryText}
        </p>
      )}

      {/* Price Comparison Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white/12 p-3.5 backdrop-blur-sm">
          <p className="text-xs font-medium text-emerald-100">{t.prescribedTotalLabel}</p>
          <p className="mt-1 text-lg sm:text-xl font-extrabold text-rose-200 line-through decoration-rose-300/80">
            ~{formatUzs(totalPrescribedUzs, lang)}
          </p>
        </div>

        <div className="rounded-2xl bg-white/18 p-3.5 backdrop-blur-sm ring-1 ring-white/25">
          <p className="text-xs font-medium text-emerald-50">{t.analogsTotalLabel}</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold text-white">
            ~{formatUzs(totalSelectedUzs, lang)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-3.5 text-slate-900 shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-700">{t.yourSavingsLabel}</p>
            {savedPct > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                <TrendingDown className="h-3.5 w-3.5" />
                {savedPct}%
              </span>
            )}
          </div>
          <p className="mt-1 text-xl sm:text-2xl font-black text-emerald-600">
            {formatUzs(savedUzs, lang)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onShowPharmacist}
          className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs sm:text-sm font-extrabold text-emerald-800 shadow-md transition hover:bg-emerald-50 cursor-pointer"
        >
          <Store className="h-4 w-4 text-emerald-600" />
          {t.pharmacistBtn}
        </button>

        <button
          type="button"
          onClick={onShareTelegram}
          className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-blue-600 cursor-pointer"
        >
          <Send className="h-4 w-4" />
          {t.telegramShareBtn}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-white/25 cursor-pointer"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-200" /> : <Copy className="h-4 w-4" />}
          {copied ? t.copiedToast : t.copyListBtn}
        </button>
      </div>
    </div>
  );
};
