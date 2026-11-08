import React from 'react';
import { Clock, Trash2, ArrowRight, FileText } from 'lucide-react';
import type { PrescriptionAnalysisResponse, SavedHistoryEntry, SupportedLang } from '../../types/api';
import { formatUzs, type TranslationDict } from '../../i18n/translations';

interface ScanHistoryViewProps {
  entries: SavedHistoryEntry[];
  t: TranslationDict;
  lang: SupportedLang;
  onOpenEntry: (res: PrescriptionAnalysisResponse) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
}

export const ScanHistoryView: React.FC<ScanHistoryViewProps> = ({
  entries,
  t,
  lang,
  onOpenEntry,
  onDeleteEntry,
  onClearAll,
}) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">{t.historyTitle}</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">{t.historySubtitle}</p>
        </div>

        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t.historyClearBtn}
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Clock className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium text-slate-500">{t.historyEmpty}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map((entry) => {
            const dateStr = new Date(entry.createdAt).toLocaleString(
              lang === 'ru' ? 'ru-RU' : 'uz-UZ',
              { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
            );

            return (
              <div
                key={entry.id}
                className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-400 hover:bg-emerald-50/25"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm sm:text-base font-bold text-slate-900">
                      {entry.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {dateStr} • {entry.drugsCount} {t.drugsCountUnit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {entry.totalSavingsUzs > 0 && (
                    <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800">
                      -{formatUzs(entry.totalSavingsUzs, lang)} ({entry.savingsPercent}%)
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenEntry(entry.response)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      {t.historyOpenBtn}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
