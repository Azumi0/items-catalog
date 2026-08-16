import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

export function getDataDir(): string {
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }
  if (fs.existsSync('/data')) {
    return '/data';
  }
  return path.resolve(process.cwd(), 'data');
}

export function getUploadDirs() {
  const dataDir = getDataDir();
  const originalsDir = path.join(dataDir, 'uploads', 'originals');
  const thumbsDir = path.join(dataDir, 'uploads', 'thumbs');

  if (!fs.existsSync(originalsDir)) {
    fs.mkdirSync(originalsDir, { recursive: true });
  }
  if (!fs.existsSync(thumbsDir)) {
    fs.mkdirSync(thumbsDir, { recursive: true });
  }

  return { originalsDir, thumbsDir };
}

export function getImagePath(type: 'originals' | 'thumbs', filename: string): string {
  const { originalsDir, thumbsDir } = getUploadDirs();
  const dir = type === 'originals' ? originalsDir : thumbsDir;
  return path.join(dir, path.basename(filename));
}

export async function saveImage(
  buffer: Buffer,
  originalFilename: string
): Promise<{ filename: string; thumbFilename: string }> {
  const { originalsDir, thumbsDir } = getUploadDirs();
  const id = crypto.randomUUID();
  const rawExt = path.extname(originalFilename).toLowerCase();
  const ext = rawExt && ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.avif'].includes(rawExt)
    ? rawExt
    : '.jpg';

  const filename = `${id}${ext}`;
  const thumbFilename = `${id}.webp`;

  const originalPath = path.join(originalsDir, filename);
  const thumbPath = path.join(thumbsDir, thumbFilename);

  // Write original image
  await fs.promises.writeFile(originalPath, buffer);

  // Generate thumbnail with Sharp (max 400x400 WebP)
  await sharp(buffer)
    .resize(400, 400, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  return { filename, thumbFilename };
}

export async function deleteImage(filename: string, thumbFilename?: string): Promise<void> {
  const { originalsDir, thumbsDir } = getUploadDirs();
  const originalPath = path.join(originalsDir, path.basename(filename));
  if (fs.existsSync(originalPath)) {
    try {
      await fs.promises.unlink(originalPath);
    } catch {
      // ignore
    }
  }

  const thumbNameToDelete =
    thumbFilename || `${path.parse(filename).name}.webp`;
  const thumbPath = path.join(thumbsDir, path.basename(thumbNameToDelete));
  if (fs.existsSync(thumbPath)) {
    try {
      await fs.promises.unlink(thumbPath);
    } catch {
      // ignore
    }
  }
}

export async function deleteItemFiles(
  mainImage: string,
  additionalImages: string[] = []
): Promise<void> {
  if (mainImage) {
    await deleteImage(mainImage);
  }
  for (const img of additionalImages) {
    if (img) {
      await deleteImage(img);
    }
  }
}
