export interface FontItem {
  name: string;
  category: 'serif' | 'sans' | 'display';
  label: string;
  preview: string;
  description: string;
}

export const CURATED_FONTS: FontItem[] = [
  {
    name: 'Playfair Display',
    category: 'serif',
    label: 'Playfair Display',
    preview: 'Playfair Display',
    description: 'Timeless, elegant luxury serif for formal invitations'
  },
  {
    name: 'Poppins',
    category: 'sans',
    label: 'Poppins',
    preview: 'Poppins',
    description: 'Clean, modern geometric sans-serif with high readability'
  },
  {
    name: 'Archivo Black',
    category: 'display',
    label: 'Archivo Black',
    preview: 'Archivo Black',
    description: 'Bold, heavyweight display font with maximum visual impact'
  }
];

export const COLOR_PRESETS = [
  { name: 'Pure Diamond', hex: '#FFFFFF', border: '#E2E8F0' },
  { name: 'Imperial Gold', hex: '#D4AF37', border: '#B8860B' },
  { name: 'Rose Gold', hex: '#E0A899', border: '#C08081' },
  { name: 'Champagne', hex: '#F7E7CE', border: '#D1C2A5' },
  { name: 'Silver Pearl', hex: '#E2E8F0', border: '#94A3B8' },
  { name: 'Royal Emerald', hex: '#50C878', border: '#2E8B57' },
  { name: 'Ruby Wine', hex: '#9B111E', border: '#660000' },
  { name: 'Obsidian Black', hex: '#0F172A', border: '#334155' }
];

export const SAMPLE_NAMES = [
  'Alexander Montgomery',
  'David & Sarah Jenkins',
  'Elizabeth Bennett',
  'William Pierce',
  'Victoria Sterling',
  'Marcus Rostova',
  'Michael & Emma',
  'Johnathan Cole'
];
