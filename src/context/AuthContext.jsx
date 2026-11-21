import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { chatService } from "../services/chatService";

const AuthContext = createContext(null);

const TOKEN_STORAGE_KEY = "reusa_token";
const USER_STORAGE_KEY = "reusa_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const persistSession = useCallback((nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    if (nextUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }

    setToken(nextToken || null);
    setUser(nextUser || null);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return 0;
    }

    try {
      const data = await chatService.getUnreadCount(token);
      const count = typeof data?.unreadCount === "number" ? data.unreadCount : 0;
      setUnreadCount(count);
      return count;
    } catch {
      return unreadCount;
    }
  }, [token, unreadCount]);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    refreshUnreadCount();

    const intervalId = setInterval(() => {
      refreshUnreadCount();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [token, refreshUnreadCount]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authService.login(credentials);
      const nextToken = data.token || data.accessToken || null;
      const nextUser = data.user || data;
      persistSession(nextToken, nextUser);
      return nextUser;
    } catch (err) {
      setAuthError(err.message || "Error al iniciar sesión");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authService.register(userData);
      const nextToken = data.token || data.accessToken || null;
      const nextUser = data.user || data;
      if (nextToken || nextUser?.id) {
        persistSession(nextToken, nextUser);
      }
      return nextUser;
    } catch (err) {
      setAuthError(err.message || "Error al registrar usuario");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    persistSession(null, null);
    setUnreadCount(0);
    setAuthError(null);
  }, [persistSession]);

  const updateUserState = useCallback((partialOrUpdater) => {
    setUser((prev) => {
      const next = typeof partialOrUpdater === "function"
        ? partialOrUpdater(prev)
        : { ...prev, ...partialOrUpdater };
      if (next) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const submitIdentityVerification = useCallback(async (formData) => {
    if (!token) throw new Error("Debes iniciar sesión para verificar tu identidad.");
    setLoading(true);
    setAuthError(null);
    try {
      const updated = await authService.submitVerification(formData, token);
      updateUserState((prev) => ({
        ...prev,
        verification_status: updated?.verification_status || "pending",
        is_verified: Boolean(updated?.is_verified ?? prev?.is_verified),
      }));
      return updated;
    } catch (err) {
      setAuthError(err.message || "Error al enviar verificación de identidad");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, updateUserState]);

  const incrementUnreadCount = useCallback((delta = 1) => {
    setUnreadCount((prev) => Math.max(0, prev + delta));
  }, []);

  const decrementUnreadCount = useCallback((delta = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - delta));
  }, []);

  const value = useMemo(() => {
    const isAuthenticated = Boolean(token && user);
    const isVerified = Boolean(user?.is_verified ?? user?.isVerified);
    const isReLeader = Boolean(isVerified && user?.role === "releader");

    return {
      token,
      user,
      isAuthenticated,
      isVerified,
      isReLeader,
      unreadCount,
      setUnreadCount,
      incrementUnreadCount,
      decrementUnreadCount,
      refreshUnreadCount,
      loading,
      authError,
      login,
      register,
      logout,
      updateUserState,
      submitIdentityVerification,
    };
  }, [
    token,
    user,
    unreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    refreshUnreadCount,
    loading,
    authError,
    login,
    register,
    logout,
    updateUserState,
    submitIdentityVerification,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider");
  }
  return context;
}