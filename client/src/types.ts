export interface VideoData {
  videoId: string;
  originalName: string;
  filename: string;
  url: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  hasAudio: boolean;
  size: number;
}

export interface TextStyle {
  fontFamily: string;
  customFontUrl?: string;
  fontSize: number; // in pixels relative to 1080x1920
  color: string;
  isBold: boolean;
  isItalic: boolean;
  isUppercase: boolean;
  alignment: 'center' | 'left' | 'right';
  letterSpacing: number; // in pixels
  lineHeight: number;
  // Shadow & Outline
  shadowType: 'none' | 'soft' | 'cinematic' | 'glow' | 'outline' | 'ribbon';
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  // Ribbon Background
  ribbonBgColor: string;
  ribbonOpacity: number;
  ribbonPaddingX: number;
  ribbonPaddingY: number;
  ribbonBorderRadius: number;
}

export interface OverlayPosition {
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  timeStart: number; // in seconds
  timeEnd: number; // in seconds
  showAlways: boolean;
  fadeDuration: number; // in seconds
}

export interface ExportedItem {
  id: string;
  customerName: string;
  filename: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  size: number;
  renderTime: string;
}

export interface BatchProgress {
  isRendering: boolean;
  total: number;
  current: number;
  currentName: string;
  percent: number;
  batchId: string;
  failedCount: number;
}
