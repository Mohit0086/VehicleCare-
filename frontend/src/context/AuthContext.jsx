import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth.api';

const AuthContext = createContext(null);
const normalizeUser = (user) => ({
  ...user,
  role: { OWNER: 'CUSTOMER', MECHANIC: 'ADMIN' }[user.role] || user.role,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('vehiclecare_token'));
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem('vehiclecare_token');
    localStorage.removeItem('vehiclecare_user');
    localStorage.removeItem('vehiclecare_preview_role');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    let active = true;
    localStorage.removeItem('vehiclecare_preview_role');
    localStorage.removeItem('vehiclecare_user');
    async function restoreSession() {
      if (localStorage.getItem('vehiclecare_token')) {
        try {
          const data = await authApi.getProfile();
          if (active) setUser(normalizeUser(data.user));
        } catch {
          if (active) clearSession();
        }
      }
      if (active) setLoading(false);
    }
    restoreSession();
    return () => { active = false; };
  }, []);

  const saveSession = (data) => {
    if (!data.token || !data.user) throw new Error('Invalid authentication response.');
    const authenticatedUser = normalizeUser(data.user);
    localStorage.setItem('vehiclecare_token', data.token);
    setToken(data.token);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const login = async (email, password, accountType) => saveSession(await authApi.login({ email, password, accountType }));
  const register = async (details) => saveSession(await authApi.register({ ...details, role: 'CUSTOMER' }));
  const role = user?.role || null;

  return <AuthContext.Provider value={{ user, token, loading, login, register, logout: clearSession,
    isAuthenticated: !!token && !!user,
    // Legacy page branches remain disabled; authentication always requires the API.
    isPreview: false, role, isAdmin: role === 'ADMIN', isCustomer: role === 'CUSTOMER',
  }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
