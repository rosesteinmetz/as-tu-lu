import imageCompression from 'browser-image-compression';

type CompressOptions = {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
};

const DEFAULTS: CompressOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 800,
  useWebWorker: true,
};

function roundTo8(n: number): number {
  return Math.round(n / 8) * 8;
}

async function enforceCanvasSize(file: File, maxDim: number): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = URL.createObjectURL(file);
  });

  let { width, height } = img;

  // scale longest side to maxDim
  if (width > height && width > maxDim) {
    height = (height / width) * maxDim;
    width = maxDim;
  } else if (height >= width && height > maxDim) {
    width = (width / height) * maxDim;
    height = maxDim;
  }

  // round to multiples of 8
  width = roundTo8(width);
  height = roundTo8(height);
  if (width < 8) width = 8;
  if (height < 8) height = 8;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(img.src);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Canvas toBlob failed'));
    }, file.type, 0.92);
  });

  return new File([blob], file.name, { type: file.type });
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const opts = { ...DEFAULTS, ...options };

  try {
    const compressed = await imageCompression(file, opts);
    return await enforceCanvasSize(compressed, opts.maxWidthOrHeight || 800);
  } catch {
    return file;
  }
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 100 * 1024 * 1024;
export const IMAGE_MAX_DIMENSION = 800;