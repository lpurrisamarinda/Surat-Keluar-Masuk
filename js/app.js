import { APP_NAME, showToast, formatDate } from './utilities.js';
import * as auth from './auth.js';
import * as dataManager from './data-manager.js';
import * as crud from './crud.js';
import * as exporter from './export.js';
import * as fileManager from './file-manager.js';

const elements = {
  loginScreen: document.getElementById('login-screen'),
  appScreen: document.getElementById('app-screen'),
  loginForm: document.getElementById('login-form'),
  loginUser: document.getElementById('login-user'),
  loginPass: document.getElementById('login-pass'),
  loginError: document.getElementById('login-error'),
  navIncoming: document.getElementById('nav-incoming'),
  navOutgoing: document.getElementById('nav-outgoing'),
  sectionIncoming: document.getElementById('section-incoming'),
  sectionOutgoing: document.getElementById('section-outgoing'),
  btnLogout: document.getElementById('btn-logout'),
  btnRefresh: document.getElementById('btn-refresh'),
  themeToggle: document.getElementById('theme-toggle'),
  headerTitle: document.getElementById('app-title'),
  appVersion: document.getElementById('app-version'),
  incomingTableBody: document.getElementById('incoming-table-body'),
  outgoingTableBody: document.getElementById('outgoing-table-body'),
  incomingFilterQuery: document.getElementById('incoming-search'),
  outgoingFilterQuery: document.getElementById('outgoing-search'),
  incomingFilterStatus: document.getElementById('incoming-status'),
  outgoingFilterStatus: document.getElementById('outgoing-status'),
  incomingFrom: document.getElementById('incoming-from'),
  incomingTo: document.getElementById('incoming-to'),
  outgoingFrom: document.getElementById('outgoing-from'),
  outgoingTo: document.getElementById('outgoing-to'),
  incomingPager: document.getElementById('incoming-pager'),
  outgoingPager: document.getElementById('outgoing-pager'),
  incomingPerPage: document.getElementById('incoming-per-page'),
  outgoingPerPage: document.getElementById('outgoing-per-page'),
  incomingCount: document.getElementById('incoming-count'),
  outgoingCount: document.getElementById('outgoing-count'),
  incomingAddButton: document.getElementById('incoming-add-button'),
  outgoingAddButton: document.getElementById('outgoing-add-button'),
  incomingModal: document.getElementById('incoming-modal'),
  outgoingModal: document.getElementById('outgoing-modal'),
  incomingForm: document.getElementById('incoming-form'),
  outgoingForm: document.getElementById('outgoing-form'),
  incomingFileInput: document.getElementById('incoming-file'),
  outgoingFileInput: document.getElementById('outgoing-file'),
  incomingFileInfo: document.getElementById('incoming-file-info'),
  outgoingFileInfo: document.getElementById('outgoing-file-info'),
  incomingExportCsv: document.getElementById('incoming-export-csv'),
  incomingExportExcel: document.getElementById('incoming-export-excel'),
  outgoingExportCsv: document.getElementById('outgoing-export-csv'),
  outgoingExportExcel: document.getElementById('outgoing-export-excel'),
  previewModal: document.getElementById('preview-modal'),
  previewTitle: document.getElementById('preview-title'),
  previewLink: document.getElementById('preview-link'),
  previewFrame: document.getElementById('preview-frame'),
  confirmModal: document.getElementById('confirm-modal'),
  confirmMessage: document.getElementById('confirm-message'),
  confirmYes: document.getElementById('confirm-yes'),
  confirmNo: document.getElementById('confirm-no'),
  offlineBar: document.getElementById('offline-bar')
};

let pendingDelete = null;

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('skm-theme', theme);
  elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function restoreTheme() {
  const saved = localStorage.getItem('skm-theme') || 'light';
  setTheme(saved);
}

function showSection(section) {
  elements.sectionIncoming.classList.toggle('d-none', section !== 'incoming');
  elements.sectionOutgoing.classList.toggle('d-none', section !== 'outgoing');
  elements.navIncoming.classList.toggle('active', section === 'incoming');
  elements.navOutgoing.classList.toggle('active', section === 'outgoing');
  dataManager.state.activeTab = section;
}

function updateSummary() {
  elements.incomingCount.textContent = `${dataManager.state.incoming.length} surat masuk`;
  elements.outgoingCount.textContent = `${dataManager.state.outgoing.length} surat keluar`;
}

function buildTableRow(record, type) {
  const row = document.createElement('tr');
  const actions = document.createElement('div');
  actions.className = 'btn-group';

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'btn btn-sm btn-outline-primary';
  edit.textContent = 'Edit';
  edit.addEventListener('click', () => openEditDialog(type, record));

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'btn btn-sm btn-outline-danger';
  remove.textContent = 'Hapus';
  remove.addEventListener('click', () => confirmDelete(type, record));

  const preview = document.createElement('button');
  preview.type = 'button';
  preview.className = 'btn btn-sm btn-outline-secondary';
  preview.textContent = 'Preview';
  preview.addEventListener('click', () => openPreview(record));

  actions.append(edit, remove, preview);

  if (type === 'incoming') {
    row.innerHTML = `
      <td>${record.noSurat}</td>
      <td>${formatDate(record.tanggalMasuk)}</td>
      <td>${record.pengirim}</td>
      <td>${record.perihal}</td>
      <td>${record.sifatSurat}</td>
      <td>${record.status}</td>
      <td>${record.lampiran?.name || '-'}</td>
      <td></td>`;
  } else {
    row.innerHTML = `
      <td>${record.noSurat}</td>
      <td>${formatDate(record.tanggalSurat)}</td>
      <td>${record.tujuanSurat}</td>
      <td>${record.perihal}</td>
      <td>${record.sifatSurat}</td>
      <td>${record.status}</td>
      <td>${record.lampiran?.name || '-'}</td>
      <td></td>`;
  }
  row.lastElementChild.appendChild(actions);
  return row;
}

function renderTables() {
  const incoming = dataManager.getPaginatedItems('incoming');
  const outgoing = dataManager.getPaginatedItems('outgoing');

  elements.incomingTableBody.innerHTML = '';
  elements.outgoingTableBody.innerHTML = '';

  if (incoming.items.length === 0) {
    elements.incomingTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Tidak ada data surat masuk.</td></tr>';
  } else {
    incoming.items.forEach((record) => elements.incomingTableBody.appendChild(buildTableRow(record, 'incoming')));
  }

  if (outgoing.items.length === 0) {
    elements.outgoingTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Tidak ada data surat keluar.</td></tr>';
  } else {
    outgoing.items.forEach((record) => elements.outgoingTableBody.appendChild(buildTableRow(record, 'outgoing')));
  }
}

function updatePagination(type) {
  const { total, perPage, page } = dataManager.getPaginatedItems(type);
  const pager = type === 'incoming' ? elements.incomingPager : elements.outgoingPager;
  pager.textContent = `Menampilkan ${Math.min(total, perPage)} dari ${total} item`;
}

function refreshUI() {
  updateSummary();
  renderTables();
  updatePagination('incoming');
  updatePagination('outgoing');
}

function openModal(modal) {
  modal.classList.remove('d-none');
}

function closeModal(modal) {
  modal.classList.add('d-none');
}

function clearForm(form) {
  form.reset();
  form.querySelectorAll('.is-invalid').forEach((field) => field.classList.remove('is-invalid'));
  form.querySelectorAll('.invalid-feedback').forEach((node) => (node.textContent = ''));
}

function validateForm(form) {
  const required = form.querySelectorAll('[required]');
  let valid = true;
  required.forEach((field) => {
    if (!field.value.trim()) {
      valid = false;
      field.classList.add('is-invalid');
      const feedback = field.closest('.mb-3')?.querySelector('.invalid-feedback');
      if (feedback) {
        feedback.textContent = 'Field ini wajib diisi.';
      }
    } else {
      field.classList.remove('is-invalid');
      const feedback = field.closest('.mb-3')?.querySelector('.invalid-feedback');
      if (feedback) {
        feedback.textContent = '';
      }
    }
  });
  return valid;
}

function openEditDialog(type, record) {
  const form = type === 'incoming' ? elements.incomingForm : elements.outgoingForm;
  clearForm(form);
  form.dataset.editId = record.id;
  form.dataset.lampiran = JSON.stringify(record.lampiran || null);

  if (type === 'incoming') {
    form.querySelector('[name="noSurat"]').value = record.noSurat || '';
    form.querySelector('[name="tanggalMasuk"]').value = record.tanggalMasuk || '';
    form.querySelector('[name="pengirim"]').value = record.pengirim || '';
    form.querySelector('[name="perihal"]').value = record.perihal || '';
    form.querySelector('[name="sifatSurat"]').value = record.sifatSurat || '';
    form.querySelector('[name="status"]').value = record.status || '';
    form.querySelector('[name="keterangan"]').value = record.keterangan || '';
    elements.incomingFileInfo.textContent = record.lampiran?.name || 'Tidak ada lampiran';
    openModal(elements.incomingModal);
  } else {
    form.querySelector('[name="noSurat"]').value = record.noSurat || '';
    form.querySelector('[name="tanggalSurat"]').value = record.tanggalSurat || '';
    form.querySelector('[name="tujuanSurat"]').value = record.tujuanSurat || '';
    form.querySelector('[name="perihal"]').value = record.perihal || '';
    form.querySelector('[name="sifatSurat"]').value = record.sifatSurat || '';
    form.querySelector('[name="status"]').value = record.status || '';
    form.querySelector('[name="keterangan"]').value = record.keterangan || '';
    elements.outgoingFileInfo.textContent = record.lampiran?.name || 'Tidak ada lampiran';
    openModal(elements.outgoingModal);
  }
}

function openPreview(record) {
  if (!record.lampiran?.dataUrl) {
    showToast('File lampiran belum tersedia untuk preview.', 'warn');
    return;
  }
  elements.previewTitle.textContent = record.lampiran.name || 'Preview Lampiran';
  elements.previewLink.href = record.lampiran.dataUrl;
  elements.previewLink.textContent = 'Buka di tab baru';
  elements.previewFrame.src = record.lampiran.dataUrl;
  openModal(elements.previewModal);
}

function confirmDelete(type, record) {
  pendingDelete = { type, id: record.id };
  elements.confirmMessage.textContent = `Hapus data ${record.noSurat}? Aksi ini tidak dapat dibatalkan.`;
  openModal(elements.confirmModal);
}

function attachFormListeners() {
  elements.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    elements.loginError.textContent = '';
    try {
      await auth.login(elements.loginUser.value, elements.loginPass.value);
      showApp();
      await reloadData();
    } catch (error) {
      elements.loginError.textContent = error.message;
      elements.loginScreen.querySelector('.login-card')?.classList.add('shake');
      window.setTimeout(() => elements.loginScreen.querySelector('.login-card')?.classList.remove('shake'), 350);
    }
  });

  elements.btnLogout.addEventListener('click', () => {
    auth.logout();
    hideApp();
  });

  elements.btnRefresh.addEventListener('click', () => {
    reloadData();
  });

  elements.themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });

  elements.navIncoming.addEventListener('click', () => showSection('incoming'));
  elements.navOutgoing.addEventListener('click', () => showSection('outgoing'));

  elements.incomingAddButton.addEventListener('click', () => {
    elements.incomingForm.dataset.editId = '';
    delete elements.incomingForm.dataset.lampiran;
    clearForm(elements.incomingForm);
    elements.incomingFileInfo.textContent = 'Pilih file jika ada.';
    openModal(elements.incomingModal);
  });

  elements.outgoingAddButton.addEventListener('click', () => {
    elements.outgoingForm.dataset.editId = '';
    delete elements.outgoingForm.dataset.lampiran;
    clearForm(elements.outgoingForm);
    elements.outgoingFileInfo.textContent = 'Pilih file jika ada.';
    openModal(elements.outgoingModal);
  });

  elements.incomingFileInput.addEventListener('change', () => {
    elements.incomingFileInfo.textContent = elements.incomingFileInput.files[0]?.name || 'Pilih file jika ada.';
  });

  elements.outgoingFileInput.addEventListener('change', () => {
    elements.outgoingFileInfo.textContent = elements.outgoingFileInput.files[0]?.name || 'Pilih file jika ada.';
  });

  document.querySelectorAll('.modal-close').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.closest('.modal-wrapper')));
  });

  elements.incomingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateForm(elements.incomingForm)) return;
    const editId = elements.incomingForm.dataset.editId;
    const originalLampiran = editId ? JSON.parse(elements.incomingForm.dataset.lampiran || 'null') : null;
    const attachment = elements.incomingFileInput.files[0] || originalLampiran || null;
    const payload = {
      noSurat: elements.incomingForm.noSurat.value,
      tanggalMasuk: elements.incomingForm.tanggalMasuk.value,
      pengirim: elements.incomingForm.pengirim.value,
      perihal: elements.incomingForm.perihal.value,
      sifatSurat: elements.incomingForm.sifatSurat.value,
      status: elements.incomingForm.status.value,
      keterangan: elements.incomingForm.keterangan.value,
      lampiran: attachment
    };
    try {
      if (editId) {
        await crud.updateRecord('incoming', editId, payload);
      } else {
        await crud.createIncoming(payload);
      }
      closeModal(elements.incomingModal);
      refreshUI();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  elements.outgoingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateForm(elements.outgoingForm)) return;
    const editId = elements.outgoingForm.dataset.editId;
    const originalLampiran = editId ? JSON.parse(elements.outgoingForm.dataset.lampiran || 'null') : null;
    const attachment = elements.outgoingFileInput.files[0] || originalLampiran || null;
    const payload = {
      noSurat: elements.outgoingForm.noSurat.value,
      tanggalSurat: elements.outgoingForm.tanggalSurat.value,
      tujuanSurat: elements.outgoingForm.tujuanSurat.value,
      perihal: elements.outgoingForm.perihal.value,
      sifatSurat: elements.outgoingForm.sifatSurat.value,
      status: elements.outgoingForm.status.value,
      keterangan: elements.outgoingForm.keterangan.value,
      lampiran: attachment
    };
    try {
      if (editId) {
        await crud.updateRecord('outgoing', editId, payload);
      } else {
        await crud.createOutgoing(payload);
      }
      closeModal(elements.outgoingModal);
      refreshUI();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  elements.incomingFilterQuery.addEventListener('input', dataManager.debouncedFilter(() => {
    dataManager.setFilter('incoming', { query: elements.incomingFilterQuery.value });
    refreshUI();
  }));
  elements.outgoingFilterQuery.addEventListener('input', dataManager.debouncedFilter(() => {
    dataManager.setFilter('outgoing', { query: elements.outgoingFilterQuery.value });
    refreshUI();
  }));

  elements.incomingStatus.addEventListener('change', () => {
    dataManager.setFilter('incoming', { status: elements.incomingStatus.value });
    refreshUI();
  });
  elements.outgoingStatus.addEventListener('change', () => {
    dataManager.setFilter('outgoing', { status: elements.outgoingStatus.value });
    refreshUI();
  });

  elements.incomingFrom.addEventListener('change', () => {
    dataManager.setFilter('incoming', { from: elements.incomingFrom.value });
    refreshUI();
  });
  elements.incomingTo.addEventListener('change', () => {
    dataManager.setFilter('incoming', { to: elements.incomingTo.value });
    refreshUI();
  });
  elements.outgoingFrom.addEventListener('change', () => {
    dataManager.setFilter('outgoing', { from: elements.outgoingFrom.value });
    refreshUI();
  });
  elements.outgoingTo.addEventListener('change', () => {
    dataManager.setFilter('outgoing', { to: elements.outgoingTo.value });
    refreshUI();
  });

  elements.incomingPerPage.addEventListener('change', () => {
    dataManager.setPagination('incoming', 1, Number(elements.incomingPerPage.value));
    refreshUI();
  });
  elements.outgoingPerPage.addEventListener('change', () => {
    dataManager.setPagination('outgoing', 1, Number(elements.outgoingPerPage.value));
    refreshUI();
  });

  elements.incomingExportCsv.addEventListener('click', () => exporter.exportCSV(dataManager.state.incoming, 'surat-masuk.csv'));
  elements.incomingExportExcel.addEventListener('click', () => exporter.exportExcel(dataManager.state.incoming, 'surat-masuk.xlsx'));
  elements.outgoingExportCsv.addEventListener('click', () => exporter.exportCSV(dataManager.state.outgoing, 'surat-keluar.csv'));
  elements.outgoingExportExcel.addEventListener('click', () => exporter.exportExcel(dataManager.state.outgoing, 'surat-keluar.xlsx'));

  elements.confirmYes.addEventListener('click', async () => {
    if (!pendingDelete) return;
    try {
      await crud.deleteRecord(pendingDelete.type, pendingDelete.id);
      refreshUI();
      closeModal(elements.confirmModal);
      pendingDelete = null;
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
  elements.confirmNo.addEventListener('click', () => {
    pendingDelete = null;
    closeModal(elements.confirmModal);
  });

  window.addEventListener('click', (event) => {
    const modalBackgrounds = ['preview-modal', 'incoming-modal', 'outgoing-modal', 'confirm-modal'];
    if (event.target instanceof HTMLElement && modalBackgrounds.includes(event.target.id)) {
      closeModal(event.target);
    }
  });
}

function hideApp() {
  elements.appScreen.classList.add('d-none');
  elements.loginScreen.classList.remove('d-none');
}

function showApp() {
  elements.loginScreen.classList.add('d-none');
  elements.appScreen.classList.remove('d-none');
  elements.headerTitle.textContent = APP_NAME;
  elements.appVersion.textContent = '1.0';
}

async function reloadData() {
  const result = await crud.loadInitialData();
  if (result.incoming.length || result.outgoing.length) {
    showToast('Data berhasil dimuat.', 'success');
  }
  refreshUI();
}

async function init() {
  restoreTheme();
  attachFormListeners();
  if (auth.isAuthenticated()) {
    showApp();
    await reloadData();
  } else {
    hideApp();
  }
}

init();
