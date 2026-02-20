// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

import { GET } from '../route';
import * as fsPromises from 'fs/promises';

const mockReadFile = vi.mocked(fsPromises.readFile);

function makeGetRequest(pathSegments: string[]) {
  return {
    request: new Request(`http://localhost/api/media/${pathSegments.join('/')}`),
    params: Promise.resolve({ path: pathSegments }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/media/[...path]', () => {
  it('returns 404 for non-existent file', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT: file not found'));
    const { request, params } = makeGetRequest(['proj1', 'issue1', 'missing.png']);
    const res = await GET(request as never, { params });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/not found/i);
  });

  it('returns correct Content-Type for PNG', async () => {
    const fakeBuffer = Buffer.from('fake-image-data');
    mockReadFile.mockResolvedValue(fakeBuffer as never);
    const { request, params } = makeGetRequest(['proj1', 'issue1', 'photo.png']);
    const res = await GET(request as never, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
  });

  it('returns correct Content-Type for JPEG', async () => {
    const fakeBuffer = Buffer.from('fake-jpeg-data');
    mockReadFile.mockResolvedValue(fakeBuffer as never);
    const { request, params } = makeGetRequest(['proj1', 'issue1', 'photo.jpg']);
    const res = await GET(request as never, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('returns correct Content-Type for WebP', async () => {
    const fakeBuffer = Buffer.from('fake-webp-data');
    mockReadFile.mockResolvedValue(fakeBuffer as never);
    const { request, params } = makeGetRequest(['proj1', 'issue1', 'image.webp']);
    const res = await GET(request as never, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/webp');
  });

  it('returns correct Content-Type for MP4', async () => {
    const fakeBuffer = Buffer.from('fake-video-data');
    mockReadFile.mockResolvedValue(fakeBuffer as never);
    const { request, params } = makeGetRequest(['proj1', 'issue1', 'video.mp4']);
    const res = await GET(request as never, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('video/mp4');
  });

  it('returns application/octet-stream for unknown extension', async () => {
    const fakeBuffer = Buffer.from('unknown data');
    mockReadFile.mockResolvedValue(fakeBuffer as never);
    const { request, params } = makeGetRequest(['proj1', 'issue1', 'file.xyz']);
    const res = await GET(request as never, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
  });

  it('prevents path traversal attack', async () => {
    // Mock readFile to avoid 'file not found' masking the result
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

    // Real attack: path segments that escape the media root
    const params = Promise.resolve({ path: ['..', '..', 'etc', 'passwd'] });
    const req = new Request('http://localhost/api/media/../../../etc/passwd');
    const res = await GET(req as never, { params });
    // Should return 400 (bad request), not 404
    expect(res.status).toBe(400);
  });
});
