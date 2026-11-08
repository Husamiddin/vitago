import React, { useState } from 'react';
import {
  CheckCircle2,
  Info,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { AnalyzedDrugResult, DrugAnalogOption, SupportedLang } from '../../types/api';
import { formatUzs, type TranslationDict } from '../../i18n/translations';

interface DrugResultCardProps {
  index: number;
  item: AnalyzedDrugResult;
  selectedAnalogKey: string; // 'original' or analog index string
  onSelectOption: (optionKey: string, analog: DrugAnalogOption | null) => void;
  t: TranslationDict;
  lang: SupportedLang;
}

export const DrugResultCard: React.FC<DrugResultCardProps> = ({
  index,
  item,
  selectedAnalogKey,
  onSelectOption,
  t,
  lang,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-xs font-extrabold text-white">
                {index + 1}
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {item.prescribed_name}
              </h3>
              <span className="rounded-lg bg-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {item.dosage}
              </span>
              {item.price_source === 'verified_db' ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t.verifiedDbBadge}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t.aiEstimateBadge}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{t.activeIngredient}</span>{' '}
              <span className="font-bold text-blue-700">
                {item.inn_localized} ({item.inn})
              </span>{' '}
              • {item.category}
            </p>

            {item.raw_written_text && (
              <p className="inline-block rounded-xl bg-amber-50 border border-amber-200/70 px-3 py-1 text-xs font-mono text-amber-900">
                {t.writtenInRx} {item.raw_written_text}
              </p>
            )}
          </div>

          <div className="text-right">
            <div className="text-base sm:text-lg font-extrabold text-slate-900">
              ~{formatUzs(item.prescribed_price_uzs, lang)}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              {item.manufacturer} {item.country !== '—' ? `(${item.country})` : ''}
            </div>
            <div className="mt-1 inline-block rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {t.confidenceLabel}: {Math.round(item.confidence * 100)}%
            </div>
          </div>
        </div>

        {item.regimen && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50/90 px-3.5 py-2 text-xs sm:text-sm font-semibold text-blue-900">
            <Clock className="h-4 w-4 shrink-0 text-blue-600" />
            <span>{item.regimen}</span>
          </div>
        )}
      </div>

      {/* Folk Explanation Collapsible */}
      <div className="border-b border-slate-100 px-4 sm:px-6 py-3.5">
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
        >
          <span className="inline-flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald-600" />
            {t.purposeTitle} / {t.howToTakeTitle}
          </span>
          {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {detailsOpen && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-3.5">
              <p className="font-bold text-emerald-900 mb-1">{t.purposeTitle}</p>
              <p className="text-slate-700 leading-relaxed">{item.simple_purpose}</p>
            </div>

            <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-3.5">
              <p className="font-bold text-blue-900 mb-1">{t.howToTakeTitle}</p>
              <p className="text-slate-700 leading-relaxed">{item.how_to_take}</p>
            </div>

            <div className="rounded-2xl bg-amber-50/70 border border-amber-200/70 p-3.5">
              <p className="inline-flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                {t.warningsTitle}
              </p>
              <p className="text-slate-700 leading-relaxed">{item.warnings}</p>
            </div>
          </div>
        )}
      </div>

      {/* Selectable Analogs Section */}
      <div className="p-4 sm:p-6">
        <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 mb-3">
          {t.selectAnalogTitle}
        </h4>

        {item.analogs.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-3.5 text-xs sm:text-sm text-slate-600">
            {t.noCheaperAnalogs}
          </p>
        ) : (
          <div className="space-y-2.5">
            {item.analogs.map((analog, aIdx) => {
              const key = `analog-${aIdx}`;
              const isSelected = selectedAnalogKey === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectOption(key, analog)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-3.5 text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                      : 'border-slate-200/80 bg-white hover:border-emerald-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900">
                          {analog.trade_name}
                        </span>
                        <span className="text-xs text-slate-500">{analog.dosage}</span>
                        {analog.is_local_uz && (
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            {t.uzLocalBadge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {analog.manufacturer} ({analog.country})
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-sm sm:text-base font-extrabold text-slate-900">
                      ~{formatUzs(analog.price_uzs, lang)}
                    </div>
                    {analog.savings_uzs > 0 && (
                      <div className="mt-0.5 inline-block rounded-lg bg-emerald-600 px-2 py-0.5 text-[11px] font-extrabold text-white">
                        -{formatUzs(analog.savings_uzs, lang)} ({analog.savings_percent}%)
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Option to keep the doctor's original brand */}
            <button
              type="button"
              onClick={() => onSelectOption('original', null)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left text-xs sm:text-sm transition cursor-pointer ${
                selectedAnalogKey === 'original'
                  ? 'border-blue-500 bg-blue-50/60 font-bold text-blue-950'
                  : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/70'
              }`}
            >
              <span>
                {t.keepOriginalOption}: <strong>{item.prescribed_name}</strong>
              </span>
              <span className="font-bold">~{formatUzs(item.prescribed_price_uzs, lang)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
