import React from 'react';
import { Camera, Cpu, PiggyBank, ShieldAlert, HelpCircle, Award } from 'lucide-react';
import type { PlatformStatsResponse } from '../../types/api';
import type { TranslationDict } from '../../i18n/translations';

interface LandingSectionsProps {
  t: TranslationDict;
  stats: PlatformStatsResponse | null;
  disclaimer: string;
}

export const LandingSections: React.FC<LandingSectionsProps> = ({ t, stats, disclaimer }) => {
  return (
    <div className="space-y-10 pt-4">
      {/* Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">
              {stats.total_drugs}+
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{t.statsDrugs}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-blue-600">
              {stats.total_inn_groups}+
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{t.statsGroups}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">
              {stats.local_uz_drugs}+
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{t.statsLocal}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-blue-600">
              ~{stats.avg_savings_percent}%
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{t.statsSavings}</p>
          </div>
        </div>
      )}

      {/* How It Works in 3 Steps */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 text-center">
          {t.howItWorksTitle}
        </h2>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-5">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <Camera className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{t.step1Title}</h3>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">{t.step1Desc}</p>
          </div>

          <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-5">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{t.step2Title}</h3>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">{t.step2Desc}</p>
          </div>

          <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-5">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <PiggyBank className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{t.step3Title}</h3>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">{t.step3Desc}</p>
          </div>
        </div>
      </section>

      {/* Why Prices Differ (Brand vs INN) */}
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
            <Award className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold">{t.whyPriceDiffTitle}</h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-200">
              {t.whyPriceDiffText}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <HelpCircle className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-extrabold text-slate-900">{t.faqTitle}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <h4 className="text-sm font-extrabold text-slate-900">{t.faq1Q}</h4>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">{t.faq1A}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <h4 className="text-sm font-extrabold text-slate-900">{t.faq2Q}</h4>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">{t.faq2A}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <h4 className="text-sm font-extrabold text-slate-900">{t.faq3Q}</h4>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">{t.faq3A}</p>
          </div>
        </div>
      </section>

      {/* Mandatory Medical Disclaimer Banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 sm:p-5 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <p className="text-xs sm:text-sm font-medium leading-relaxed text-amber-950">
          {disclaimer}
        </p>
      </div>
    </div>
  );
};
