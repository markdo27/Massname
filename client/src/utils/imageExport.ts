// Image export: draws the name onto a full-resolution copy of the invitation image.
// Runs entirely in the browser (no server, no encoder), so it works everywhere.

export interface ImageOutput {
  mimeType: 'image/jpeg' | 'image/png';
  extension: 'jpg' | 'png';
}

/** JPG stays JPG (smaller files); PNG, WebP and anything else become PNG (keeps transparency). */
export function imageOutputFor(mimeType: string): ImageOutput {
  return mimeType === 'image/jpeg' ? { mimeType: 'image/jpeg', extension: 'jpg' } : { mimeType: 'image/png', extension: 'png' };
}

export async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not encode the image'))), mimeType, 0.92)
  );
}

export async function renderImageWithName(
  image: HTMLImageElement,
  overlay: HTMLCanvasElement,
  output: ImageOutput
): Promise<{ blob: Blob; thumbnailUrl: string }> {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  if (output.mimeType === 'image/jpeg') {
    // JPG has no transparency: give see-through areas a white background instead of black.
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(image, 0, 0, width, height);
  ctx.drawImage(overlay, 0, 0, width, height);

  const thumb = document.createElement('canvas');
  thumb.width = 180;
  thumb.height = Math.max(1, Math.round((180 * height) / width));
  thumb.getContext('2d')?.drawImage(canvas, 0, 0, thumb.width, thumb.height);

  return { blob: await canvasToBlob(canvas, output.mimeType), thumbnailUrl: thumb.toDataURL('image/jpeg', 0.75) };
}
