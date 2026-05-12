import { fetchSheetData, saveSheetData, updateSheetData, deleteSheetData, saveLocalCache, readLocalCache, createLocalCacheKey, handleApiError } from './api.js';
import { showToast, generateId, isValidMailNumber, formatDate } from './utilities.js';
import { createIncomingRecord, createOutgoingRecord, state, setIncoming, setOutgoing } from './data-manager.js';
import { validateAttachment, uploadAttachment } from './file-manager.js';

const LOCAL_SHEETS = {
  incoming: 'SuratMasuk',
  outgoing: 'SuratKeluar'
};

export async function loadInitialData() {
  const incomingCache = readLocalCache(LOCAL_SHEETS.incoming);
  const outgoingCache = readLocalCache(LOCAL_SHEETS.outgoing);

  setIncoming(Array.isArray(incomingCache) ? incomingCache : []);
  setOutgoing(Array.isArray(outgoingCache) ? outgoingCache : []);

  try {
    const incomingResponse = await fetchSheetData(LOCAL_SHEETS.incoming);
    const outgoingResponse = await fetchSheetData(LOCAL_SHEETS.outgoing);
    if (Array.isArray(incomingResponse.data)) {
      setIncoming(incomingResponse.data);
      saveLocalCache(LOCAL_SHEETS.incoming, incomingResponse.data);
    }
    if (Array.isArray(outgoingResponse.data)) {
      setOutgoing(outgoingResponse.data);
      saveLocalCache(LOCAL_SHEETS.outgoing, outgoingResponse.data);
    }
    return { incoming: state.incoming, outgoing: state.outgoing };
  } catch (error) {
    handleApiError(error);
    return { incoming: state.incoming, outgoing: state.outgoing };
  }
}

export function validateMailRecord(record, type = 'incoming') {
  const requiredFields = type === 'incoming'
    ? ['noSurat', 'tanggalMasuk', 'pengirim', 'perihal', 'sifatSurat', 'status']
    : ['noSurat', 'tanggalSurat', 'tujuanSurat', 'perihal', 'sifatSurat', 'status'];

  for (const field of requiredFields) {
    if (!record[field]) {
      throw new Error(`Field ${field} wajib diisi.`);
    }
  }

  if (!isValidMailNumber(record.noSurat)) {
    throw new Error('Format nomor surat tidak valid. Contoh: 001/XII/2026');
  }

  if (record.lampiran && record.lampiran.size) {
    const validation = validateAttachment(record.lampiran);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
  }

  return true;
}

export async function createIncoming(payload) {
  validateMailRecord(payload, 'incoming');
  const record = createIncomingRecord({ ...payload, id: payload.id || generateId('incoming') });

  try {
    if (payload.lampiran) {
      record.lampiran = await uploadAttachment(payload.lampiran);
    }
    const response = await saveSheetData(LOCAL_SHEETS.incoming, record);
    if (response?.success) {
      state.incoming.unshift(record);
      saveLocalCache(LOCAL_SHEETS.incoming, state.incoming);
      showToast('Surat masuk berhasil ditambahkan.', 'success');
      return record;
    }
    throw new Error(response?.message || 'Gagal menyimpan surat masuk.');
  } catch (error) {
    if (error.message.includes('GAS_URL')) {
      state.incoming.unshift(record);
      saveLocalCache(LOCAL_SHEETS.incoming, state.incoming);
      showToast('Surat masuk disimpan lokal dan akan disinkronkan nanti.', 'caut');
      return record;
    }
    handleApiError(error);
    throw error;
  }
}

export async function createOutgoing(payload) {
  validateMailRecord(payload, 'outgoing');
  const record = createOutgoingRecord({ ...payload, id: payload.id || generateId('outgoing') });

  try {
    if (payload.lampiran) {
      record.lampiran = await uploadAttachment(payload.lampiran);
    }
    const response = await saveSheetData(LOCAL_SHEETS.outgoing, record);
    if (response?.success) {
      state.outgoing.unshift(record);
      saveLocalCache(LOCAL_SHEETS.outgoing, state.outgoing);
      showToast('Surat keluar berhasil ditambahkan.', 'success');
      return record;
    }
    throw new Error(response?.message || 'Gagal menyimpan surat keluar.');
  } catch (error) {
    if (error.message.includes('GAS_URL')) {
      state.outgoing.unshift(record);
      saveLocalCache(LOCAL_SHEETS.outgoing, state.outgoing);
      showToast('Surat keluar disimpan lokal dan akan disinkronkan nanti.', 'caut');
      return record;
    }
    handleApiError(error);
    throw error;
  }
}

export async function updateRecord(type, id, payload) {
  const sheetName = LOCAL_SHEETS[type];
  if (!sheetName) throw new Error('Tipe tidak valid');

  validateMailRecord(payload, type);
  const record = type === 'incoming'
    ? createIncomingRecord({ ...payload, id })
    : createOutgoingRecord({ ...payload, id });

  try {
    const response = await updateSheetData(sheetName, id, record);
    if (response?.success) {
      const list = state[type];
      const index = list.findIndex((item) => item.id === id);
      if (index >= 0) {
        list[index] = record;
      }
      saveLocalCache(sheetName, list);
      showToast('Data berhasil diperbarui.', 'success');
      return record;
    }
    throw new Error(response?.message || 'Gagal memperbarui data.');
  } catch (error) {
    if (error.message.includes('GAS_URL') || error.message.includes('tidak dikonfigurasi')) {
      const list = state[type];
      const index = list.findIndex((item) => item.id === id);
      if (index >= 0) {
        list[index] = record;
        saveLocalCache(sheetName, list);
        showToast('Perubahan disimpan lokal dan akan disinkronkan nanti.', 'caut');
        return record;
      }
    }
    handleApiError(error);
    throw error;
  }
}

export async function deleteRecord(type, id) {
  const sheetName = LOCAL_SHEETS[type];
  if (!sheetName) throw new Error('Tipe tidak valid');

  try {
    const response = await deleteSheetData(sheetName, id);
    if (response?.success) {
      const list = state[type];
      setIncoming(type === 'incoming' ? list.filter((item) => item.id !== id) : state.incoming);
      setOutgoing(type === 'outgoing' ? list.filter((item) => item.id !== id) : state.outgoing);
      saveLocalCache(sheetName, state[type]);
      showToast('Data berhasil dihapus.', 'success');
      return true;
    }
    throw new Error(response?.message || 'Gagal menghapus data.');
  } catch (error) {
    if (error.message.includes('GAS_URL') || error.message.includes('tidak dikonfigurasi')) {
      const list = state[type];
      const filtered = list.filter((item) => item.id !== id);
      if (type === 'incoming') {
        setIncoming(filtered);
      } else {
        setOutgoing(filtered);
      }
      saveLocalCache(sheetName, filtered);
      showToast('Penghapusan disimpan lokal dan akan disinkronkan nanti.', 'caut');
      return true;
    }
    handleApiError(error);
    throw error;
  }
}

export function getLocalBackup(type) {
  const sheetName = LOCAL_SHEETS[type];
  return readLocalCache(sheetName);
}
