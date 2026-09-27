import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  getFirstEncodableVideoCodec,
  type VideoCodec,
} from 'mediabunny';
import type { OverlayPosition } from '../types';
import { ExportError } from './exportError';

// In-browser export engine: decodes the video with WebCodecs, draws the name on every frame,
// re-encodes the video and copies the original audio untouched. Needs no server, so it works
// on static hosting such as GitHub Pages. Loaded on demand because the encoder library is large.

export function hasWebCodecs(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';
}

// H.264 first: it plays everywhere (iPhone, Zalo, Facebook, Instagram…).
const PREFERRED_CODECS: VideoCodec[] = ['avc', 'hevc', 'vp9', 'av1'];

export async function pickVideoCodec(width: number, height: number): Promise<VideoCodec> {
  if (!hasWebCodecs()) throw new ExportError('errNoEngine');
  const codec = await getFirstEncodableVideoCodec(PREFERRED_CODECS, { width, height });
  if (!codec) throw new ExportError('errNoEncoder');
  return codec;
}

/** Opacity of the name at time `t`, matching the server's FFmpeg fade filter. */
export function overlayAlpha(t: number, pos: OverlayPosition): number {
  if (pos.showAlways) return 1;
  if (t < pos.timeStart || t > pos.timeEnd) return 0;
  if (pos.fadeDuration <= 0) return 1;
  return Math.max(0, Math.min(1, (t - pos.timeStart) / pos.fadeDuration, (pos.timeEnd - t) / pos.fadeDuration));
}

function makeThumbnail(source: HTMLCanvasElement): string {
  const thumb = document.createElement('canvas');
  thumb.width = 180;
  thumb.height = Math.round((180 * source.height) / source.width);
  thumb.getContext('2d')?.drawImage(source, 0, 0, thumb.width, thumb.height);
  return thumb.toDataURL('image/jpeg', 0.75);
}

export interface BrowserRenderOptions {
  source: Blob;
  overlay: HTMLCanvasElement;
  position: OverlayPosition;
  codec: VideoCodec;
  signal: AbortSignal;
  onProgress?: (fraction: number) => void;
}

export async function renderInBrowser(opts: BrowserRenderOptions): Promise<{ blob: Blob; thumbnailUrl: string | null }> {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(opts.source) });
  try {
    const videoTrack = await input.getPrimaryVideoTrack().catch(() => null);
    if (!videoTrack || !(await videoTrack.canDecode())) {
      throw new ExportError('errUnreadable', 'The video track cannot be decoded in this browser');
    }

    const width = videoTrack.displayWidth;
    const height = videoTrack.displayHeight;
    const duration = await input.computeDuration();
    const thumbnailAt = Math.min(1, duration / 2);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    let thumbnailUrl: string | null = null;
    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: new BufferTarget(),
    });

    const conversion = await Conversion.init({
      input,
      output,
      tracks: 'primary',
      showWarnings: false,
      video: {
        codec: opts.codec,
        quality: new Quality('high'),
        forceTranscode: true,
        allowTransformationMetadata: false,
        processedWidth: width,
        processedHeight: height,
        process: sample => {
          sample.draw(ctx, 0, 0, width, height);
          const alpha = overlayAlpha(sample.timestamp, opts.position);
          if (alpha > 0) {
            ctx.globalAlpha = alpha;
            ctx.drawImage(opts.overlay, 0, 0, width, height);
            ctx.globalAlpha = 1;
          }
          if (!thumbnailUrl && sample.timestamp >= thumbnailAt) {
            thumbnailUrl = makeThumbnail(canvas);
          }
          return canvas;
        },
      },
      // Audio is left at its defaults: copied as-is whenever the MP4 container allows it.
    });

    const droppedVideo = conversion.discardedTracks.find(d => d.track.type === 'video');
    if (droppedVideo || !conversion.isValid) {
      const reason = droppedVideo?.reason ?? 'invalid conversion';
      throw new ExportError(reason === 'no_encodable_target_codec' ? 'errNoEncoder' : 'errUnreadable', reason);
    }

    if (opts.onProgress) conversion.onProgress = opts.onProgress;
    opts.signal.throwIfAborted();
    const cancel = () => void conversion.cancel();
    opts.signal.addEventListener('abort', cancel);
    try {
      await conversion.execute();
    } finally {
      opts.signal.removeEventListener('abort', cancel);
    }

    const buffer = output.target.buffer;
    if (!buffer) throw new Error('The encoder produced no output');
    return { blob: new Blob([buffer], { type: 'video/mp4' }), thumbnailUrl };
  } finally {
    input.dispose();
  }
}
