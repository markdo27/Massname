import React, { useRef } from 'react';
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Upload } from 'lucide-react';
import type { TextStyle } from '../types';
import { CURATED_FONTS, COLOR_PRESETS } from '../constants/fonts';

interface TypographyControlsProps {
  style: TextStyle;
  onChange: (updated: Partial<TextStyle>) => void;
  onCustomFontUploaded: (fontFamily: string, fontUrl: string) => void;
  isUploadingFont: boolean;
}

export const TypographyControls: React.FC<TypographyControlsProps> = ({
  style,
  onChange,
  onCustomFontUploaded,
  isUploadingFont
}) => {
  const fontFileInputRef = useRef<HTMLInputElement>(null);

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('font', file);

      try {
        const res = await fetch('/api/upload-font', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.fontName && data.url) {
          // Register font-face dynamically in document
          const newFont = new FontFace(data.fontName, `url(${data.url})`);
          await newFont.load();
          document.fonts.add(newFont);
          onCustomFontUploaded(data.fontName, data.url);
        }
      } catch (err) {
        console.error('Font upload failed:', err);
      }
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 m-0">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold border border-amber-500/30">
              3
            </span>
            Font & Visual Styling
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Choose elegant fonts, colors, and shadows tailored for luxury invitations.
          </p>
        </div>

        <div>
          <input
            ref={fontFileInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={handleFontUpload}
          />
          <button
            onClick={() => fontFileInputRef.current?.click()}
            disabled={isUploadingFont}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="Upload your own custom TTF/OTF font"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            {isUploadingFont ? 'Uploading...' : 'Custom Font (.ttf/.otf)'}
          </button>
        </div>
      </div>

      {/* Font Family Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Font Family ({style.fontFamily})
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1 bg-slate-950/40 rounded-2xl border border-slate-800">
          {CURATED_FONTS.map((f) => {
            const isSelected = style.fontFamily === f.name;
            return (
              <button
                key={f.name}
                onClick={() => onChange({ fontFamily: f.name })}
                className={`text-left p-3 rounded-xl transition border cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-900/90 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-400/80 mb-0.5">
                    {f.category}
                  </div>
                  <div
                    className="text-base font-medium truncate text-white"
                    style={{ fontFamily: `"${f.name}", sans-serif` }}
                  >
                    {f.name}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">
                  {f.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size & Alignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Size Slider */}
        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-slate-300">Font Size</span>
            <span className="text-xs font-bold text-amber-400 font-mono">{style.fontSize}px</span>
          </div>
          <input
            type="range"
            min="24"
            max="160"
            step="2"
            value={style.fontSize}
            onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Alignment & Style toggles */}
        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-2">
          {/* Alignment */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onChange({ alignment: 'left' })}
              className={`p-1.5 rounded-lg transition ${
                style.alignment === 'left' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChange({ alignment: 'center' })}
              className={`p-1.5 rounded-lg transition ${
                style.alignment === 'center' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChange({ alignment: 'right' })}
              className={`p-1.5 rounded-lg transition ${
                style.alignment === 'right' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bold, Italic, Uppercase */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onChange({ isBold: !style.isBold })}
              className={`p-1.5 rounded-lg transition ${
                style.isBold ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChange({ isItalic: !style.isItalic })}
              className={`p-1.5 rounded-lg transition ${
                style.isItalic ? 'bg-amber-500 text-slate-950 italic' : 'text-slate-400 hover:text-white'
              }`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChange({ isUppercase: !style.isUppercase })}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                style.isUppercase ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="UPPERCASE"
            >
              AA
            </button>
          </div>
        </div>
      </div>

      {/* Colors & Luxury Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Color Palette
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-xs font-mono text-slate-400 uppercase">{style.color}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {COLOR_PRESETS.map((c) => {
            const isSelected = style.color.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.name}
                onClick={() => onChange({ color: c.hex })}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 shadow-md ring-1 ring-amber-400'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full shadow-inner border border-white/20"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-[10px] text-slate-300 truncate font-medium">
                  {c.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Letter Spacing & Readability Effects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Letter Spacing */}
        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-slate-300">Letter Spacing (Tracking)</span>
            <span className="text-xs font-bold text-amber-400 font-mono">{style.letterSpacing}px</span>
          </div>
          <input
            type="range"
            min="-2"
            max="18"
            step="1"
            value={style.letterSpacing}
            onChange={(e) => onChange({ letterSpacing: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Shadow & Outline Style */}
        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80">
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Readability & Effects
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'none', label: 'None' },
              { id: 'soft', label: 'Soft Shadow' },
              { id: 'cinematic', label: 'Cinematic' },
              { id: 'glow', label: 'Warm Glow' },
              { id: 'outline', label: 'Outline' },
              { id: 'ribbon', label: 'Ribbon Box' }
            ].map((eff) => {
              const isSelected = style.shadowType === eff.id;
              return (
                <button
                  key={eff.id}
                  onClick={() => onChange({ shadowType: eff.id as any })}
                  className={`text-[11px] py-1.5 px-2 rounded-lg font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {eff.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
