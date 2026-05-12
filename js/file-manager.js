import { formatFileSize, showToast } from './utilities.js';

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function isFileTypeAllowed(file) {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

export function isFileSizeAllowed(file) {
  return file.size <= MAX_FILE_SIZE;
}

export function validateAttachment(file) {
  if (!file) {
    return { valid: false, message: 'File belum dipilih.' };
  }
  if (!isFileTypeAllowed(file)) {
    return { valid: false, message: 'Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG.' };
  }
  if (!isFileSizeAllowed(file)) {
    return { valid: false, message: `Ukuran file maksimal ${formatFileSize(MAX_FILE_SIZE)}.` };
  }
  return { valid: true };
}

export function createFilePreview(file) {
  if (!file) return null;
  return URL.createObjectURL(file);
}

export function clearFileInput(input) {
  if (!input) return;
  input.value = '';
}

export async function uploadAttachment(file) {
  if (!file) {
    return null;
  }

  const validation = validateAttachment(file);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const reader = new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: fileReader.result
    });
    fileReader.onerror = () => reject(new Error('Gagal membaca file.'));
    fileReader.readAsDataURL(file);
  });

  return reader;
}
