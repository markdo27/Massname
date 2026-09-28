export type MediaKind = 'video' | 'image';

export interface MediaData {
  kind: MediaKind;
  name: string; // original file name
  url: string; // URL used by the preview
  mimeType: string;
  width: number;
  height: number;
  duration: number; // 0 for images
  size: number;
  file?: File; // the picked file, used by the in-browser export engines
  serverVideoId?: string; // set once a video is on the local export server
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number; // in pixels relative to a 1080px wide video or image
  color: string;
  isBold: boolean;
  isItalic: boolean;
  isUppercase: boolean;
  letterSpacing: number; // in pixels relative to a 1080px wide video or image
  lineHeight: number;
  effect: 'none' | 'soft' | 'cinematic' | 'glow' | 'outline' | 'ribbon';
  ribbonBgColor: string;
  ribbonOpacity: number;
}

export interface OverlayPosition {
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  timeStart: number; // in seconds
  timeEnd: number; // in seconds
  showAlways: boolean;
  fadeDuration: number; // in seconds
}

export type ExportEngine = 'server' | 'browser';

export interface ExportedItem {
  id: string;
  kind: MediaKind;
  customerName: string;
  filename: string;
  url: string;
  thumbnailUrl?: string | null;
  size: number;
  blob?: Blob; // present for in-browser renders, used to build the ZIP
}

export interface ExportFailure {
  customerName: string;
  error: string;
}

export interface BatchProgress {
  phase: 'idle' | 'preparing' | 'rendering' | 'finished';
  total: number;
  current: number; // 1-based index of the video being made
  currentName: string;
  percent: number; // overall progress, 0 to 100
  stopped: boolean;
}
