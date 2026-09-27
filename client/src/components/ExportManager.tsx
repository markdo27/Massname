import React, { useState } from 'react';
import { Download, Rocket, CheckCircle2, FileVideo, Archive, Play, Copy, Check } from 'lucide-react';
import type { ExportedItem, BatchProgress, VideoData } from '../types';

interface ExportManagerProps {
  videoData: VideoData | null;
  customerNames: string[];
  progress: BatchProgress;
  exportedItems: ExportedItem[];
  onStartExport: (quality: 'high' | 'balanced' | 'fast') => void;
  onCancelExport: () => void;
  batchId: string;
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  videoData,
  customerNames,
  progress,
  exportedItems,
  onStartExport,
  onCancelExport,
  batchId
}) => {
  const [quality, setQuality] = useState<'high' | 'balanced' | 'fast'>('balanced');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const canExport = videoData !== null && customerNames.length > 0 && !progress.isRendering;

  const handleCopyLink = (url: string, id: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 m-0">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-500/30">
              5
            </span>
            Mass Export Invitations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Render high-definition 9:16 MP4s with preserved audio for every customer in your list.
          </p>
        </div>

        {/* Export Settings */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 px-2 font-medium">Quality:</span>
            {(['fast', 'balanced', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                disabled={progress.isRendering}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition cursor-pointer ${
                  quality === q
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Banner / Export Button */}
      {!progress.isRendering && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-indigo-950/40 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Ready to generate {customerNames.length} personalized videos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Each video will be encoded with native 1080x1920 MP4 (H.264), full audio track, and individual filenames.
            </p>
          </div>

          <button
            onClick={() => onStartExport(quality)}
            disabled={!canExport}
            className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
              canExport
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white shadow-emerald-500/20 hover:scale-[1.02]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>Start Mass Export ({customerNames.length} Videos)</span>
          </button>
        </div>
      )}

      {/* Live Batch Progress Bar */}
      {progress.isRendering && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              Rendering Video {progress.current} of {progress.total}...
            </span>
            <span className="font-mono text-emerald-400 font-bold">{progress.percent}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              Current recipient: <span className="text-amber-300 font-semibold">{progress.currentName}</span>
            </div>
            <button
              onClick={onCancelExport}
              className="text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
            >
              Cancel Export
            </button>
          </div>
        </div>
      )}

      {/* Completed Batch Actions: Download All as ZIP */}
      {exportedItems.length > 0 && (
        <div className="pt-2 border-t border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {exportedItems.length} Videos Rendered Successfully
              </h3>
              <p className="text-xs text-slate-400">
                You can download the entire bundle as a single .ZIP file or download videos one by one.
              </p>
            </div>

            <a
              href={`/api/download-zip/${batchId}`}
              download
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              Download All as ZIP (.zip)
            </a>
          </div>

          {/* Exported Videos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {exportedItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between gap-2.5 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail / Video icon */}
                  <div
                    onClick={() => setPreviewVideoUrl(item.videoUrl)}
                    className="w-12 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden relative group"
                  >
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <FileVideo className="w-5 h-5 text-indigo-400" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate" title={item.customerName}>
                      {item.customerName}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.filename}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <span>{(item.size / (1024 * 1024)).toFixed(1)} MB</span>
                      <span>•</span>
                      <span>{item.renderTime}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                  <a
                    href={item.videoUrl}
                    download={item.filename}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download</span>
                  </a>

                  <button
                    onClick={() => handleCopyLink(item.videoUrl, item.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Copy Video Link"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => setPreviewVideoUrl(item.videoUrl)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Watch Video"
                  >
                    <Play className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Modal Preview */}
      {previewVideoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewVideoUrl(null)}
        >
          <div
            className="relative bg-slate-900 rounded-3xl p-3 max-w-sm w-full border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black">
              <video src={previewVideoUrl} controls autoPlay className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => setPreviewVideoUrl(null)}
              className="mt-3 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
