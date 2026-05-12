import { debounce, formatDate, sanitize } from './utilities.js';

export const state = {
  incoming: [],
  outgoing: [],
  selectedItem: null,
  activeTab: 'incoming',
  filters: {
    incoming: { query: '', status: '', from: '', to: '' },
    outgoing: { query: '', status: '', from: '', to: '' }
  },
  sort: {
    incoming: { field: 'createdAt', direction: 'desc' },
    outgoing: { field: 'createdAt', direction: 'desc' }
  },
  pagination: {
    incoming: { page: 1, perPage: 10 },
    outgoing: { page: 1, perPage: 10 }
  }
};

export function setIncoming(items) {
  state.incoming = Array.isArray(items) ? items : [];
}

export function setOutgoing(items) {
  state.outgoing = Array.isArray(items) ? items : [];
}

export function getFilteredItems(type) {
  const items = state[type] || [];
  const filter = state.filters[type];
  const query = sanitize(filter.query).toLowerCase();

  return items.filter((item) => {
    const dateValue = item.tanggalSurat || item.tanggalMasuk || '';
    const createdAt = new Date(dateValue);
    const dateFrom = filter.from ? new Date(filter.from) : null;
    const dateTo = filter.to ? new Date(filter.to) : null;
    const passedQuery = [item.noSurat, item.tujuanSurat || item.pengirim, item.perihal, item.sifatSurat, item.status]
      .join(' ')
      .toLowerCase();

    const matchStatus = !filter.status || filter.status === item.status;
    const matchQuery = !query || passedQuery.includes(query);
    const matchFrom = !dateFrom || createdAt >= dateFrom;
    const matchTo = !dateTo || createdAt <= dateTo;

    return matchStatus && matchQuery && matchFrom && matchTo;
  });
}

export function getSortedItems(type, items) {
  const sortConfig = state.sort[type];
  return [...items].sort((a, b) => {
    const left = String(a[sortConfig.field] || '').toLowerCase();
    const right = String(b[sortConfig.field] || '').toLowerCase();
    if (left === right) return 0;
    if (sortConfig.direction === 'asc') return left > right ? 1 : -1;
    return left < right ? 1 : -1;
  });
}

export function getPaginatedItems(type) {
  const items = getFilteredItems(type);
  const sorted = getSortedItems(type, items);
  const { page, perPage } = state.pagination[type];
  const start = (page - 1) * perPage;
  const paged = sorted.slice(start, start + perPage);

  return { items: paged, total: items.length, page, perPage };
}

export function setFilter(type, payload) {
  state.filters[type] = { ...state.filters[type], ...payload };
  state.pagination[type].page = 1;
}

export function setSort(type, field) {
  const current = state.sort[type];
  if (current.field === field) {
    current.direction = current.direction === 'asc' ? 'desc' : 'asc';
  } else {
    state.sort[type] = { field, direction: 'asc' };
  }
}

export function setPagination(type, page, perPage) {
  state.pagination[type].page = page;
  state.pagination[type].perPage = perPage;
}

export function createIncomingRecord(payload) {
  return {
    id: payload.id,
    noSurat: sanitize(payload.noSurat),
    tanggalMasuk: payload.tanggalMasuk,
    pengirim: sanitize(payload.pengirim),
    perihal: sanitize(payload.perihal),
    sifatSurat: sanitize(payload.sifatSurat),
    status: sanitize(payload.status),
    lampiran: payload.lampiran || null,
    keterangan: sanitize(payload.keterangan),
    createdAt: payload.createdAt || new Date().toISOString()
  };
}

export function createOutgoingRecord(payload) {
  return {
    id: payload.id,
    noSurat: sanitize(payload.noSurat),
    tanggalSurat: payload.tanggalSurat,
    tujuanSurat: sanitize(payload.tujuanSurat),
    perihal: sanitize(payload.perihal),
    sifatSurat: sanitize(payload.sifatSurat),
    status: sanitize(payload.status),
    lampiran: payload.lampiran || null,
    keterangan: sanitize(payload.keterangan),
    createdAt: payload.createdAt || new Date().toISOString()
  };
}

export const debouncedFilter = debounce((callback) => callback(), 300);
