import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Move, ChevronLeft, ChevronRight, Clock, Layers } from 'lucide-react';
import type { VideoData, TextStyle, OverlayPosition } from '../types';

interface VideoPreviewCanvasProps {
  videoData: VideoData | null;
  textStyle: TextStyle;
  position: OverlayPosition;
  onPositionChange: (pos: Partial<OverlayPosition>) => void;
  activeCustomerName: string;
  customerNames: string[];
  onSelectCustomerName: (name: string) => void;
}

export const VideoPreviewCanvas: React.FC<VideoPreviewCanvasProps> = ({
  videoData,
  textStyle,
  position,
  onPositionChange,
  activeCustomerName,
  customerNames,
  onSelectCustomerName
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isNearCenterX, setIsNearCenterX] = useState(false);
  const [isNearCenterY, setIsNearCenterY] = useState(false);

  // Play/Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;

      // Snapping to center
      if (Math.abs(x - 50) < 3.5) {
        x = 50;
        setIsNearCenterX(true);
      } else {
        setIsNearCenterX(false);
      }

      if (Math.abs(y - 50) < 3.5) {
        y = 50;
        setIsNearCenterY(true);
      } else {
        setIsNearCenterY(false);
      }

      // Constrain within bounds
      x = Math.max(5, Math.min(95, x));
      y = Math.max(5, Math.min(95, y));

      onPositionChange({
        xPercent: Math.round(x * 10) / 10,
        yPercent: Math.round(y * 10) / 10
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setIsNearCenterX(false);
        setIsNearCenterY(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onPositionChange]);

  // Next / Prev customer switcher
  const currentIndex = customerNames.indexOf(activeCustomerName);
  const handlePrevCustomer = () => {
    if (customerNames.length === 0) return;
    const prevIdx = (currentIndex - 1 + customerNames.length) % customerNames.length;
    onSelectCustomerName(customerNames[prevIdx]);
  };
  const handleNextCustomer = () => {
    if (customerNames.length === 0) return;
    const nextIdx = (currentIndex + 1) % customerNames.length;
    onSelectCustomerName(customerNames[nextIdx]);
  };

  // Determine visibility based on current time
  const isTextVisible =
    position.showAlways ||
    (currentTime >= position.timeStart && currentTime <= position.timeEnd);

  // Compute CSS text shadow / outline style
  let cssTextShadow = 'none';
  if (textStyle.shadowType === 'soft') {
    cssTextShadow = `2px 4px 12px ${textStyle.shadowColor || 'rgba(0, 0, 0, 0.6)'}`;
  } else if (textStyle.shadowType === 'cinematic') {
    cssTextShadow = `4px 8px 20px ${textStyle.shadowColor || 'rgba(0, 0, 0, 0.85)'}`;
  } else if (textStyle.shadowType === 'glow') {
    cssTextShadow = `0px 0px 24px ${textStyle.shadowColor || 'rgba(255, 215, 0, 0.8)'}`;
  } else if (textStyle.shadowType === 'outline') {
    cssTextShadow = `-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000`;
  }

  // Preview scaling factor (canvas 1080px to preview ~320px)
  const previewScale = 0.3;

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center">
      {/* Title */}
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 m-0">
            <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm font-bold border border-rose-500/30">
              4
            </span>
            Interactive Position & Timeline
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click & drag the name directly on the video screen to place it in your blank space.
          </p>
        </div>

        {/* Customer Switcher */}
        {customerNames.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handlePrevCustomer}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Previous Customer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-indigo-300 max-w-[120px] truncate text-center">
              {activeCustomerName}
            </span>
            <button
              onClick={handleNextCustomer}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Next Customer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 9:16 Smartphone Mockup Frame */}
      <div className="relative w-[300px] sm:w-[340px] aspect-[9/16] bg-black rounded-[36px] p-2.5 shadow-2xl ring-1 ring-slate-700/80 overflow-hidden flex flex-col justify-center items-center">
        {/* Smartphone Speaker notch */}
        <div className="absolute top-4 z-30 w-24 h-4 bg-slate-900/90 rounded-full flex items-center justify-center">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Video & Interactive Canvas Container */}
        <div
          ref={containerRef}
          className="relative w-full h-full rounded-[28px] overflow-hidden bg-slate-950 select-none cursor-crosshair"
        >
          {videoData ? (
            <video
              ref={videoRef}
              src={videoData.url}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <Layers className="w-12 h-12 mb-2 opacity-40" />
              <p className="text-xs">No video loaded. Upload a 9:16 video in Step 1.</p>
            </div>
          )}

          {/* Guide Snapping Lines */}
          {isNearCenterX && (
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500/80 z-20 pointer-events-none shadow-sm" />
          )}
          {isNearCenterY && (
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-rose-500/80 z-20 pointer-events-none shadow-sm" />
          )}

          {/* Draggable Text Overlay */}
          <div
            ref={textRef}
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              left: `${position.xPercent}%`,
              top: `${position.yPercent}%`,
              transform: 'translate(-50%, -50%)',
              fontFamily: `"${textStyle.fontFamily}", sans-serif`,
              fontSize: `${Math.round(textStyle.fontSize * previewScale)}px`,
              color: textStyle.color,
              fontWeight: textStyle.isBold ? 'bold' : 'normal',
              fontStyle: textStyle.isItalic ? 'italic' : 'normal',
              textAlign: textStyle.alignment,
              letterSpacing: `${textStyle.letterSpacing * previewScale}px`,
              textShadow: cssTextShadow,
              opacity: isTextVisible ? 1 : 0.2,
              transition: isDragging ? 'none' : 'opacity 0.2s',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            className={`z-20 px-3 py-1.5 rounded-xl transition-shadow whitespace-pre-wrap select-none max-w-[90%] ${
              isDragging ? 'ring-2 ring-rose-400 bg-black/40' : 'hover:ring-1 hover:ring-white/40'
            }`}
          >
            {/* If ribbon background */}
            {textStyle.shadowType === 'ribbon' && (
              <div
                className="absolute inset-0 -z-10 rounded-xl pointer-events-none"
                style={{
                  backgroundColor: textStyle.ribbonBgColor,
                  opacity: textStyle.ribbonOpacity
                }}
              />
            )}

            <span>{textStyle.isUppercase ? activeCustomerName.toUpperCase() : activeCustomerName}</span>

            {/* Drag Handle Indicator */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-300 p-0.5 rounded-full border border-slate-700 pointer-events-none opacity-0 hover:opacity-100 group-hover:opacity-100 transition">
              <Move className="w-2.5 h-2.5" />
            </div>
          </div>

          {/* Floating Drag Instructions */}
          {!isDragging && (
            <div className="absolute top-7 left-1/2 -translate-x-1/2 z-10 bg-slate-900/80 backdrop-blur text-[10px] text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/60 pointer-events-none flex items-center gap-1 shadow">
              <Move className="w-2.5 h-2.5 text-rose-400" />
              <span>Drag name to position</span>
            </div>
          )}
        </div>

        {/* Video Controls Bar */}
        {videoData && (
          <div className="w-full px-2 pt-2 flex flex-col gap-1.5 z-30">
            {/* Scrubber slider */}
            <input
              type="range"
              min="0"
              max={videoData.duration || 10}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-rose-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="p-1 rounded-lg hover:bg-slate-800 text-white transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-white transition cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <span>
                  {currentTime.toFixed(1)}s / {videoData.duration.toFixed(1)}s
                </span>
              </div>

              <div className="text-[10px] font-mono text-amber-300">
                X: {position.xPercent}% • Y: {position.yPercent}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Alignment Presets & Time Window */}
      <div className="w-full max-w-md mt-5 space-y-3">
        {/* Quick Position Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-950/60 p-2 rounded-2xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Align:</span>
          {[
            { label: 'Top Third', x: 50, y: 22 },
            { label: 'Center', x: 50, y: 50 },
            { label: 'Lower Third', x: 50, y: 72 },
            { label: 'Bottom', x: 50, y: 85 },
            { label: 'Snap Center X', x: 50, y: position.yPercent }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => onPositionChange({ xPercent: preset.x, yPercent: preset.y })}
              className="text-xs px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Time Window Appearance */}
        {videoData && (
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Visibility Timing
              </span>
              <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={position.showAlways}
                  onChange={(e) => onPositionChange({ showAlways: e.target.checked })}
                  className="rounded accent-rose-500"
                />
                <span>Show throughout full video</span>
              </label>
            </div>

            {!position.showAlways && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Start:</span>
                    <span className="font-mono text-white">{position.timeStart}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={videoData.duration}
                    step="0.1"
                    value={position.timeStart}
                    onChange={(e) => onPositionChange({ timeStart: parseFloat(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>End:</span>
                    <span className="font-mono text-white">{position.timeEnd}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={videoData.duration}
                    step="0.1"
                    value={position.timeEnd}
                    onChange={(e) => onPositionChange({ timeEnd: parseFloat(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
