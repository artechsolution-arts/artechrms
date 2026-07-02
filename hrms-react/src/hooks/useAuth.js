import { useState, useEffect } from 'react';

const STORAGE_KEY = 'artech_hrms_token';
const USER_KEY = 'artech_hrms_user';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  });

  const login = (access_token, userData) => {
    localStorage.setItem(STORAGE_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('artech_current_page');
    setToken(null);
    setUser(null);
  };

  // Receive the session-expired signal from api.js (replaces window.location.reload)
  useEffect(() => {
    const onExpired = () => { setToken(null); setUser(null); };
    window.addEventListener('artech:session-expired', onExpired);
    return () => window.removeEventListener('artech:session-expired', onExpired);
  }, []);

  return { token, user, login, logout, isAuthenticated: !!token };
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}
