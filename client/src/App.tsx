import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import type { VideoCodec } from 'mediabunny';
import { Header } from './components/Header';
import { VideoUploader } from './components/VideoUploader';
import { CustomerListManager } from './components/CustomerListManager';
import { TypographyControls } from './components/TypographyControls';
import { VideoPreviewCanvas } from './components/VideoPreviewCanvas';
import { ExportManager } from './components/ExportManager';
import type {
  MediaData,
  TextStyle,
  OverlayPosition,
  ExportedItem,
  ExportFailure,
  BatchProgress,
  ExportEngine,
} from './types';
import { useI18n } from './i18n/useI18n';
import { renderTextOverlay } from './utils/canvasRenderer';
import { ExportError } from './utils/exportError';
import {
  getServerStatus,
  loadServerSample,
  renderOnServer,
  serverZipUrl,
  uploadVideoToServer,
  type ServerStatus,
  type ServerVideo,
} from './utils/serverApi';
import { downloadItemsAsZip, mediaKindOf, triggerDownload, uniqueFileName } from './utils/files';
import { imageOutputFor, loadImage, renderImageWithName } from './utils/imageExport';

type RenderedFile = Pick<ExportedItem, 'filename' | 'url' | 'thumbnailUrl' | 'size' | 'blob'>;

const DEFAULT_STYLE: TextStyle = {
  fontFamily: 'Playfair Display',
  fontSize: 72,
  color: '#D4AF37',
  isBold: false,
  isItalic: false,
  isUppercase: false,
  letterSpacing: 2,
  lineHeight: 1.2,
  effect: 'soft',
  ribbonBgColor: '#000000',
  ribbonOpacity: 0.6,
};

const IDLE_PROGRESS: BatchProgress = {
  phase: 'idle',
  total: 0,
  current: 0,
  currentName: '',
  percent: 0,
  stopped: false,
};

function readVideoMetadata(url: string): Promise<{ width: number; height: number; duration: number } | null> {
  return new Promise(resolve => {
    const video = document.createElement('video');
    const timer = setTimeout(() => resolve(null), 15000);
    video.preload = 'metadata';
    video.muted = true;
    video.onloadedmetadata = () => {
      clearTimeout(timer);
      resolve(
        video.videoWidth > 0
          ? {
              width: video.videoWidth,
              height: video.videoHeight,
              duration: Number.isFinite(video.duration) ? video.duration : 0,
            }
          : null
      );
    };
    video.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    video.src = url;
  });
}

export function App() {
  const { t } = useI18n();
  const [serverStatus, setServerStatus] = useState<ServerStatus>({ available: false, sampleAvailable: false });
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const [media, setMedia] = useState<MediaData | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  // Resolves once the background upload to the local server finishes (null when there is no server).
  const uploadRef = useRef<Promise<ServerVideo | null> | null>(null);
  // Counts file picks, so a slow-to-load earlier pick can't overwrite a newer one.
  const selectionRef = useRef(0);

  const [rawNamesText, setRawNamesText] = useState('');
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  const [textStyle, setTextStyle] = useState<TextStyle>(DEFAULT_STYLE);
  const [position, setPosition] = useState<OverlayPosition>({
    xPercent: 50,
    yPercent: 78,
    timeStart: 0,
    timeEnd: 10,
    showAlways: true,
    fadeDuration: 0.5,
  });

  const [progress, setProgress] = useState<BatchProgress>(IDLE_PROGRESS);
  const [exportedItems, setExportedItems] = useState<ExportedItem[]>([]);
  const [failures, setFailures] = useState<ExportFailure[]>([]);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [batch, setBatch] = useState<{ id: string; engine: ExportEngine } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isBusy = progress.phase === 'preparing' || progress.phase === 'rendering';

  useEffect(() => {
    getServerStatus().then(setServerStatus);
  }, []);

  // Warn before closing the tab in the middle of an export.
  useEffect(() => {
    if (!isBusy) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isBusy]);

  const names = useMemo(
    () =>
      rawNamesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0),
    [rawNamesText]
  );
  const previewIndex = Math.min(activePreviewIndex, Math.max(0, names.length - 1));
  const previewName = names[previewIndex] ?? t('sampleName');

  // Swap in a new video or image, freeing the preview URL of the previous one.
  const replaceMedia = (next: MediaData) =>
    setMedia(prev => {
      if (prev?.url.startsWith('blob:')) URL.revokeObjectURL(prev.url);
      return next;
    });

  const handleFileSelected = async (file: File) => {
    const selection = ++selectionRef.current;
    const localUrl = URL.createObjectURL(file);
    const isStale = () => {
      if (selection === selectionRef.current) return false;
      URL.revokeObjectURL(localUrl);
      return true;
    };

    if (mediaKindOf(file) === 'image') {
      uploadRef.current = null; // images are always made in the browser
      const image = await loadImage(localUrl).catch(() => null);
      if (isStale()) return;
      setPreviewFailed(image === null);
      replaceMedia({
        kind: 'image',
        name: file.name,
        url: localUrl,
        mimeType: file.type || (/\.jpe?g$/i.test(file.name) ? 'image/jpeg' : 'image/png'),
        width: image?.naturalWidth || 1080,
        height: image?.naturalHeight || 1920,
        duration: 0,
        size: file.size,
        file,
      });
      return;
    }

    const meta = await readVideoMetadata(localUrl);
    if (isStale()) return;
    const duration = meta?.duration ?? 0;

    setPreviewFailed(meta === null);
    replaceMedia({
      kind: 'video',
      name: file.name,
      url: localUrl,
      mimeType: file.type,
      width: meta?.width ?? 1080,
      height: meta?.height ?? 1920,
      duration,
      size: file.size,
      file,
    });
    setPosition(prev => ({ ...prev, timeStart: 0, timeEnd: Math.round(duration * 10) / 10 || 10 }));

    // Only upload when the local FFmpeg server is running; static hosting has nowhere to upload to.
    const upload = getServerStatus()
      .then(status => (status.available ? uploadVideoToServer(file) : null))
      .catch(err => {
        console.warn('Upload to local server failed, the browser engine will be used:', err);
        return null;
      });
    uploadRef.current = upload;
    const serverVideo = await upload;
    if (!serverVideo) return;
    setMedia(prev =>
      prev?.file === file
        ? {
            ...prev,
            serverVideoId: serverVideo.serverVideoId,
            // The browser could not read the file: trust FFmpeg's measurements instead.
            ...(meta ? {} : { width: serverVideo.width, height: serverVideo.height, duration: serverVideo.duration }),
          }
        : prev
    );
  };

  const handleLoadSample = async () => {
    const selection = ++selectionRef.current;
    setIsLoadingSample(true);
    try {
      const sample = await loadServerSample();
      if (selection !== selectionRef.current) return;
      uploadRef.current = Promise.resolve(sample);
      setPreviewFailed(false);
      replaceMedia({
        kind: 'video',
        name: sample.name,
        url: sample.url,
        mimeType: 'video/mp4',
        width: sample.width,
        height: sample.height,
        duration: sample.duration,
        size: sample.size,
        serverVideoId: sample.serverVideoId,
      });
      setPosition(prev => ({ ...prev, timeStart: 0, timeEnd: sample.duration || 10 }));
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleStartExport = async () => {
    if (!media || names.length === 0 || isBusy) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const source = media;
    const queue = [...names];
    const style = textStyle;
    const pos = position;
    const batchId = `batch_${Date.now()}`;

    exportedItems.forEach(item => item.blob && URL.revokeObjectURL(item.url));
    setExportedItems([]);
    setFailures([]);
    setFatalError(null);
    setProgress({ ...IDLE_PROGRESS, phase: 'preparing', total: queue.length });

    const items: ExportedItem[] = [];
    const failed: ExportFailure[] = [];
    try {
      const takenNames = new Set<string>();
      const asLocalFile = (customerName: string, extension: string, blob: Blob, thumbnailUrl: string | null) => ({
        filename: uniqueFileName(customerName, extension, takenNames),
        url: URL.createObjectURL(blob),
        thumbnailUrl,
        size: blob.size,
        blob,
      });

      // Pick how each file is made: images in the browser; videos on the local FFmpeg server when
      // it's running and has the video, otherwise in the browser.
      let engine: ExportEngine = 'browser';
      let render: (customerName: string, overlay: HTMLCanvasElement, onProgress: (f: number) => void) => Promise<RenderedFile>;

      if (source.kind === 'image') {
        const image = await loadImage(source.url).catch(() => {
          throw new ExportError('errImageUnreadable');
        });
        const output = imageOutputFor(source.mimeType);
        render = async (customerName, overlay) => {
          const result = await renderImageWithName(image, overlay, output);
          return asLocalFile(customerName, output.extension, result.blob, result.thumbnailUrl);
        };
      } else {
        let serverVideoId = source.serverVideoId;
        if (!serverVideoId && (await getServerStatus()).available && uploadRef.current) {
          serverVideoId = (await uploadRef.current)?.serverVideoId;
        }
        if (serverVideoId) {
          const videoId = serverVideoId;
          engine = 'server';
          render = async (customerName, overlay) => {
            const result = await renderOnServer(
              {
                batchId,
                videoId,
                customerName,
                overlayImageBase64: overlay.toDataURL('image/png'),
                // 0/0 means "the whole video" to the server, whatever its exact duration.
                timeStart: pos.showAlways ? 0 : pos.timeStart,
                timeEnd: pos.showAlways ? 0 : pos.timeEnd,
                fadeDuration: pos.showAlways ? 0 : pos.fadeDuration,
              },
              controller.signal
            );
            return { filename: result.filename, url: result.videoUrl, thumbnailUrl: result.thumbnailUrl, size: result.size };
          };
        } else {
          const browserEngine = await import('./utils/browserExport');
          const codec: VideoCodec = await browserEngine.pickVideoCodec(source.width, source.height);
          const videoBlob: Blob = source.file ?? (await fetch(source.url).then(res => res.blob()));
          render = async (customerName, overlay, onProgress) => {
            const result = await browserEngine.renderInBrowser({
              source: videoBlob,
              overlay,
              position: pos,
              codec,
              signal: controller.signal,
              onProgress,
            });
            return asLocalFile(customerName, 'mp4', result.blob, result.thumbnailUrl);
          };
        }
      }
      setBatch({ id: batchId, engine });

      for (let i = 0; i < queue.length && !controller.signal.aborted; i++) {
        const customerName = queue[i];
        const toPercent = (fraction: number) => Math.min(99, Math.round(((i + fraction) / queue.length) * 100));
        setProgress(p => ({ ...p, phase: 'rendering', current: i + 1, currentName: customerName, percent: toPercent(0) }));

        try {
          const overlay = await renderTextOverlay(customerName, style, pos, source.width, source.height);
          let lastPercent = -1;
          const file = await render(customerName, overlay, fraction => {
            const percent = toPercent(fraction);
            if (percent !== lastPercent) {
              lastPercent = percent;
              setProgress(p => ({ ...p, percent }));
            }
          });
          items.push({ id: `${batchId}_${i}`, kind: source.kind, customerName, ...file });
          setExportedItems([...items]);
        } catch (err) {
          if (controller.signal.aborted) break;
          // A problem with the file or the browser affects every name, so stop right away.
          if (err instanceof ExportError) throw err;
          console.error(`Render error for ${customerName}:`, err);
          failed.push({ customerName, error: err instanceof Error ? err.message : String(err) });
          setFailures([...failed]);
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error('Export failed:', err);
        setFatalError(
          err instanceof ExportError
            ? t(err.code)
            : t('unexpectedError', { message: err instanceof Error ? err.message : String(err) })
        );
      }
    } finally {
      const stopped = controller.signal.aborted;
      abortRef.current = null;
      setProgress(p => ({ ...p, phase: 'finished', percent: 100, stopped }));
      if (!stopped && items.length > 0) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const handleCancelExport = () => abortRef.current?.abort();

  const handleDownloadAll = async () => {
    if (!batch) return;
    if (batch.engine === 'server') {
      triggerDownload(serverZipUrl(batch.id), `Video_Invitations_${batch.id}.zip`);
    } else {
      const prefix = exportedItems[0]?.kind === 'image' ? 'Image' : 'Video';
      await downloadItemsAsZip(exportedItems, `${prefix}_Invitations.zip`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-8 py-6">
        <p className="text-base text-slate-300 mt-0 mb-6">{t('intro')}</p>

        {/* On phones the preview sits right after step 1; on large screens it stays on the right. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <VideoUploader
              media={media}
              previewFailed={previewFailed}
              onFileSelected={handleFileSelected}
              onLoadSample={handleLoadSample}
              sampleAvailable={serverStatus.sampleAvailable}
              isLoadingSample={isLoadingSample}
            />
          </div>

          <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-20">
            <VideoPreviewCanvas
              media={media}
              textStyle={textStyle}
              position={position}
              onPositionChange={updated => setPosition(prev => ({ ...prev, ...updated }))}
              previewName={previewName}
              nameCount={names.length}
              activeIndex={previewIndex}
              onActiveIndexChange={setActivePreviewIndex}
            />
          </div>

          <div className="lg:col-span-7 lg:col-start-1 lg:row-start-2 space-y-6">
            <CustomerListManager rawNamesText={rawNamesText} onRawNamesChange={setRawNamesText} nameCount={names.length} />

            <TypographyControls
              style={textStyle}
              onChange={updated => setTextStyle(prev => ({ ...prev, ...updated }))}
              position={position}
              onPositionChange={updated => setPosition(prev => ({ ...prev, ...updated }))}
              previewName={previewName}
              videoDuration={media?.kind === 'video' ? media.duration : null}
            />

            <ExportManager
              kind={media?.kind ?? 'video'}
              nameCount={names.length}
              missing={!media ? 'needVideo' : names.length === 0 ? 'needNames' : null}
              progress={progress}
              exportedItems={exportedItems}
              failures={failures}
              fatalError={fatalError}
              localNote={!serverStatus.available || media?.kind === 'image'}
              onStartExport={handleStartExport}
              onCancelExport={handleCancelExport}
              onDownloadAll={handleDownloadAll}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-400">
        <span className="font-semibold text-slate-200">Reel Invitation</span> •{' '}
        <span className="text-rose-400 font-semibold">{t('madeFor')}</span>
      </footer>
    </div>
  );
}

export default App;
