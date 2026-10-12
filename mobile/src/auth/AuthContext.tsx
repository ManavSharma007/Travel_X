import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, saveToken, getToken, clearToken } from "../api/client";
import type { User } from "../api/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  register: (email: string, username: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const res = await api.get("/auth/me");
          setUser(res.data.user);
        }
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function register(email: string, username: string, password: string) {
    const res = await api.post("/auth/register", { email, username, password });
    await saveToken(res.data.token);
    setUser(res.data.user);
  }

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    await saveToken(res.data.token);
    setUser(res.data.user);
  }

  async function logout() {
    await clearToken();
    setUser(null);
  }

  async function refresh() {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
