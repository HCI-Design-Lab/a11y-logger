// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from '../route';

function makeRequest(overrides: { file?: File; projectId?: string; issueId?: string } = {}) {
  const file = overrides.file ?? new File(['hello'], 'test.png', { type: 'image/png' });
  const fd = new FormData();
  fd.append('file', file);
  fd.append('projectId', overrides.projectId ?? 'proj1');
  fd.append('issueId', overrides.issueId ?? 'issue1');
  return new Request('http://localhost/api/media/upload', {
    method: 'POST',
    body: fd,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/media/upload', () => {
  it('returns 400 if no file provided', async () => {
    const fd = new FormData();
    fd.append('projectId', 'proj1');
    fd.append('issueId', 'issue1');
    const req = new Request('http://localhost/api/media/upload', { method: 'POST', body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/no file/i);
  });

  it('rejects disallowed MIME types', async () => {
    const file = new File(['pdf content'], 'doc.pdf', { type: 'application/pdf' });
    const res = await POST(makeRequest({ file }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/not allowed/i);
  });

  it('rejects files larger than 10MB', async () => {
    // Create a file object with a large size by overriding the size property
    const bigContent = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = new File([bigContent], 'big.png', { type: 'image/png' });
    const res = await POST(makeRequest({ file }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/too large/i);
  });

  it('accepts a valid image and returns success with URL', async () => {
    const file = new File(['image data'], 'photo.png', { type: 'image/png' });
    const res = await POST(makeRequest({ file }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toMatch(/^\/api\/media\/proj1\/issue1\/photo\.png$/);
  });

  it('sanitizes filenames with path separators', async () => {
    const file = new File(['evil'], '../../evil.sh', { type: 'image/png' });
    const res = await POST(makeRequest({ file }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Path traversal sequences must be removed — the URL must not contain '..'
    expect(body.data.url).not.toContain('..');
    // The resulting safe URL must be a predictable flat path under the media root
    expect(body.data.url).toMatch(/^\/api\/media\/proj1\/issue1\/[^/]+$/);
  });

  it('returns 400 if projectId is missing', async () => {
    const fd = new FormData();
    fd.append('file', new File(['hello'], 'test.png', { type: 'image/png' }));
    fd.append('issueId', 'issue1');
    const req = new Request('http://localhost/api/media/upload', { method: 'POST', body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/projectId and issueId/i);
  });

  it('writes the file to disk', async () => {
    const { writeFile, mkdir } = await import('fs/promises');
    const file = new File(['image data'], 'photo.png', { type: 'image/png' });
    await POST(makeRequest({ file }) as never);
    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
  });

  it('rejects malicious projectId with path traversal', async () => {
    const fd = new FormData();
    fd.append('file', new File(['hello'], 'test.png', { type: 'image/png' }));
    fd.append('projectId', '../../../tmp');
    fd.append('issueId', 'evil');
    const req = new Request('http://localhost/api/media/upload', { method: 'POST', body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    // writeFile should NOT have been called
    const { writeFile } = await import('fs/promises');
    expect(vi.mocked(writeFile)).not.toHaveBeenCalled();
  });

  it('returns 400 when issueId is missing', async () => {
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    const fd = new FormData();
    fd.append('file', file);
    fd.append('projectId', 'proj1');
    // issueId intentionally omitted
    const req = new Request('http://localhost/api/media/upload', { method: 'POST', body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });
});
