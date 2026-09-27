import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, Music, Clock, Maximize, FileVideo, Sparkles, RefreshCw } from 'lucide-react';
import type { VideoData } from '../types';

interface VideoUploaderProps {
  videoData: VideoData | null;
  onVideoSelected: (file: File) => void;
  onLoadSample: () => void;
  sampleAvailable: boolean;
  isUploading: boolean;
  uploadProgress: number;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  videoData,
  onVideoSelected,
  onLoadSample,
  sampleAvailable,
  isUploading,
  uploadProgress
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/') || file.name.endsWith('.mp4')) {
        onVideoSelected(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onVideoSelected(e.target.files[0]);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 m-0">
            <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm font-bold border border-rose-500/30">
              1
            </span>
            Upload Reel Video (9:16 MP4)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload your base vertical invitation video with a blank space for customer names.
          </p>
        </div>

        {videoData && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Change Video
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={handleFileInput}
      />

      {!videoData ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-rose-500 bg-rose-500/10 scale-[1.01]'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-indigo-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30 shadow-inner">
            <UploadCloud className="w-8 h-8 text-rose-400 animate-pulse" />
          </div>

          <h3 className="text-base font-semibold text-white mb-1">
            Drag and drop your 9:16 vertical video here
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Supports MP4, MOV, WebM reels (Recommended: 1080x1920 Full HD vertical format)
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg shadow-rose-600/25 hover:from-rose-500 hover:to-indigo-500 transition"
            >
              Browse Computer File
            </button>

            {sampleAvailable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadSample();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Use Desktop Sample (You are inivated.mp4)
              </button>
            )}
          </div>

          {isUploading && (
            <div className="mt-5 max-w-sm mx-auto">
              <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                <span>Processing video...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Video Loaded Information Card */
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative shadow-md">
                <FileVideo className="w-6 h-6 text-rose-400" />
                <span className="absolute bottom-1 text-[8px] font-bold text-amber-300 bg-black/60 px-1 rounded">
                  9:16
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white truncate max-w-[280px]">
                    {videoData.originalName}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(videoData.size / (1024 * 1024)).toFixed(1)} MB • {videoData.fps} FPS
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5 text-slate-200">
                <Maximize className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold">{videoData.width} × {videoData.height}</span>
                {videoData.height > videoData.width && (
                  <span className="text-[10px] text-emerald-400 font-bold ml-1">9:16</span>
                )}
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5 text-slate-200">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{videoData.duration.toFixed(1)}s</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5 text-slate-200">
                <Music className="w-3.5 h-3.5 text-rose-400" />
                <span>{videoData.hasAudio ? 'Audio Stream Preserved' : 'Silent Reel'}</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
