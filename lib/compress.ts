import imageCompression from 'browser-image-compression';

type CompressOptions = {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
};

const DEFAULTS: CompressOptions = {
  maxSizeMB: 0.6,
  maxWidthOrHeight: 800,
  useWebWorker: true,
};

// WebP fait ~30-50 % plus léger qu'un JPEG de même qualité, et préserve l'alpha des PNG.
const WEBP_QUALITY = 0.8;
const JPEG_QUALITY = 0.85;

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

let encodeTypePromise: Promise<string> | null = null;

function detectEncodeType(): Promise<string> {
  if (!encodeTypePromise) {
    encodeTypePromise = new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        canvas.toBlob((blob) => resolve(blob ? 'image/webp' : 'image/jpeg'), 'image/webp', WEBP_QUALITY);
      } catch {
        resolve('image/jpeg');
      }
    });
  }
  return encodeTypePromise;
}

function withExtension(name: string, type: string): string {
  const ext = EXT_BY_TYPE[type];
  if (!ext) return name;
  const base = name.replace(/\.[^./\\]+$/, '');
  return `${base || 'image'}.${ext}`;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } catch {
      resolve(null);
    }
  });
}

function roundTo8(n: number): number {
  return Math.round(n / 8) * 8;
}

async function enforceCanvasSize(file: File, maxDim: number, encodeType: string): Promise<File> {
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

  // WebP d'abord, JPEG en secours si le navigateur ne sait pas encoder le WebP.
  const isWebp = encodeType === 'image/webp';
  let blob = await toBlob(canvas, encodeType, isWebp ? WEBP_QUALITY : JPEG_QUALITY);
  let type = encodeType;
  if (!blob) {
    blob = await toBlob(canvas, 'image/jpeg', JPEG_QUALITY);
    type = 'image/jpeg';
  }
  if (!blob) throw new Error('Canvas toBlob failed');

  const finalType = blob.type.startsWith('image/') ? blob.type : type;

  return new File([blob], withExtension(file.name, finalType), {
    type: finalType,
    lastModified: file.lastModified,
  });
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const encodeType = await detectEncodeType();
  const opts = { ...DEFAULTS, ...options, fileType: encodeType };

  try {
    const compressed = await imageCompression(file, opts);
    return await enforceCanvasSize(compressed, opts.maxWidthOrHeight || 800, encodeType);
  } catch {
    return file;
  }
}

export const MAX_IMAGE_SIZE = 100 * 1024 * 1024;
export const IMAGE_MAX_DIMENSION = 800;
