import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getImagePath } from '@/lib/storage';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; filename: string }> }
) {
  // 1. Session verification
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { type, filename } = await context.params;

  // 2. Validate type
  if (type !== 'originals' && type !== 'thumbs') {
    return new NextResponse('Invalid image type', { status: 400 });
  }

  // 3. Security sanitize filename (prevent path traversal)
  const safeFilename = path.basename(filename);
  const filePath = getImagePath(type, safeFilename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const stat = await fs.promises.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const nodeStream = fs.createReadStream(filePath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=86400',
        'Content-Length': stat.size.toString(),
      },
    });
  } catch (err) {
    console.error('Error reading image file:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
