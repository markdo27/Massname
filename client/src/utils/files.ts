import type { ExportedItem } from '../types';

/** A safe, unique `.mp4` file name for a guest (keeps Vietnamese letters, drops characters Windows rejects). */
export function uniqueVideoFileName(customerName: string, taken: Set<string>): string {
  const base =
    customerName
      .trim()
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 60) || 'video';
  let name = `${base}.mp4`;
  for (let i = 1; taken.has(name.toLowerCase()); i++) {
    name = `${base}_${i}.mp4`;
  }
  taken.add(name.toLowerCase());
  return name;
}

function firstCsvField(line: string): string {
  const quoted = line.match(/^\s*"((?:[^"]|"")*)"/);
  if (quoted) return quoted[1].replace(/""/g, '"');
  return line.split(/[,;\t]/)[0] ?? '';
}

// Typical column titles in English and Vietnamese spreadsheets ("Name", "Họ và tên", "Khách mời"…).
const HEADER_CELL = /^(full\s*)?(name|names|customer(\s*name)?|guest(\s*name)?)$|^(họ\s*(và\s*)?)?tên(\s*khách(\s*mời)?)?$|^khách(\s*mời)?$|^(ho\s*(va\s*)?)?ten$/i;

/** Parse an imported .txt/.csv file into one name per line (first column for CSV, header row skipped). */
export function parseNamesFile(text: string, isCsv: boolean): string[] {
  const names = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map(line => (isCsv ? firstCsvField(line) : line.replace(/^["']|["']$/g, '')))
    .map(line => line.trim())
    .filter(line => line.length > 0);
  if (isCsv && names.length > 0 && HEADER_CELL.test(names[0].normalize('NFC'))) names.shift();
  return names;
}

export function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadItemsAsZip(items: ExportedItem[], zipName: string): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const item of items) {
    if (item.blob) zip.file(item.filename, item.blob);
  }
  // MP4 is already compressed, so store the files as-is: much faster, same size.
  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, zipName);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
