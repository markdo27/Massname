import React, { useState } from 'react';
import { Download, Rocket, CheckCircle2, FileVideo, Archive, Play, AlertTriangle, Loader2, Square } from 'lucide-react';
import type { ExportedItem, BatchProgress, ExportFailure } from '../types';
import type { TranslationKey } from '../i18n/translations';
import { useI18n } from '../i18n/useI18n';
import { StepCard } from './StepCard';

interface ExportManagerProps {
  nameCount: number;
  missing: TranslationKey | null; // why export can't start yet
  progress: BatchProgress;
  exportedItems: ExportedItem[];
  failures: ExportFailure[];
  fatalError: string | null;
  localNote: boolean;
  onStartExport: () => void;
  onCancelExport: () => void;
  onDownloadAll: () => Promise<void>;
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  nameCount,
  missing,
  progress,
  exportedItems,
  failures,
  fatalError,
  localNote,
  onStartExport,
  onCancelExport,
  onDownloadAll,
}) => {
  const { t } = useI18n();
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipError, setZipError] = useState(false);

  const isBusy = progress.phase === 'preparing' || progress.phase === 'rendering';
  const isDone = progress.phase === 'finished';

  const handleDownloadAll = async () => {
    setIsZipping(true);
    setZipError(false);
    try {
      await onDownloadAll();
    } catch (err) {
      console.error('ZIP failed:', err);
      setZipError(true);
    } finally {
      setIsZipping(false);
    }
  };

  const doneTitle = progress.stopped
    ? t('stopped', { n: exportedItems.length })
    : exportedItems.length === 1
      ? t('doneOne')
      : t('doneMany', { n: exportedItems.length });

  return (
    <StepCard
      step={4}
      title={t('step4Title')}
      description={t('step4Desc')}
      done={isDone && exportedItems.length > 0 && failures.length === 0 && !progress.stopped}
    >
      <div className="space-y-4">
        {!isBusy && (
          <div>
            <button
              type="button"
              onClick={onStartExport}
              disabled={missing !== null}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition ${
                missing === null
                  ? 'bg-rose-500 hover:bg-rose-400 text-white cursor-pointer shadow-lg shadow-rose-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Rocket className="w-5 h-5" />
              {nameCount === 1 ? t('createOne') : t('createMany', { n: nameCount })}
            </button>
            {missing && <p className="text-sm text-slate-400 mt-2 mb-0">{t(missing)}</p>}
            {!missing && localNote && <p className="text-xs text-slate-500 mt-2 mb-0">{t('localNote')}</p>}
          </div>
        )}

        {isBusy && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-white flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                {progress.phase === 'preparing'
                  ? t('preparing')
                  : t('progress', { current: progress.current, total: progress.total })}
              </span>
              <span className="font-mono text-rose-300 font-bold">{progress.percent}%</span>
            </div>
            <div
              className="w-full h-3 rounded-full bg-slate-800 overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.percent}
            >
              <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
              <span className="truncate">{progress.currentName && t('nowMaking', { name: progress.currentName })}</span>
              <button
                type="button"
                onClick={onCancelExport}
                className="shrink-0 px-3 py-1.5 rounded-lg text-red-300 hover:bg-red-500/10 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                {t('stop')}
              </button>
            </div>
          </div>
        )}

        {fatalError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-start gap-2" role="alert">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{fatalError}</span>
          </div>
        )}

        {failures.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-100 text-sm" role="alert">
            <p className="font-semibold m-0 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t('failedSome', { n: failures.length })}
            </p>
            <ul className="m-0 pl-6 space-y-0.5">
              {failures.slice(0, 5).map((f, i) => (
                <li key={i}>
                  <b>{f.customerName}</b>: {f.error}
                </li>
              ))}
              {failures.length > 5 && <li>…</li>}
            </ul>
          </div>
        )}

        {exportedItems.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            {!isBusy && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-base font-bold text-white flex items-center gap-2 m-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  {doneTitle}
                </p>
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  disabled={isZipping}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  {isZipping ? t('zipping') : t('downloadAll')}
                </button>
              </div>
            )}
            {zipError && <p className="text-sm text-red-300 m-0">{t('errZip')}</p>}

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1 m-0 p-0 list-none">
              {exportedItems.map(item => (
                <li key={item.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewVideoUrl(item.videoUrl)}
                    title={t('watch')}
                    className="w-10 h-14 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative cursor-pointer"
                  >
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileVideo className="w-5 h-5 text-rose-400" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate m-0" title={item.customerName}>
                      {item.customerName}
                    </p>
                    <p className="text-xs text-slate-500 m-0">{(item.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewVideoUrl(item.videoUrl)}
                    title={t('watch')}
                    aria-label={`${t('watch')}: ${item.customerName}`}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <a
                    href={item.videoUrl}
                    download={item.filename}
                    title={t('download')}
                    aria-label={`${t('download')}: ${item.customerName}`}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {previewVideoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewVideoUrl(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl p-3 max-w-sm w-full border border-slate-700 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <video src={previewVideoUrl} controls autoPlay playsInline className="w-full max-h-[75vh] rounded-xl bg-black" />
            <button
              type="button"
              onClick={() => setPreviewVideoUrl(null)}
              className="mt-3 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition cursor-pointer"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </StepCard>
  );
};
