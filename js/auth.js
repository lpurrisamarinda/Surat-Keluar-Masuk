import { showToast, sanitize } from './utilities.js';

const AUTH_KEY = 'skm-session';
const fallbackUsers = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'operator', password: 'operator123', role: 'user' }
];

export function getSession() {
  const raw = localStorage.getItem(AUTH_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated() {
  return Boolean(getSession());
}

export async function login(username, password) {
  const sanitizedUser = sanitize(username);
  const sanitizedPass = sanitize(password);

  if (!sanitizedUser || !sanitizedPass) {
    throw new Error('Username dan password wajib diisi.');
  }

  const user = fallbackUsers.find(
    (item) => item.username === sanitizedUser && item.password === sanitizedPass
  );

  if (!user) {
    throw new Error('Kombinasi username/password tidak valid.');
  }

  const session = {
    username: user.username,
    role: user.role,
    token: `${user.username}-${Date.now()}`
  };

  setSession(session);
  showToast(`Selamat datang, ${user.username}!`, 'success');
  return session;
}

export function logout() {
  clearSession();
  showToast('Anda telah keluar.', 'warn');
}

export function protectRoute() {
  const session = getSession();
  if (!session) {
    throw new Error('Sesi tidak ditemukan. Silakan login ulang.');
  }
  return session;
}
