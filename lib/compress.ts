import imageCompression from 'browser-image-compression';

type CompressOptions = {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
};

const DEFAULTS: CompressOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const opts = { ...DEFAULTS, ...options };

  try {
    const compressed = await imageCompression(file, opts);
    return new File([compressed], file.name, { type: compressed.type });
  } catch {
    return file;
  }
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
