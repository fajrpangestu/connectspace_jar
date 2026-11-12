import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const { notify } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggedOut, setLoggedOut] = useState(false); // logout sukarela tidak memunculkan peringatan "harus login"

  useEffect(() => {
    api.me().then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  // Sesi kedaluwarsa di tengah pemakaian
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const signIn = useCallback((u) => {
    setLoggedOut(false);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    setLoggedOut(true);
    try { await api.logout(); } catch { /* sesi tetap dianggap berakhir di klien */ }
    setUser(null);
    notify('Anda telah keluar.', 'success');
  }, [notify]);

  return (
    <AuthContext.Provider value={{ user, loading, loggedOut, signIn, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
