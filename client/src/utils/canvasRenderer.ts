import type { TextStyle, OverlayPosition } from '../types';

/**
 * Render text overlay onto a canvas matching exact video dimensions (e.g. 1080x1920)
 * Returns a high-res transparent PNG Data URL.
 */
export async function renderTextOverlayToDataUrl(
  nameText: string,
  style: TextStyle,
  pos: OverlayPosition,
  videoWidth: number = 1080,
  videoHeight: number = 1920
): Promise<string> {
  // Ensure fonts are ready
  try {
    await document.fonts.ready;
  } catch (e) {
    console.warn('Font loading check error:', e);
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.clearRect(0, 0, videoWidth, videoHeight);

  // Formatting text
  let displayText = nameText;
  if (style.isUppercase) {
    displayText = displayText.toUpperCase();
  }

  const lines = displayText.split('\n');

  // Calculate target coordinates based on percentages
  const targetX = (pos.xPercent / 100) * videoWidth;
  const targetY = (pos.yPercent / 100) * videoHeight;

  // Font setup
  const fontStyle = style.isItalic ? 'italic' : 'normal';
  const fontWeight = style.isBold ? 'bold' : 'normal';
  const fontSize = style.fontSize;
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${style.fontFamily}", sans-serif`;
  ctx.textAlign = style.alignment;
  ctx.textBaseline = 'middle';

  // Apply letter spacing if supported
  if ('letterSpacing' in ctx && typeof (ctx as any).letterSpacing === 'string') {
    (ctx as any).letterSpacing = `${style.letterSpacing}px`;
  }

  const lineHeight = fontSize * style.lineHeight;
  const totalTextHeight = lines.length * lineHeight;
  const startY = targetY - (totalTextHeight / 2) + (lineHeight / 2);

  // If ribbon background is enabled, measure and draw background box first
  if (style.shadowType === 'ribbon') {
    let maxWidth = 0;
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxWidth) maxWidth = metrics.width;
    });

    const padX = style.ribbonPaddingX;
    const padY = style.ribbonPaddingY;
    const boxWidth = maxWidth + padX * 2;
    const boxHeight = totalTextHeight + padY * 2;

    let boxX = targetX - (boxWidth / 2);
    if (style.alignment === 'left') boxX = targetX - padX;
    if (style.alignment === 'right') boxX = targetX - maxWidth - padX;
    const boxY = targetY - (boxHeight / 2);

    ctx.save();
    ctx.fillStyle = style.ribbonBgColor;
    ctx.globalAlpha = style.ribbonOpacity;
    const rad = style.ribbonBorderRadius;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, rad);
      ctx.fill();
    } else {
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    }
    ctx.restore();
  }

  // Draw shadow if not ribbon
  ctx.save();
  if (style.shadowType === 'soft') {
    ctx.shadowColor = style.shadowColor || 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = style.shadowBlur || 12;
    ctx.shadowOffsetX = style.shadowOffsetX || 2;
    ctx.shadowOffsetY = style.shadowOffsetY || 4;
  } else if (style.shadowType === 'cinematic') {
    ctx.shadowColor = style.shadowColor || 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = style.shadowBlur || 20;
    ctx.shadowOffsetX = style.shadowOffsetX || 4;
    ctx.shadowOffsetY = style.shadowOffsetY || 8;
  } else if (style.shadowType === 'glow') {
    ctx.shadowColor = style.shadowColor || 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = style.shadowBlur || 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Outline stroke if outline type
  if (style.shadowType === 'outline') {
    ctx.strokeStyle = style.shadowColor || '#000000';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    lines.forEach((line, idx) => {
      const lineY = startY + idx * lineHeight;
      ctx.strokeText(line, targetX, lineY);
    });
  }

  // Draw filled text
  ctx.fillStyle = style.color;
  lines.forEach((line, idx) => {
    const lineY = startY + idx * lineHeight;
    ctx.fillText(line, targetX, lineY);
  });

  ctx.restore();

  return canvas.toDataURL('image/png');
}
