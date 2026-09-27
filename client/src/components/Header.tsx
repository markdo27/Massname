import React from 'react';
import { Film, Zap } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  hasVideo: boolean;
  customerCount: number;
  sampleAvailable: boolean;
  onLoadSample: () => void;
  isLoadingSample: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onStepClick,
  hasVideo,
  customerCount,
  sampleAvailable,
  onLoadSample,
  isLoadingSample
}) => {
  const steps = [
    { num: 1, label: 'Video Reel', ready: hasVideo },
    { num: 2, label: 'Customer List', ready: customerCount > 0 },
    { num: 3, label: 'Font & Style', ready: true },
    { num: 4, label: 'Position Overlay', ready: hasVideo },
    { num: 5, label: 'Mass Export', ready: hasVideo && customerCount > 0 }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white m-0 p-0 flex items-center gap-2">
                Reel Invitation
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  9:16
                </span>
              </h1>
            </div>
            <p className="text-xs text-rose-400 font-semibold tracking-wide m-0">Made for BLK.HN</p>
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          {steps.map((s, idx) => {
            const isActive = currentStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => onStepClick(s.num)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-white text-slate-900'
                      : s.ready
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {s.ready && !isActive ? '✓' : s.num}
                </span>
                <span>{s.label}</span>
                {idx < steps.length - 1 && (
                  <span className="text-slate-700 ml-1">›</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Actions & Status */}
        <div className="flex items-center gap-2.5">
          {sampleAvailable && !hasVideo && (
            <button
              onClick={onLoadSample}
              disabled={isLoadingSample}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
              title="Detected 'You are inivated.mp4' on your Desktop"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {isLoadingSample ? 'Loading Sample...' : 'Load Desktop Invitation'}
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FFmpeg 60fps Ready</span>
          </div>
        </div>

      </div>
    </header>
  );
};
