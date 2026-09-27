// Talks to the optional local FFmpeg server (server/index.js). When the app is hosted as a
// static site (e.g. GitHub Pages) there is no server and the in-browser engine is used instead.

export interface ServerStatus {
  available: boolean;
  sampleAvailable: boolean;
}

export interface ServerVideo {
  serverVideoId: string;
  url: string;
  width: number;
  height: number;
  duration: number;
  size: number;
  name: string;
}

export interface ServerRenderResult {
  filename: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  size: number;
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  // Static hosts answer /api/* with an HTML 404 page, which is not an API response.
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`Export server is not available (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `HTTP ${res.status}`);
  }
  return data;
}

let statusPromise: Promise<ServerStatus> | null = null;

export function getServerStatus(): Promise<ServerStatus> {
  statusPromise ??= fetch('/api/status', { cache: 'no-store' })
    .then(readJson)
    .then(data => ({ available: data.status === 'ok', sampleAvailable: data.sampleAvailable === true }))
    .catch(() => ({ available: false, sampleAvailable: false }));
  return statusPromise;
}

function toServerVideo(data: Record<string, unknown>): ServerVideo {
  return {
    serverVideoId: String(data.videoId),
    url: String(data.url),
    width: Number(data.width) || 1080,
    height: Number(data.height) || 1920,
    duration: Number(data.duration) || 0,
    size: Number(data.size) || 0,
    name: String(data.originalName ?? data.filename),
  };
}

export async function uploadVideoToServer(file: File): Promise<ServerVideo> {
  const formData = new FormData();
  formData.append('video', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  return toServerVideo(await readJson(res));
}

export async function loadServerSample(): Promise<ServerVideo> {
  const res = await fetch('/api/load-sample', { method: 'POST' });
  return toServerVideo(await readJson(res));
}

export async function renderOnServer(
  params: {
    batchId: string;
    videoId: string;
    customerName: string;
    overlayImageBase64: string;
    timeStart: number;
    timeEnd: number;
    fadeDuration: number;
  },
  signal: AbortSignal
): Promise<ServerRenderResult> {
  const res = await fetch('/api/render-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, quality: 'balanced' }),
    signal,
  });
  const data = await readJson(res);
  return {
    filename: String(data.filename),
    videoUrl: String(data.videoUrl),
    thumbnailUrl: typeof data.thumbnailUrl === 'string' ? data.thumbnailUrl : null,
    size: Number(data.size) || 0,
  };
}

export function serverZipUrl(batchId: string): string {
  return `/api/download-zip/${encodeURIComponent(batchId)}`;
}
