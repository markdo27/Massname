import React, { useRef, useState } from 'react';
import { ChevronDown, Upload } from 'lucide-react';
import type { OverlayPosition, TextStyle } from '../types';
import type { TranslationKey } from '../i18n/translations';
import { useI18n } from '../i18n/useI18n';
import { CURATED_FONTS, COLOR_PRESETS } from '../constants/fonts';
import { StepCard } from './StepCard';

interface TypographyControlsProps {
  style: TextStyle;
  onChange: (updated: Partial<TextStyle>) => void;
  position: OverlayPosition;
  onPositionChange: (updated: Partial<OverlayPosition>) => void;
  previewName: string;
  videoDuration: number;
}

const EFFECTS: { id: TextStyle['effect']; labelKey: TranslationKey }[] = [
  { id: 'none', labelKey: 'effectNone' },
  { id: 'soft', labelKey: 'effectShadow' },
  { id: 'glow', labelKey: 'effectGlow' },
  { id: 'outline', labelKey: 'effectOutline' },
  { id: 'ribbon', labelKey: 'effectRibbon' },
];

const POSITIONS: { labelKey: TranslationKey; y: number }[] = [
  { labelKey: 'posTop', y: 20 },
  { labelKey: 'posMiddle', y: 50 },
  { labelKey: 'posBottom', y: 78 },
];

const chip = (active: boolean) =>
  `px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer border ${
    active ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-950/60 border-slate-700 text-slate-200 hover:border-slate-500'
  }`;

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm font-semibold text-slate-300 mb-2 mt-0">{children}</p>
);

export const TypographyControls: React.FC<TypographyControlsProps> = ({
  style,
  onChange,
  position,
  onPositionChange,
  previewName,
  videoDuration,
}) => {
  const { t } = useI18n();
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const [customFont, setCustomFont] = useState<{ family: string; fileName: string } | null>(null);
  const [fontError, setFontError] = useState(false);

  // Custom fonts are loaded straight into the page; no server needed.
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const family = `Custom ${file.name.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N} _-]/gu, '')}`.trim();
      const face = new FontFace(family, await file.arrayBuffer());
      await face.load();
      document.fonts.add(face);
      setCustomFont({ family, fileName: file.name });
      setFontError(false);
      onChange({ fontFamily: family });
    } catch (err) {
      console.error('Font load failed:', err);
      setFontError(true);
    }
  };

  const fonts = [
    ...CURATED_FONTS.map(f => ({ family: f.name, label: t(f.labelKey) })),
    ...(customFont ? [{ family: customFont.family, label: customFont.fileName }] : []),
  ];
  const isPresetColor = COLOR_PRESETS.some(c => c.hex.toLowerCase() === style.color.toLowerCase());
  const maxTime = Math.max(0.1, Math.round(videoDuration * 10) / 10);

  return (
    <StepCard step={3} title={t('step3Title')} description={t('step3Desc')}>
      <div className="space-y-5">
        {/* Font */}
        <div>
          <Label>{t('font')}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {fonts.map(f => {
              const selected = style.fontFamily === f.family;
              return (
                <button
                  key={f.family}
                  type="button"
                  onClick={() => onChange({ fontFamily: f.family })}
                  aria-pressed={selected}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer min-w-0 ${
                    selected ? 'border-rose-500 bg-rose-500/10' : 'border-slate-700 bg-slate-950/60 hover:border-slate-500'
                  }`}
                >
                  <span className="block text-xl text-white truncate" style={{ fontFamily: `"${f.family}", sans-serif` }}>
                    {previewName}
                  </span>
                  <span className="block text-xs text-slate-400 mt-1 truncate">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Size */}
        <div>
          <div className="flex justify-between items-center">
            <Label>{t('size')}</Label>
            <span className="text-sm text-slate-400 mb-2">{style.fontSize}</span>
          </div>
          <input
            type="range"
            min="24"
            max="160"
            step="2"
            value={style.fontSize}
            onChange={e => onChange({ fontSize: parseInt(e.target.value, 10) })}
            aria-label={t('size')}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>

        {/* Color */}
        <div>
          <Label>{t('color')}</Label>
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map(c => {
              const selected = style.color.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onChange({ color: c.hex })}
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={selected}
                  className={`w-10 h-10 rounded-full border-2 transition cursor-pointer ${
                    selected ? 'border-rose-500 ring-2 ring-rose-500/40' : 'border-slate-600 hover:border-slate-400'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
            <label
              className={`h-10 px-3 rounded-full border-2 flex items-center gap-2 text-sm text-slate-200 cursor-pointer ${
                isPresetColor ? 'border-slate-600 hover:border-slate-400' : 'border-rose-500'
              }`}
            >
              <input
                type="color"
                value={style.color}
                onChange={e => onChange({ color: e.target.value })}
                className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent p-0"
              />
              {t('customColor')}
            </label>
          </div>
        </div>

        {/* Effect */}
        <div>
          <Label>{t('effect')}</Label>
          <div className="flex flex-wrap gap-2">
            {EFFECTS.map(eff => (
              <button
                key={eff.id}
                type="button"
                onClick={() => onChange({ effect: eff.id })}
                aria-pressed={style.effect === eff.id}
                className={chip(style.effect === eff.id)}
              >
                {t(eff.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Position */}
        <div>
          <Label>{t('position')}</Label>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map(p => {
              const active = position.xPercent === 50 && position.yPercent === p.y;
              return (
                <button
                  key={p.labelKey}
                  type="button"
                  onClick={() => onPositionChange({ xPercent: 50, yPercent: p.y })}
                  aria-pressed={active}
                  className={chip(active)}
                >
                  {t(p.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* More options */}
        <details className="group border-t border-slate-800 pt-4">
          <summary className="list-none flex items-center gap-2 text-sm font-semibold text-slate-300 cursor-pointer select-none hover:text-white [&::-webkit-details-marker]:hidden">
            <ChevronDown className="w-4 h-4 transition group-open:rotate-180" />
            {t('moreOptions')}
          </summary>

          <div className="space-y-5 mt-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ isBold: !style.isBold })}
                aria-pressed={style.isBold}
                className={`${chip(style.isBold)} font-bold`}
              >
                {t('bold')}
              </button>
              <button
                type="button"
                onClick={() => onChange({ isItalic: !style.isItalic })}
                aria-pressed={style.isItalic}
                className={`${chip(style.isItalic)} italic`}
              >
                {t('italic')}
              </button>
              <button
                type="button"
                onClick={() => onChange({ isUppercase: !style.isUppercase })}
                aria-pressed={style.isUppercase}
                className={chip(style.isUppercase)}
              >
                {t('uppercase')}
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label>{t('letterSpacing')}</Label>
                <span className="text-sm text-slate-400 mb-2">{style.letterSpacing}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="18"
                step="1"
                value={style.letterSpacing}
                onChange={e => onChange({ letterSpacing: parseInt(e.target.value, 10) })}
                aria-label={t('letterSpacing')}
                className="w-full accent-rose-500 cursor-pointer"
              />
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
                type="button"
                onClick={() => fontFileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {t('customFont')}
              </button>
              {customFont && style.fontFamily === customFont.family && (
                <p className="text-sm text-emerald-400 mt-2 mb-0">{t('customFontActive', { name: customFont.fileName })}</p>
              )}
              {fontError && <p className="text-sm text-red-300 mt-2 mb-0">{t('fontLoadError')}</p>}
            </div>

            <div>
              <Label>{t('timing')}</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onPositionChange({ showAlways: true })}
                  aria-pressed={position.showAlways}
                  className={chip(position.showAlways)}
                >
                  {t('timingAlways')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onPositionChange({
                      showAlways: false,
                      timeEnd: position.timeEnd > position.timeStart ? Math.min(position.timeEnd, maxTime) : maxTime,
                    })
                  }
                  aria-pressed={!position.showAlways}
                  className={chip(!position.showAlways)}
                >
                  {t('timingRange')}
                </button>
              </div>

              {!position.showAlways && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {(['timeStart', 'timeEnd'] as const).map(field => (
                    <label key={field} className="text-sm text-slate-300">
                      <span className="flex justify-between mb-1">
                        <span>{t(field === 'timeStart' ? 'timeFrom' : 'timeTo')}</span>
                        <span className="text-slate-400">{position[field].toFixed(1)}s</span>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={maxTime}
                        step="0.1"
                        value={Math.min(position[field], maxTime)}
                        onChange={e => {
                          const value = parseFloat(e.target.value);
                          onPositionChange(
                            field === 'timeStart'
                              ? { timeStart: value, timeEnd: Math.max(value, position.timeEnd) }
                              : { timeEnd: value, timeStart: Math.min(value, position.timeStart) }
                          );
                        }}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </details>
      </div>
    </StepCard>
  );
};
