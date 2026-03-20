import { render, screen, fireEvent } from '@testing-library/react';
import { MediaGallery } from '@/components/issues/media-gallery';

const IMAGE_URLS = ['/api/media/p1/i1/photo.png', '/api/media/p1/i1/shot.jpg'];

describe('MediaGallery', () => {
  it('renders nothing when urls is empty', () => {
    const { container } = render(<MediaGallery urls={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a thumbnail button for each url', () => {
    render(<MediaGallery urls={IMAGE_URLS} />);
    expect(screen.getAllByRole('button', { name: /open/i })).toHaveLength(2);
  });

  it('opens the dialog when a thumbnail is clicked', () => {
    render(<MediaGallery urls={IMAGE_URLS} />);
    fireEvent.click(screen.getByRole('button', { name: /open photo\.png/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows the filename caption in the dialog', () => {
    render(<MediaGallery urls={IMAGE_URLS} />);
    fireEvent.click(screen.getByRole('button', { name: /open photo\.png/i }));
    expect(screen.getAllByText('photo.png')).toHaveLength(2);
  });

  it('shows prev and next buttons when there are multiple items', () => {
    render(<MediaGallery urls={IMAGE_URLS} />);
    fireEvent.click(screen.getByRole('button', { name: /open photo\.png/i }));
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('does not show prev/next buttons with a single item', () => {
    render(<MediaGallery urls={[IMAGE_URLS[0]!]} />);
    fireEvent.click(screen.getByRole('button', { name: /open photo\.png/i }));
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  });

  it('navigates to the next item when Next is clicked', () => {
    render(<MediaGallery urls={IMAGE_URLS} />);
    fireEvent.click(screen.getByRole('button', { name: /open photo\.png/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getAllByText('shot.jpg')).toHaveLength(2);
  });

  it('navigates to the previous item when Prev is clicked', () => {
    render(<MediaGallery urls={IMAGE_URLS} />);
    fireEvent.click(screen.getByRole('button', { name: /open shot\.jpg/i }));
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getAllByText('photo.png')).toHaveLength(2);
  });

  it('wraps from the last item to the first on Next', () => {
    render(<MediaGallery urls={IMAGE_URLS} />);
    fireEvent.click(screen.getByRole('button', { name: /open shot\.jpg/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getAllByText('photo.png')).toHaveLength(2);
  });

  it('wraps from the first item to the last on Prev', () => {
    render(<MediaGallery urls={IMAGE_URLS} />);
    fireEvent.click(screen.getByRole('button', { name: /open photo\.png/i }));
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getAllByText('shot.jpg')).toHaveLength(2);
  });

  it('renders a video element for .mov urls in the thumbnail grid', () => {
    render(<MediaGallery urls={['/api/media/p1/i1/screen.mov']} />);
    expect(document.querySelector('video')).toBeInTheDocument();
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });

  it('renders a video element for .mov urls in the lightbox', () => {
    render(<MediaGallery urls={['/api/media/p1/i1/screen.mov']} />);
    fireEvent.click(screen.getByRole('button', { name: /open screen\.mov/i }));
    const videos = document.querySelectorAll('video');
    // thumbnail video + lightbox video
    expect(videos.length).toBeGreaterThanOrEqual(1);
    expect(document.querySelector('dialog img')).not.toBeInTheDocument();
  });

  it('navigates with arrow keys', () => {
    render(<MediaGallery urls={IMAGE_URLS} />);
    fireEvent.click(screen.getByRole('button', { name: /open photo\.png/i }));
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(screen.getAllByText('shot.jpg')).toHaveLength(2);
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    expect(screen.getAllByText('photo.png')).toHaveLength(2);
  });
});
