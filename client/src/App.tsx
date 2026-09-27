import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { VideoUploader } from './components/VideoUploader';
import { CustomerListManager } from './components/CustomerListManager';
import { TypographyControls } from './components/TypographyControls';
import { VideoPreviewCanvas } from './components/VideoPreviewCanvas';
import { ExportManager } from './components/ExportManager';
import type { VideoData, TextStyle, OverlayPosition, ExportedItem, BatchProgress } from './types';
import { renderTextOverlayToDataUrl } from './utils/canvasRenderer';
import { SAMPLE_NAMES } from './constants/fonts';

export function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sampleAvailable, setSampleAvailable] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Video State
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Customer List State (Names only)
  const [rawNamesText, setRawNamesText] = useState(SAMPLE_NAMES.slice(0, 5).join('\n'));
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // Typography State (Default to Playfair Display)
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontFamily: 'Playfair Display',
    fontSize: 72,
    color: '#D4AF37', // Imperial Gold
    isBold: false,
    isItalic: false,
    isUppercase: false,
    alignment: 'center',
    letterSpacing: 2,
    lineHeight: 1.2,
    shadowType: 'soft',
    shadowColor: 'rgba(0, 0, 0, 0.75)',
    shadowBlur: 14,
    shadowOffsetX: 2,
    shadowOffsetY: 4,
    ribbonBgColor: '#000000',
    ribbonOpacity: 0.6,
    ribbonPaddingX: 32,
    ribbonPaddingY: 16,
    ribbonBorderRadius: 16
  });
  const [isUploadingFont] = useState(false);

  // Positioning & Timing State
  const [position, setPosition] = useState<OverlayPosition>({
    xPercent: 50,
    yPercent: 70, // Standard elegant lower third
    timeStart: 0,
    timeEnd: 10,
    showAlways: true,
    fadeDuration: 0.5
  });

  // Export State
  const [batchId, setBatchId] = useState(`batch_${Date.now()}`);
  const [progress, setProgress] = useState<BatchProgress>({
    isRendering: false,
    total: 0,
    current: 0,
    currentName: '',
    percent: 0,
    batchId: '',
    failedCount: 0
  });
  const [exportedItems, setExportedItems] = useState<ExportedItem[]>([]);
  const cancelExportRef = useRef(false);

  // Step 1 to 5 ref anchors
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);

  // Check server status on mount
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        setSampleAvailable(data.sampleAvailable || false);
      })
      .catch(() => {});
  }, []);

  // Compute customer names list
  const parsedNames = useMemo(() => {
    return rawNamesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }, [rawNamesText]);

  // Keep active preview name in bounds
  const activeCustomerName = parsedNames[activePreviewIndex] || parsedNames[0] || 'Customer Name';

  // Load sample desktop video directly
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const res = await fetch('/api/load-sample', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setVideoData(data);
        setPosition(prev => ({
          ...prev,
          timeEnd: Math.round(data.duration) || 10
        }));
        setCurrentStep(2);
      } else {
        alert(data.error || 'Failed to load desktop sample');
      }
    } catch (err: any) {
      alert('Error loading sample: ' + err.message);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Upload video with instant browser preview and fallback
  const handleVideoSelected = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(20);

    // 1. Instant client-side preview & metadata probe
    const localUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = localUrl;

    const browserMeta = await new Promise<Partial<VideoData>>((resolve) => {
      tempVideo.onloadedmetadata = () => {
        resolve({
          width: tempVideo.videoWidth || 1080,
          height: tempVideo.videoHeight || 1920,
          duration: tempVideo.duration || 10,
          fps: 30,
          hasAudio: true,
          size: file.size
        });
      };
      tempVideo.onerror = () => {
        resolve({ width: 1080, height: 1920, duration: 10, fps: 30, hasAudio: true, size: file.size });
      };
    });

    const localVideoData: VideoData = {
      videoId: `local_${Date.now()}`,
      originalName: file.name,
      filename: file.name,
      url: localUrl,
      width: browserMeta.width || 1080,
      height: browserMeta.height || 1920,
      duration: Math.round((browserMeta.duration || 10) * 100) / 100,
      fps: browserMeta.fps || 30,
      hasAudio: browserMeta.hasAudio ?? true,
      size: file.size
    };

    setVideoData(localVideoData);
    setPosition(prev => ({
      ...prev,
      timeEnd: Math.round(localVideoData.duration) || 10
    }));
    setCurrentStep(2);

    // 2. Background upload to local server if available
    try {
      setUploadProgress(50);
      const formData = new FormData();
      formData.append('video', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setVideoData(data);
      }
      setUploadProgress(100);
    } catch (_) {
      // Graceful offline/static mode (e.g. GitHub Pages)
      setUploadProgress(100);
    } finally {
      setIsUploading(false);
    }
  };

  // Custom font uploaded
  const handleCustomFontUploaded = (fontFamily: string, fontUrl: string) => {
    setTextStyle(prev => ({
      ...prev,
      fontFamily,
      customFontUrl: fontUrl
    }));
  };

  // Scroll to step
  const handleStepClick = (stepNum: number) => {
    setCurrentStep(stepNum);
    const refs: Record<number, React.RefObject<HTMLDivElement | null>> = {
      1: step1Ref,
      2: step2Ref,
      3: step3Ref,
      4: step4Ref,
      5: step5Ref
    };
    refs[stepNum]?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Batch Export execution
  const handleStartExport = async (quality: 'high' | 'balanced' | 'fast') => {
    if (!videoData || parsedNames.length === 0) return;

    const newBatchId = `batch_${Date.now()}`;
    setBatchId(newBatchId);
    cancelExportRef.current = false;
    setExportedItems([]);

    setProgress({
      isRendering: true,
      total: parsedNames.length,
      current: 0,
      currentName: parsedNames[0],
      percent: 0,
      batchId: newBatchId,
      failedCount: 0
    });

    const renderedList: ExportedItem[] = [];

    for (let i = 0; i < parsedNames.length; i++) {
      if (cancelExportRef.current) break;

      const customerName = parsedNames[i];
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentName: customerName,
        percent: Math.round((i / parsedNames.length) * 100)
      }));

      try {
        // 1. Render high-res 1080x1920 overlay PNG on client canvas
        const overlayDataUrl = await renderTextOverlayToDataUrl(
          customerName,
          textStyle,
          position,
          videoData.width,
          videoData.height
        );

        // 2. Post to server for FFmpeg hardware overlay
        const res = await fetch('/api/render-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batchId: newBatchId,
            videoId: videoData.videoId,
            customerName,
            overlayImageBase64: overlayDataUrl,
            timeStart: position.showAlways ? 0 : position.timeStart,
            timeEnd: position.showAlways ? videoData.duration : position.timeEnd,
            fadeDuration: position.showAlways ? 0 : position.fadeDuration,
            quality
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          const item: ExportedItem = {
            id: `item_${i}_${Date.now()}`,
            customerName: data.customerName,
            filename: data.filename,
            videoUrl: data.videoUrl,
            thumbnailUrl: data.thumbnailUrl,
            size: data.size,
            renderTime: data.renderTime
          };
          renderedList.push(item);
          setExportedItems([...renderedList]);
        } else {
          console.error(`Failed rendering ${customerName}:`, data.error);
        }
      } catch (err) {
        console.error(`Render error for ${customerName}:`, err);
      }
    }

    setProgress(prev => ({
      ...prev,
      isRendering: false,
      percent: 100
    }));

    if (!cancelExportRef.current && renderedList.length > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Scroll to step 5
      step5Ref.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelExport = () => {
    cancelExportRef.current = true;
    setProgress(prev => ({ ...prev, isRendering: false }));
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Header */}
      <Header
        currentStep={currentStep}
        onStepClick={handleStepClick}
        hasVideo={videoData !== null}
        customerCount={parsedNames.length}
        sampleAvailable={sampleAvailable}
        onLoadSample={handleLoadSample}
        isLoadingSample={isLoadingSample}
      />

      {/* Main Content: Split Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Configuration Stepper (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Upload Video */}
            <div ref={step1Ref}>
              <VideoUploader
                videoData={videoData}
                onVideoSelected={handleVideoSelected}
                onLoadSample={handleLoadSample}
                sampleAvailable={sampleAvailable}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
            </div>

            {/* Step 2: Customer List */}
            <div ref={step2Ref}>
              <CustomerListManager
                rawNamesText={rawNamesText}
                onRawNamesChange={setRawNamesText}
                parsedNames={parsedNames}
                activePreviewName={activeCustomerName}
                onSelectPreviewName={(name) => {
                  const idx = parsedNames.indexOf(name);
                  if (idx !== -1) setActivePreviewIndex(idx);
                }}
              />
            </div>

            {/* Step 3: Typography & Style */}
            <div ref={step3Ref}>
              <TypographyControls
                style={textStyle}
                onChange={(updated) => setTextStyle(prev => ({ ...prev, ...updated }))}
                onCustomFontUploaded={handleCustomFontUploaded}
                isUploadingFont={isUploadingFont}
              />
            </div>

            {/* Step 5: Mass Export */}
            <div ref={step5Ref}>
              <ExportManager
                videoData={videoData}
                customerNames={parsedNames}
                progress={progress}
                exportedItems={exportedItems}
                onStartExport={handleStartExport}
                onCancelExport={handleCancelExport}
                batchId={batchId}
              />
            </div>

          </div>

          {/* RIGHT COLUMN: Sticky 9:16 Video Preview Canvas (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4" ref={step4Ref}>
            <VideoPreviewCanvas
              videoData={videoData}
              textStyle={textStyle}
              position={position}
              onPositionChange={(updated) => setPosition(prev => ({ ...prev, ...updated }))}
              activeCustomerName={activeCustomerName}
              customerNames={parsedNames}
              onSelectCustomerName={(name) => {
                const idx = parsedNames.indexOf(name);
                if (idx !== -1) setActivePreviewIndex(idx);
              }}
            />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-400">
        <span className="font-semibold text-slate-200">Reel Invitation</span> • <span className="text-rose-400 font-semibold">Made for BLK.HN</span>
      </footer>
    </div>
  );
}

export default App;
