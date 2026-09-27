import React, { useRef } from 'react';
import { Users, Upload, Trash2, Sparkles, Check } from 'lucide-react';
import { SAMPLE_NAMES } from '../constants/fonts';

interface CustomerListManagerProps {
  rawNamesText: string;
  onRawNamesChange: (text: string) => void;
  parsedNames: string[];
  activePreviewName: string;
  onSelectPreviewName: (name: string) => void;
}

export const CustomerListManager: React.FC<CustomerListManagerProps> = ({
  rawNamesText,
  onRawNamesChange,
  parsedNames,
  activePreviewName,
  onSelectPreviewName
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const cleanLines = text
            .split(/[\r\n]+/)
            .map(l => l.replace(/^["']|["']$/g, '').trim())
            .filter(l => l.length > 0);
          onRawNamesChange(cleanLines.join('\n'));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSample = () => {
    onRawNamesChange(SAMPLE_NAMES.join('\n'));
  };

  const handleClear = () => {
    onRawNamesChange('');
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 m-0">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
              2
            </span>
            Fill Customer Names
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter or paste customer names below (one name per line).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {parsedNames.length} {parsedNames.length === 1 ? 'Customer' : 'Customers'}
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="Import names from .txt or .csv"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            Import .TXT / .CSV
          </button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          onClick={handleLoadSample}
          className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 border border-slate-700/60 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          Load Sample Names
        </button>

        {rawNamesText && (
          <button
            onClick={handleClear}
            className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 transition flex items-center gap-1 border border-red-500/20 ml-auto cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Textarea for bulk names */}
      <div className="relative mb-4">
        <textarea
          rows={6}
          value={rawNamesText}
          onChange={(e) => onRawNamesChange(e.target.value)}
          placeholder={`Alexander Montgomery\nDavid & Sarah Jenkins\nElizabeth Bennett\nWilliam Pierce\nVictoria Sterling`}
          className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-medium transition resize-y"
        />
        <div className="absolute right-3 bottom-3 text-[11px] text-slate-500 pointer-events-none">
          1 name per line
        </div>
      </div>

      {/* Recipient Chips Preview */}
      {parsedNames.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Click any name to preview on video canvas:</span>
            <span className="text-[11px] text-indigo-400 font-semibold truncate max-w-[200px]">
              Active: {activePreviewName}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {parsedNames.map((name, i) => {
              const isSelected = name === activePreviewName;
              return (
                <button
                  key={i}
                  onClick={() => onSelectPreviewName(name)}
                  className={`text-xs px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-md font-semibold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <span className="text-[10px] opacity-60">#{i + 1}</span>
                  <span className="truncate max-w-[200px]">{name}</span>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
