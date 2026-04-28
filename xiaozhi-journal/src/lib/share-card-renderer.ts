// Share card renderer stub
// Placeholder for quote/image sharing functionality

export interface ShareCardOptions {
  quote: string;
  background?: string;
  fontSize?: number;
}

export interface RenderCanvasOptions {
  date: string;
  moodEmoji: string;
  content: string;
  aiResponse: string;
  quote: string;
  width: number;
}

export async function renderShareCard(options: ShareCardOptions): Promise<string> {
  // Stub - returns placeholder image URL
  console.log('renderShareCard stub called');
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text>${options.quote}</text></svg>`;
}

export async function renderShareCardToCanvas(
  options: RenderCanvasOptions | string,
  canvas?: HTMLCanvasElement
): Promise<HTMLCanvasElement | null> {
  // Stub - accepts object or string, returns null or placeholder canvas
  console.log('renderShareCardToCanvas stub called');

  // Create a placeholder canvas if none provided
  const resultCanvas = canvas || document.createElement('canvas');

  // Set basic dimensions
  const width = typeof options === 'object' ? options.width : 300;
  resultCanvas.width = width;
  resultCanvas.height = 200;

  // Draw placeholder content
  const ctx = resultCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FDF8F5';
    ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
    ctx.fillStyle = '#D4856A';
    ctx.font = '16px sans-serif';
    const text = typeof options === 'object' ? options.quote : options;
    ctx.fillText(text.substring(0, 50), 20, 100);
  }

  return resultCanvas;
}

export function downloadShareCard(imageUrl: string): void {
  // Stub - no actual download
  console.log('downloadShareCard stub called');
}