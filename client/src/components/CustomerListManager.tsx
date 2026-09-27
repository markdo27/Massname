import React, { useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { parseNamesFile } from '../utils/files';
import { StepCard } from './StepCard';

interface CustomerListManagerProps {
  rawNamesText: string;
  onRawNamesChange: (text: string) => void;
  nameCount: number;
}

export const CustomerListManager: React.FC<CustomerListManagerProps> = ({ rawNamesText, onRawNamesChange, nameCount }) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const names = parseNamesFile(String(reader.result ?? ''), /\.csv$/i.test(file.name));
      onRawNamesChange(names.join('\n'));
    };
    reader.readAsText(file);
  };

  return (
    <StepCard step={2} title={t('step2Title')} description={t('step2Desc')} done={nameCount > 0}>
      <textarea
        rows={6}
        value={rawNamesText}
        onChange={e => onRawNamesChange(e.target.value)}
        placeholder={'Nguyễn Văn An\nTrần Thị Bình\nAnh Minh & Chị Lan'}
        aria-label={t('step2Title')}
        spellCheck={false}
        className="w-full bg-slate-950/70 border border-slate-700 rounded-xl p-3 text-base text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/60 focus:border-rose-500 transition resize-y"
      />

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-sm font-semibold text-slate-200 mr-auto">
          {nameCount === 1 ? t('nameCountOne') : t('nameCount', { n: nameCount })}
        </span>

        <input ref={fileInputRef} type="file" accept=".txt,.csv,text/plain,text/csv" className="hidden" onChange={handleFileUpload} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title={t('importHint')}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          {t('importFile')}
        </button>

        {rawNamesText && (
          <button
            type="button"
            onClick={() => onRawNamesChange('')}
            className="px-3 py-2 rounded-xl text-red-300 hover:bg-red-500/10 text-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            {t('clear')}
          </button>
        )}
      </div>
    </StepCard>
  );
};
