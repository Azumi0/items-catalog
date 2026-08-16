import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET } from '@/app/api/images/[type]/[filename]/route';
import { saveImage, getImagePath } from '@/lib/storage';
import * as sessionLib from '@/lib/session';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const TEST_DIR = path.resolve(process.cwd(), 'tmp/test-images-route');

describe('Image Serving Route Handler Seam', () => {
  beforeEach(() => {
    process.env.DATA_DIR = TEST_DIR;
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    delete process.env.DATA_DIR;
  });

  it('returns 401 when session is not active', async () => {
    vi.spyOn(sessionLib, 'getCurrentUser').mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/images/originals/photo.jpg');
    const response = await GET(req, {
      params: Promise.resolve({ type: 'originals', filename: 'photo.jpg' }),
    });

    expect(response.status).toBe(401);
  });

  it('returns 404 when file does not exist', async () => {
    vi.spyOn(sessionLib, 'getCurrentUser').mockResolvedValue({
      id: '123',
      username: 'alice',
    });

    const req = new NextRequest('http://localhost:3000/api/images/originals/non-existent.jpg');
    const response = await GET(req, {
      params: Promise.resolve({ type: 'originals', filename: 'non-existent.jpg' }),
    });

    expect(response.status).toBe(404);
  });

  it('serves existing image with correct headers and content when authenticated', async () => {
    vi.spyOn(sessionLib, 'getCurrentUser').mockResolvedValue({
      id: '123',
      username: 'alice',
    });

    const imgBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
    }).webp().toBuffer();

    const saved = await saveImage(imgBuffer, 'sample.webp');

    const req = new NextRequest(`http://localhost:3000/api/images/thumbs/${saved.thumbFilename}`);
    const response = await GET(req, {
      params: Promise.resolve({ type: 'thumbs', filename: saved.thumbFilename }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/webp');
    expect(response.headers.get('Cache-Control')).toContain('private');
    expect(response.headers.get('Cache-Control')).toContain('max-age=86400');

    const arrayBuffer = await response.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(0);
  });

  it('serves HEIC image with correct image/heic Content-Type', async () => {
    vi.spyOn(sessionLib, 'getCurrentUser').mockResolvedValue({
      id: '123',
      username: 'alice',
    });

    const originalsDir = path.join(TEST_DIR, 'uploads/originals');
    fs.mkdirSync(originalsDir, { recursive: true });
    const dummyHeicPath = path.join(originalsDir, 'test-photo.heic');
    fs.writeFileSync(dummyHeicPath, Buffer.from('fake-heic-data'));

    const req = new NextRequest('http://localhost:3000/api/images/originals/test-photo.heic');
    const response = await GET(req, {
      params: Promise.resolve({ type: 'originals', filename: 'test-photo.heic' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/heic');
  });
});
