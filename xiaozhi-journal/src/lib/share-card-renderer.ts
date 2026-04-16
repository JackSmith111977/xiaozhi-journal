import QRCode from 'qrcode';

const CARD_PADDING = 24;
const ACCENT_BAR_HEIGHT = 4;
const HEADER_HEIGHT = 55;
const DIVIDER_HEIGHT = 24;
const DIVIDER_ACCENT_HEIGHT = 40;
const QUOTE_SECTION_HEIGHT = 110;
const FOOTER_HEIGHT = 64;
const QR_SIZE = 56;

interface ShareCardRenderOptions {
  date: string;
  moodEmoji: string;
  content: string;
  aiResponse: string;
  quote: string;
  width: number;
}

function getCardHeight(width: number, content: string, aiResponse: string): number {
  const usableWidth = width - CARD_PADDING * 2;
  const lineHeight = 22;
  const maxCharsPerLine = Math.floor(usableWidth / 14);

  const contentLines = Math.ceil(content.length / maxCharsPerLine);
  const responseLines = Math.ceil(aiResponse.length / maxCharsPerLine);

  const journalSection = 56 + Math.max(contentLines, 1) * lineHeight;
  const responseSection = 56 + Math.max(responseLines, 1) * lineHeight;

  return (
    ACCENT_BAR_HEIGHT +
    CARD_PADDING +
    HEADER_HEIGHT +
    CARD_PADDING +
    journalSection +
    DIVIDER_HEIGHT +
    responseSection +
    DIVIDER_ACCENT_HEIGHT +
    QUOTE_SECTION_HEIGHT +
    CARD_PADDING +
    FOOTER_HEIGHT
  );
}

async function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: QR_SIZE * 2,
    margin: 1,
    color: {
      dark: '#3D3D3D',
      light: '#FFFFFF',
    },
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const chars = text.split('');
  let line = '';
  let currentY = y;

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = chars[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export async function renderShareCardToCanvas(
  options: ShareCardRenderOptions
): Promise<HTMLCanvasElement | null> {
  const { date, moodEmoji, content, aiResponse, quote, width } = options;
  const dpr = 2;
  const logicalWidth = width;
  const logicalHeight = getCardHeight(logicalWidth, content, aiResponse);

  const canvas = document.createElement('canvas');
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(dpr, dpr);

  // Wait for fonts
  await document.fonts.load('italic 20px "Noto Serif SC"');
  await document.fonts.load('14px "Noto Sans SC"');

  let y = 0;

  // Background
  ctx.fillStyle = '#F5EDE4';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Accent gradient bar at top
  const gradient = ctx.createLinearGradient(0, 0, logicalWidth, 0);
  gradient.addColorStop(0, '#D4856A');
  gradient.addColorStop(0.6, '#E8C4A0');
  gradient.addColorStop(1, '#A8C5A0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, logicalWidth, ACCENT_BAR_HEIGHT);
  y = ACCENT_BAR_HEIGHT + CARD_PADDING;

  // Header: Brand + Date + Mood
  ctx.fillStyle = '#D4856A';
  ctx.font = 'bold 16px "Noto Serif SC", serif';
  ctx.textBaseline = 'top';
  ctx.fillText('Xiaozhi Journal', CARD_PADDING, y);

  ctx.fillStyle = '#8A817C';
  ctx.font = '11px "Noto Sans SC", sans-serif';
  const formattedDate = new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.textAlign = 'right';
  ctx.fillText(formattedDate, logicalWidth - CARD_PADDING, y);
  ctx.textAlign = 'left';

  // Mood emoji
  ctx.font = '16px sans-serif';
  ctx.fillText(moodEmoji, logicalWidth - CARD_PADDING, y + 16);

  y += HEADER_HEIGHT;

  // Journal section
  ctx.fillStyle = '#C8AB94';
  ctx.font = 'bold 10px "Noto Sans SC", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('我的日记', CARD_PADDING, y);
  y += 20;

  ctx.fillStyle = '#5A524D';
  ctx.font = '14px "Noto Sans SC", sans-serif';
  ctx.letterSpacing = 'normal';
  wrapText(ctx, content, CARD_PADDING, y, logicalWidth - CARD_PADDING * 2, 22);

  // Find where wrapText ended
  const maxCharsPerLine = Math.floor((logicalWidth - CARD_PADDING * 2) / 14);
  const contentLineCount = Math.ceil(content.length / maxCharsPerLine);
  y += 20 + Math.max(contentLineCount, 1) * 22 + DIVIDER_HEIGHT;

  // Divider
  ctx.strokeStyle = '#D4C5B9';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(CARD_PADDING, y);
  ctx.lineTo(logicalWidth - CARD_PADDING, y);
  ctx.stroke();
  y += DIVIDER_HEIGHT;

  // Response section
  ctx.fillStyle = '#C8AB94';
  ctx.font = 'bold 10px "Noto Sans SC", sans-serif';
  ctx.fillText('小知说', CARD_PADDING, y);
  y += 20;

  // Response bubble
  const bubblePadding = 14;
  const bubbleX = CARD_PADDING;
  const bubbleWidth = logicalWidth - CARD_PADDING * 2;
  const responseLineCount = Math.ceil(aiResponse.length / maxCharsPerLine);
  const bubbleHeight = 32 + Math.max(responseLineCount, 1) * 20;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  drawRoundedRect(ctx, bubbleX, y, bubbleWidth, bubbleHeight, 12);
  ctx.fill();

  // Response name
  ctx.fillStyle = '#D4856A';
  ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
  ctx.fillText('小知', bubbleX + bubblePadding, y + 8);

  // Response text
  ctx.fillStyle = '#5A524D';
  ctx.font = '13px "Noto Sans SC", sans-serif';
  wrapText(ctx, aiResponse, bubbleX + bubblePadding, y + 24, bubbleWidth - bubblePadding * 2, 20);

  y += bubbleHeight + DIVIDER_ACCENT_HEIGHT;

  // Divider accent (❝)
  ctx.fillStyle = '#D4C5B9';
  ctx.fillRect(CARD_PADDING, y - DIVIDER_ACCENT_HEIGHT / 2, logicalWidth * 0.35, 0.5);
  ctx.fillRect(CARD_PADDING + logicalWidth * 0.65, y - DIVIDER_ACCENT_HEIGHT / 2, logicalWidth * 0.35, 0.5);
  ctx.fillStyle = '#D4856A';
  ctx.font = '16px serif';
  ctx.textAlign = 'center';
  ctx.fillText('❝', logicalWidth / 2, y - DIVIDER_ACCENT_HEIGHT / 2 + 4);
  ctx.textAlign = 'left';
  y += DIVIDER_ACCENT_HEIGHT;

  // Quote section (hero)
  const quoteBoxPadding = 20;
  const quoteBoxHeight = QUOTE_SECTION_HEIGHT - CARD_PADDING;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  drawRoundedRect(ctx, CARD_PADDING, y, logicalWidth - CARD_PADDING * 2, quoteBoxHeight, 12);
  ctx.fill();

  // Accent left line
  ctx.fillStyle = '#D4856A';
  ctx.fillRect(CARD_PADDING + 4, y + 12, 3, quoteBoxHeight - 24);

  ctx.fillStyle = '#3D3D3D';
  ctx.font = 'italic 20px "Noto Serif SC", serif';
  wrapText(ctx, `"${quote}"`, CARD_PADDING + quoteBoxPadding + 8, y + 16, logicalWidth - CARD_PADDING * 2 - quoteBoxPadding * 2 - 8, 32);

  // Quote attribution
  ctx.fillStyle = '#8A817C';
  ctx.font = 'italic 11px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`— Xiaozhi Journal · ${formattedDate}`, logicalWidth - CARD_PADDING, y + quoteBoxHeight - 16);
  ctx.textAlign = 'left';

  y += quoteBoxHeight + CARD_PADDING;

  // Footer: QR code + branding
  try {
    const qrDataUrl = await generateQRDataUrl(window.location.origin);
    const qrImage = new Image();
    qrImage.src = qrDataUrl;
    await new Promise<void>((resolve) => {
      qrImage.onload = () => resolve();
      qrImage.onerror = () => resolve();
    });
    ctx.drawImage(qrImage, CARD_PADDING, y, QR_SIZE, QR_SIZE);
  } catch {
    // QR code generation failed, draw placeholder
    ctx.fillStyle = 'white';
    drawRoundedRect(ctx, CARD_PADDING, y, QR_SIZE, QR_SIZE, 6);
    ctx.fill();
    ctx.fillStyle = '#8A817C';
    ctx.font = '10px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QR', CARD_PADDING + QR_SIZE / 2, y + QR_SIZE / 2 + 3);
    ctx.textAlign = 'left';
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#D4856A';
  ctx.font = 'bold 13px "Noto Serif SC", serif';
  ctx.fillText('Xiaozhi Journal', logicalWidth - CARD_PADDING, y + 8);
  ctx.fillStyle = '#8A817C';
  ctx.font = '10px "Noto Sans SC", sans-serif';
  ctx.fillText('扫码记录你的感受', logicalWidth - CARD_PADDING, y + 26);
  ctx.textAlign = 'left';

  return canvas;
}

export function getShareCardWidth(containerWidth: number): number {
  return Math.min(containerWidth, 640);
}
