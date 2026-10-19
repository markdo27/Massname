import type { TextStyle, OverlayPosition } from '../types';

// Style sizes are defined for a 1080px wide video and scaled to the real video width.
export const REFERENCE_WIDTH = 1080;

export function buildFontSpec(style: TextStyle, fontSizePx: number): string {
  const fontStyle = style.isItalic ? 'italic' : 'normal';
  const fontWeight = style.isBold ? 'bold' : 'normal';
  return `${fontStyle} ${fontWeight} ${fontSizePx}px "${style.fontFamily}", sans-serif`;
}

export function displayName(name: string, style: TextStyle): string {
  return style.isUppercase ? name.toUpperCase() : name;
}

/**
 * Render the name onto a transparent canvas matching the exact video dimensions (e.g. 1080x1920).
 */
export async function renderTextOverlay(
  nameText: string,
  style: TextStyle,
  pos: OverlayPosition,
  videoWidth: number,
  videoHeight: number
): Promise<HTMLCanvasElement> {
  const scale = videoWidth / REFERENCE_WIDTH;
  const fontSize = style.fontSize * scale;
  const fontSpec = buildFontSpec(style, fontSize);
  const text = displayName(nameText, style);

  // Web fonts are split by character range (e.g. a separate Vietnamese file),
  // so explicitly load the glyphs this particular name needs before drawing.
  try {
    await document.fonts.load(fontSpec, text);
    await document.fonts.ready;
  } catch (e) {
    console.warn('Font loading check error:', e);
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  const lines = text.split('\n');
  // Draw around the name's anchor point so rotation turns it in place.
  ctx.translate((pos.xPercent / 100) * videoWidth, (pos.yPercent / 100) * videoHeight);
  ctx.rotate((pos.rotation * Math.PI) / 180);

  ctx.font = fontSpec;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${style.letterSpacing * scale}px`;
  }

  const lineHeight = fontSize * style.lineHeight;
  const totalTextHeight = lines.length * lineHeight;
  const startY = -totalTextHeight / 2 + lineHeight / 2;

  if (style.effect === 'ribbon') {
    const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const padX = 32 * scale;
    const padY = 16 * scale;
    const boxWidth = maxWidth + padX * 2;
    const boxHeight = totalTextHeight + padY * 2;
    const boxX = -boxWidth / 2;
    const boxY = -boxHeight / 2;

    ctx.save();
    ctx.fillStyle = style.ribbonBgColor;
    ctx.globalAlpha = style.ribbonOpacity;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16 * scale);
    ctx.fill();
    ctx.restore();
  }

  // Shadow offsets ignore the rotation, so shadows keep falling straight down like light from above.
  ctx.save();
  if (style.effect === 'soft') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 14 * scale;
    ctx.shadowOffsetX = 2 * scale;
    ctx.shadowOffsetY = 4 * scale;
  } else if (style.effect === 'cinematic') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 20 * scale;
    ctx.shadowOffsetX = 4 * scale;
    ctx.shadowOffsetY = 8 * scale;
  } else if (style.effect === 'glow') {
    ctx.shadowColor = style.color;
    ctx.shadowBlur = 24 * scale;
  }

  if (style.effect === 'outline') {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.lineWidth = 8 * scale;
    ctx.lineJoin = 'round';
    lines.forEach((line, idx) => ctx.strokeText(line, 0, startY + idx * lineHeight));
  }

  ctx.fillStyle = style.color;
  lines.forEach((line, idx) => ctx.fillText(line, 0, startY + idx * lineHeight));
  ctx.restore();

  return canvas;
}

/**
 * CSS equivalent of the canvas effects, for the live preview. `scale` is preview px per video px.
 * The preview element itself is rotated, so shadow offsets are turned back by `rotation` degrees
 * to keep them pointing straight down, exactly like the canvas.
 */
export function previewTextShadow(style: TextStyle, scale: number, rotation = 0): string {
  const px = (v: number) => `${(v * scale).toFixed(2)}px`;
  const rad = (rotation * Math.PI) / 180;
  const offset = (x: number, y: number) =>
    `${px(x * Math.cos(rad) + y * Math.sin(rad))} ${px(-x * Math.sin(rad) + y * Math.cos(rad))}`;
  switch (style.effect) {
    case 'soft':
      return `${offset(2, 4)} ${px(14)} rgba(0, 0, 0, 0.75)`;
    case 'cinematic':
      return `${offset(4, 8)} ${px(20)} rgba(0, 0, 0, 0.85)`;
    case 'glow':
      return `0 0 ${px(24)} ${style.color}`;
    case 'outline': {
      const o = px(4);
      const n = `-${o}`;
      return [`${n} ${n}`, `${o} ${n}`, `${n} ${o}`, `${o} ${o}`, `0 ${n}`, `0 ${o}`, `${n} 0`, `${o} 0`]
        .map(offset => `${offset} 0 rgba(0, 0, 0, 0.85)`)
        .join(', ');
    }
    default:
      return 'none';
  }
}
