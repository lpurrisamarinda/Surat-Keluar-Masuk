import { showToast, sanitize } from './utilities.js';
import * as api from './api.js';

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

  if (window.__GAS_URL__) {
    try {
      const result = await api.login(sanitizedUser, sanitizedPass);
      if (!result || result.status !== 'success') {
        throw new Error(result?.message || 'Kombinasi username/password tidak valid.');
      }

      const session = {
        username: String(result.username || sanitizedUser),
        role: String(result.role || 'user'),
        token: `${String(result.username || sanitizedUser)}-${Date.now()}`
      };

      setSession(session);
      showToast(`Selamat datang, ${session.username}!`, 'success');
      return session;
    } catch (err) {
      const isNetworkError = /failed to fetch|tidak dapat terhubung|timeout|time out|networkerror|network error/i.test(err.message);
      if (isNetworkError) {
        const fallbackUser = fallbackUsers.find(
          (item) => item.username === sanitizedUser && item.password === sanitizedPass
        );
        if (fallbackUser) {
          const session = {
            username: fallbackUser.username,
            role: fallbackUser.role,
            token: `${fallbackUser.username}-${Date.now()}`
          };
          setSession(session);
          showToast(`Login offline berhasil sebagai ${session.username}.`, 'warn');
          return session;
        }
      }
      throw new Error(err.message || 'Gagal melakukan login.');
    }
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
