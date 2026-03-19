import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MediaUploader } from '@/components/issues/media-uploader';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MediaUploader', () => {
  it('renders file input and upload button', () => {
    render(<MediaUploader projectId="p1" issueId="i1" onUpload={vi.fn()} urls={[]} />);
    expect(screen.getByLabelText(/choose file/i)).toBeInTheDocument();
  });

  it('shows error when file type is not allowed', async () => {
    render(<MediaUploader projectId="p1" issueId="i1" onUpload={vi.fn()} urls={[]} />);
    const input = screen.getByLabelText(/choose file/i);
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/not allowed/i));
  });

  it('calls onUpload with returned URL on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: { url: '/api/media/p1/i1/photo.png' } }),
    } as Response);

    const onUpload = vi.fn();
    render(<MediaUploader projectId="p1" issueId="i1" onUpload={onUpload} urls={[]} />);
    const input = screen.getByLabelText(/choose file/i);
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith('/api/media/p1/i1/photo.png'));
  });

  it('shows error when server returns failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({ success: false, error: 'File too large. Maximum size is 10MB' }),
    } as Response);

    render(<MediaUploader projectId="p1" issueId="i1" onUpload={vi.fn()} urls={[]} />);
    const input = screen.getByLabelText(/choose file/i);
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/too large/i));
  });

  it('renders image thumbnails for existing image URLs', () => {
    render(
      <MediaUploader
        projectId="p1"
        issueId="i1"
        onUpload={vi.fn()}
        urls={['/api/media/p1/i1/photo.png', '/api/media/p1/i1/shot.jpg']}
      />
    );
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', '/api/media/p1/i1/photo.png');
    expect(images[1]).toHaveAttribute('src', '/api/media/p1/i1/shot.jpg');
  });

  it('renders video elements for video URLs', () => {
    render(
      <MediaUploader
        projectId="p1"
        issueId="i1"
        onUpload={vi.fn()}
        urls={['/api/media/p1/i1/clip.mp4']}
      />
    );
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', '/api/media/p1/i1/clip.mp4');
  });

  it('disables input when disabled prop is true', () => {
    render(
      <MediaUploader projectId="p1" issueId="i1" onUpload={vi.fn()} urls={[]} disabled={true} />
    );
    const input = screen.getByLabelText(/choose file/i);
    expect(input).toBeDisabled();
  });

  it('shows error when file is too large', async () => {
    render(<MediaUploader projectId="p1" issueId="i1" onUpload={vi.fn()} urls={[]} />);
    const input = screen.getByLabelText(/choose file/i);
    // Create a file that reports as > 10MB
    const largeFile = new File(['x'], 'large.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [largeFile] } });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/too large/i));
  });

  it('clears error when a valid file is selected after an invalid one', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: { url: '/api/media/p1/i1/photo.png' } }),
    } as Response);

    render(<MediaUploader projectId="p1" issueId="i1" onUpload={vi.fn()} urls={[]} />);
    const input = screen.getByLabelText(/choose file/i);

    // First: invalid file triggers error
    fireEvent.change(input, {
      target: { files: [new File(['pdf'], 'doc.pdf', { type: 'application/pdf' })] },
    });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    // Then: valid file clears error
    fireEvent.change(input, {
      target: { files: [new File(['img'], 'photo.png', { type: 'image/png' })] },
    });
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('renders a remove button for each uploaded url', () => {
    render(
      <MediaUploader
        projectId="p1"
        issueId="i1"
        onUpload={vi.fn()}
        onRemove={vi.fn()}
        urls={['/api/media/p1/i1/photo.png', '/api/media/p1/i1/shot.jpg']}
      />
    );
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons).toHaveLength(2);
  });

  it('does not render remove buttons when onRemove is not provided', () => {
    render(
      <MediaUploader
        projectId="p1"
        issueId="i1"
        onUpload={vi.fn()}
        urls={['/api/media/p1/i1/photo.png']}
      />
    );
    expect(screen.queryAllByRole('button', { name: /remove/i })).toHaveLength(0);
  });

  it('file input has multiple attribute to allow selecting multiple files at once', () => {
    render(<MediaUploader projectId="p1" issueId="i1" onUpload={vi.fn()} urls={[]} />);
    expect(screen.getByLabelText(/choose file/i)).toHaveAttribute('multiple');
  });

  it('calls onUpload once for each file when multiple files are selected', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { url: '/api/media/p1/i1/a.png' } }),
      } as Response)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { url: '/api/media/p1/i1/b.png' } }),
      } as Response);

    const onUpload = vi.fn();
    render(<MediaUploader projectId="p1" issueId="i1" onUpload={onUpload} urls={[]} />);
    const input = screen.getByLabelText(/choose file/i);
    const files = [
      new File(['img1'], 'a.png', { type: 'image/png' }),
      new File(['img2'], 'b.png', { type: 'image/png' }),
    ];
    fireEvent.change(input, { target: { files } });
    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(2));
    expect(onUpload).toHaveBeenCalledWith('/api/media/p1/i1/a.png');
    expect(onUpload).toHaveBeenCalledWith('/api/media/p1/i1/b.png');
  });

  it('calls onRemove with the correct url when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <MediaUploader
        projectId="p1"
        issueId="i1"
        onUpload={vi.fn()}
        onRemove={onRemove}
        urls={['/api/media/p1/i1/photo.png']}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith('/api/media/p1/i1/photo.png');
  });
});
