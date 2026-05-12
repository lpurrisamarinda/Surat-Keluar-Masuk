export const APP_NAME = window.__APP_NAME__ || 'Surat Keluar & Masuk';
export const GAS_URL = window.__GAS_URL__ || '';

export function formatDate(value, options = { year: 'numeric', month: 'short', day: '2-digit' }) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', options);
}

export function formatInputText(value) {
  return String(value || '').trim();
}

export function generateId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidMailNumber(value) {
  if (!value) return false;
  const normalized = String(value).trim();
  return /^\d{1,4}(\/[A-Za-z0-9-]+)*$/.test(normalized);
}

export function debounce(callback, delay = 250) {
  let timerId;
  return (...args) => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => callback(...args), delay);
  };
}

export function sanitize(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

export function formatFileSize(bytes) {
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function showToast(message, type = 'success', duration = 3200) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const resolvedType = ['success', 'error', 'warn'].includes(type) ? type : 'warn';
  toast.textContent = message;
  toast.className = `toast toast-${resolvedType} show`;
  window.clearTimeout(toast.dataset.timeout);
  toast.dataset.timeout = window.setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}
