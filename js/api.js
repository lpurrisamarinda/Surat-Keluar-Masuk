import { GAS_URL, showToast } from './utilities.js';

const TIMEOUT_MS = 15000;

function buildFetchOptions(payload) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } finally {
    window.clearTimeout(id);
  }
}

export async function login(username, password) {
  if (!GAS_URL) {
    throw new Error('URL Apps Script tidak dikonfigurasi.');
  }
  const payload = { action: 'login', username, password };
  return fetchWithTimeout(GAS_URL, buildFetchOptions(payload));
}

export async function fetchSheetData(sheetName) {
  if (!GAS_URL) {
    throw new Error('URL Apps Script tidak dikonfigurasi.');
  }
  const payload = { action: 'read', sheetName };
  return fetchWithTimeout(GAS_URL, buildFetchOptions(payload));
}

export async function saveSheetData(sheetName, record) {
  if (!GAS_URL) {
    throw new Error('URL Apps Script tidak dikonfigurasi.');
  }
  return fetchWithTimeout(GAS_URL, buildFetchOptions({ action: 'save', sheetName, record }));
}

export async function updateSheetData(sheetName, recordId, record) {
  if (!GAS_URL) {
    throw new Error('URL Apps Script tidak dikonfigurasi.');
  }
  return fetchWithTimeout(GAS_URL, buildFetchOptions({ action: 'update', sheetName, recordId, record }));
}

export async function deleteSheetData(sheetName, recordId) {
  if (!GAS_URL) {
    throw new Error('URL Apps Script tidak dikonfigurasi.');
  }
  return fetchWithTimeout(GAS_URL, buildFetchOptions({ action: 'delete', sheetName, recordId }));
}

export async function uploadFile(file) {
  if (!GAS_URL) {
    throw new Error('URL Apps Script tidak dikonfigurasi.');
  }
  const formData = new FormData();
  formData.append('action', 'upload');
  formData.append('file', file);
  const response = await fetch(GAS_URL, { method: 'POST', body: formData });
  if (!response.ok) {
    throw new Error('Upload file gagal.');
  }
  return response.json();
}

export async function pingBackend() {
  if (!GAS_URL) {
    return { ok: false, error: 'GAS_URL tidak diatur' };
  }
  try {
    const result = await fetchWithTimeout(GAS_URL, buildFetchOptions({ action: 'ping' }));
    return { ok: Boolean(result?.ok), result };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export function createLocalCacheKey(sheetName) {
  return `skm-cache-${sheetName}`;
}

export function saveLocalCache(sheetName, data) {
  localStorage.setItem(createLocalCacheKey(sheetName), JSON.stringify(data));
}

export function readLocalCache(sheetName) {
  try {
    const raw = localStorage.getItem(createLocalCacheKey(sheetName));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function handleApiError(error) {
  showToast(error?.message || 'Terjadi kesalahan jaringan.', 'error');
}
