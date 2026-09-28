import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, Film, Move } from 'lucide-react';
import type { MediaData, TextStyle, OverlayPosition } from '../types';
import { useI18n } from '../i18n/useI18n';
import { REFERENCE_WIDTH, displayName, previewTextShadow } from '../utils/canvasRenderer';

interface VideoPreviewCanvasProps {
  media: MediaData | null;
  textStyle: TextStyle;
  position: OverlayPosition;
  onPositionChange: (pos: Partial<OverlayPosition>) => void;
  previewName: string;
  nameCount: number;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
}

export const VideoPreviewCanvas: React.FC<VideoPreviewCanvasProps> = ({
  media,
  textStyle,
  position,
  onPositionChange,
  previewName,
  nameCount,
  activeIndex,
  onActiveIndexChange,
}) => {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [snappedX, setSnappedX] = useState(false);
  const [containerWidth, setContainerWidth] = useState(300);

  // Keep the preview text exactly proportional to the exported video.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => setContainerWidth(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = containerWidth / REFERENCE_WIDTH;
  const aspect = media ? `${media.width} / ${media.height}` : '9 / 16';
  const isLandscape = media ? media.width > media.height : false;
  const isVideo = media?.kind === 'video';

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const moveTo = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    let x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const snap = Math.abs(x - 50) < 2.5;
    if (snap) x = 50;
    setSnappedX(snap);
    onPositionChange({
      xPercent: Math.round(Math.max(3, Math.min(97, x)) * 10) / 10,
      yPercent: Math.round(Math.max(3, Math.min(97, y)) * 10) / 10,
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const stopDragging = () => {
    setIsDragging(false);
    setSnappedX(false);
  };

  const isTextVisible =
    !isVideo || position.showAlways || (currentTime >= position.timeStart && currentTime <= position.timeEnd);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center">
      <div className="w-full flex items-center justify-between gap-2 mb-3">
        <h2 className="text-lg font-semibold text-white m-0 whitespace-nowrap">{t('previewTitle')}</h2>
        <span className="text-xs text-slate-400 flex items-center gap-1 text-right">
          <Move className="w-3.5 h-3.5" />
          {t('previewHint')}
        </span>
      </div>

      <div
        ref={containerRef}
        onClick={e => media && moveTo(e.clientX, e.clientY)}
        className={`relative ${isLandscape ? 'w-full' : 'w-full max-w-[320px]'} rounded-2xl overflow-hidden bg-black border border-slate-700 select-none ${
          media ? 'cursor-crosshair' : ''
        }`}
        style={{ aspectRatio: aspect }}
      >
        {media?.kind === 'image' ? (
          <img
            src={media.url}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : media ? (
          <video
            ref={videoRef}
            src={media.url}
            className="absolute inset-0 w-full h-full object-contain"
            loop
            playsInline
            muted={isMuted}
            onLoadedMetadata={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <Film className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm m-0">{t('noVideoYet')}</p>
          </div>
        )}

        {snappedX && <div className="absolute inset-y-0 left-1/2 w-px bg-rose-500 pointer-events-none" />}

        {/* The name: drag it (mouse or finger) to move it */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={e => isDragging && moveTo(e.clientX, e.clientY)}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: `${position.xPercent}%`,
            top: `${position.yPercent}%`,
            transform: 'translate(-50%, -50%)',
            touchAction: 'none',
            whiteSpace: 'pre',
            lineHeight: textStyle.lineHeight,
            padding: `${16 * scale}px ${32 * scale}px`,
            borderRadius: `${16 * scale}px`,
            fontFamily: `"${textStyle.fontFamily}", sans-serif`,
            fontSize: `${textStyle.fontSize * scale}px`,
            color: textStyle.color,
            fontWeight: textStyle.isBold ? 'bold' : 'normal',
            fontStyle: textStyle.isItalic ? 'italic' : 'normal',
            letterSpacing: `${textStyle.letterSpacing * scale}px`,
            textShadow: previewTextShadow(textStyle, scale),
            backgroundColor:
              textStyle.effect === 'ribbon' ? hexToRgba(textStyle.ribbonBgColor, textStyle.ribbonOpacity) : 'transparent',
            opacity: isTextVisible ? 1 : 0.25,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          className={`outline-dashed outline-1 ${isDragging ? 'outline-rose-400' : 'outline-transparent hover:outline-white/50'}`}
        >
          {displayName(previewName, textStyle)}
        </div>
      </div>

      {/* Player controls */}
      {media && isVideo && (
        <div className={`${isLandscape ? 'w-full' : 'w-full max-w-[320px]'} mt-3`}>
          <input
            type="range"
            min="0"
            max={media.duration || 10}
            step="0.05"
            value={currentTime}
            onChange={e => {
              const time = parseFloat(e.target.value);
              if (videoRef.current) videoRef.current.currentTime = time;
              setCurrentTime(time);
            }}
            aria-label="Timeline"
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? t('pause') : t('play')}
              aria-label={isPlaying ? t('pause') : t('play')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? t('soundOn') : t('soundOff')}
              aria-label={isMuted ? t('soundOn') : t('soundOff')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span>
              {currentTime.toFixed(1)}s / {media.duration.toFixed(1)}s
            </span>
          </div>
        </div>
      )}

      {/* Browse through the names */}
      {nameCount > 1 && (
        <div className="flex items-center gap-2 mt-3 bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-full">
          <button
            type="button"
            onClick={() => onActiveIndexChange((activeIndex - 1 + nameCount) % nameCount)}
            title={t('prevName')}
            aria-label={t('prevName')}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-200 truncate min-w-0 max-w-[200px] text-center">
            {activeIndex + 1}/{nameCount} · {previewName}
          </span>
          <button
            type="button"
            onClick={() => onActiveIndexChange((activeIndex + 1) % nameCount)}
            title={t('nextName')}
            aria-label={t('nextName')}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};
