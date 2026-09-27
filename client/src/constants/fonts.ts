import type { TranslationKey } from '../i18n/translations';

export interface FontItem {
  name: string;
  labelKey: TranslationKey;
}

// Every font here includes Vietnamese glyphs (ễ, ộ, ứ…), so names never fall back to a different font.
// They are loaded from Google Fonts in index.html.
export const CURATED_FONTS: FontItem[] = [
  { name: 'Playfair Display', labelKey: 'fontElegant' },
  { name: 'Montserrat', labelKey: 'fontModern' },
  { name: 'Great Vibes', labelKey: 'fontScript' },
  { name: 'Anton', labelKey: 'fontBold' },
];

export const COLOR_PRESETS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Rose Gold', hex: '#E0A899' },
  { name: 'Champagne', hex: '#F7E7CE' },
  { name: 'Ruby', hex: '#9B111E' },
  { name: 'Black', hex: '#0F172A' },
];
