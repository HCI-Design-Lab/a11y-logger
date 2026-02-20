import '@testing-library/jest-dom';

// JSDOM does not implement scrollIntoView; mock it to prevent Radix UI errors.
// Guard for node environment tests that don't have window.
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}
