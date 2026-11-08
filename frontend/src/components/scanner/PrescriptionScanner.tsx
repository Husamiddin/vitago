import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, FileUp, Sparkles, RefreshCw, Wand2, ArrowRight } from 'lucide-react';
import type { SamplePrescriptionMeta, SupportedLang } from '../../types/api';
import { formatUzs, type TranslationDict } from '../../i18n/translations';

interface PrescriptionScannerProps {
  t: TranslationDict;
  lang: SupportedLang;
  samples: SamplePrescriptionMeta[];
  isLoading: boolean;
  onScanFile: (file: File) => void;
  onRunSample: (sampleId: string) => void;
}

export const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({
  t,
  lang,
  samples,
  isLoading,
  onScanFile,
  onRunSample,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setLoadingSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleFilePicked = useCallback(
    (file: File | null | undefined, autoStart = true) => {
      if (!file || !file.type.startsWith('image/')) return;
      setSelectedFile(file);
      const nextUrl = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
      if (autoStart) {
        onScanFile(file);
      }
    },
    [onScanFile]
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isLoading) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFilePicked(file, true);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFilePicked, isLoading]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="space-y-5">
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFilePicked(e.target.files?.[0], true)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFilePicked(e.target.files?.[0], true)}
      />

      {/* Upload / Preview Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          handleFilePicked(dropped, true);
        }}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
            : 'border-emerald-300/80 bg-gradient-to-b from-white to-emerald-50/40 hover:border-emerald-400'
        } p-4 sm:p-7 shadow-xs`}
      >
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative mx-auto max-h-72 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
              <img
                src={previewUrl}
                alt="Prescription preview"
                className={`mx-auto max-h-72 w-auto object-contain transition-opacity ${
                  isLoading ? 'opacity-65' : 'opacity-100'
                }`}
              />
              {isLoading && (
                <>
                  <div className="animate-scan-laser pointer-events-none absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_4px_rgba(16,185,129,0.85)]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/45 px-4 text-center text-white backdrop-blur-[2px]">
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/90 shadow-lg">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    </div>
                    <p className="text-base font-bold">{t.scanningTitle}</p>
                    <p className="mt-1 text-xs text-emerald-100">{t.scanningSubtitle}</p>
                    {loadingSeconds > 2 && (
                      <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-xs">
                        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-300" />
                        <span>{loadingSeconds}s</span>
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {!isLoading && (
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => onScanFile(selectedFile)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 cursor-pointer"
                  >
                    <Wand2 className="h-4 w-4" />
                    {t.analyzeNowBtn}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t.changePhotoBtn}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-2 sm:py-3">
            <div className="mb-3.5 flex h-13 w-13 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-lg shadow-emerald-500/25">
              <Camera className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>

            <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
              {t.dropzoneTitle}
            </h3>
            <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-500 leading-snug">
              {t.dropzoneSubtitle}
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Camera className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.cameraBtn}</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50/40 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <FileUp className="h-4 w-4 shrink-0 text-blue-600" />
                <span className="truncate">{t.galleryBtn}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1-Click Sample Prescriptions */}
      {samples.length > 0 && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 mb-3">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{t.demoSectionTitle}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {samples.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={isLoading}
                onClick={() => onRunSample(sample.id)}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40 hover:shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded-lg bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                      {sample.badge}
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-700">
                      -{formatUzs(sample.estimated_savings_uzs, lang)}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    {sample.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{sample.subtitle}</p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-2.5 text-xs font-bold text-emerald-700">
                  <span>{t.demoTryBtn}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
