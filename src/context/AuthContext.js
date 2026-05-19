import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import api from "../api/axios";

const AuthContext = createContext(null);


export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");

        if (token) {
          const res = await api.get("/auth/me");
          if (res.status === 200) {
            setUserToken(token);

            setUserRole(res.data?.role ?? null);
          } else {
            await SecureStore.deleteItemAsync("token");
            setUserRole(null);
          }
        }
      } catch (err) {
        console.log("Auth bootstrap failed:", err.message);
        await SecureStore.deleteItemAsync("token").catch(() => {});
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const signIn = useCallback(async (token) => {
    await SecureStore.setItemAsync("token", token);
    setUserToken(token);
    try {
      const res = await api.get("/auth/me");
      setUserRole(res.data?.role ?? null);
    } catch {
      setUserRole(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync("token");
    setUserToken(null);
    setUserRole(null);
  }, []);

  const value = {
    isLoading,
    userToken,
    isSignedIn: !!userToken,
    userRole,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
