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
    setToken(null);
    setUser(null);
  };

  return { token, user, login, logout, isAuthenticated: !!token };
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}
