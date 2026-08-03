import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  saveToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  );

  function saveToken(t: string) {
    localStorage.setItem('token', t);
    setToken(t);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: !!token, saveToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
