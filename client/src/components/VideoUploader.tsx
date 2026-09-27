import React, { useRef, useState } from 'react';
import { UploadCloud, FileVideo, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import type { VideoData } from '../types';
import { useI18n } from '../i18n/useI18n';
import { StepCard } from './StepCard';

interface VideoUploaderProps {
  videoData: VideoData | null;
  previewFailed: boolean;
  onVideoSelected: (file: File) => void;
  onLoadSample: () => void;
  sampleAvailable: boolean;
  isLoadingSample: boolean;
}

function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(file.name);
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  videoData,
  previewFailed,
  onVideoSelected,
  onLoadSample,
  sampleAvailable,
  isLoadingSample,
}) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [wrongFile, setWrongFile] = useState(false);

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    if (!isVideoFile(file)) {
      setWrongFile(true);
      return;
    }
    setWrongFile(false);
    onVideoSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const warnings: string[] = [];
  if (wrongFile) warnings.push(t('notVideoFile'));
  if (videoData && previewFailed) warnings.push(t('cannotPreview'));
  if (videoData && !previewFailed && videoData.width >= videoData.height) warnings.push(t('notVertical'));

  return (
    <StepCard
      step={1}
      title={t('step1Title')}
      description={t('step1Desc')}
      done={videoData !== null}
      action={
        videoData && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 text-sm text-slate-200 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            {t('changeVideo')}
          </button>
        )
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm"
        className="hidden"
        onChange={e => {
          pickFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {!videoData ? (
        <div
          role="button"
          tabIndex={0}
          onDrop={handleDrop}
          onDragOver={e => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
            isDragOver ? 'border-rose-500 bg-rose-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
          }`}
        >
          <UploadCloud className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p className="text-base font-semibold text-white mb-3">{t('dropTitle')}</p>
          <span className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-400 text-white transition">
            {t('chooseFile')}
          </span>
          <p className="text-xs text-slate-400 mt-3">{t('dropHint')}</p>

          {sampleAvailable && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onLoadSample();
              }}
              disabled={isLoadingSample}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {isLoadingSample ? t('loadingSample') : t('useSample')}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="w-10 h-12 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
            <FileVideo className="w-5 h-5 text-rose-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate m-0">{videoData.name}</p>
            <p className="text-xs text-slate-400 m-0">
              {videoData.width}×{videoData.height}
              {videoData.duration > 0 && ` · ${videoData.duration.toFixed(1)}s`}
              {videoData.size > 0 && ` · ${(videoData.size / (1024 * 1024)).toFixed(1)} MB`}
            </p>
          </div>
        </div>
      )}

      {warnings.map(w => (
        <p key={w} className="mt-3 mb-0 text-sm text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {w}
        </p>
      ))}
    </StepCard>
  );
};
