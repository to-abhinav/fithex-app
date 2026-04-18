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
  const [isLoading, setIsLoading] = useState(true); // splash / bootstrap phase
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");

        if (token) {
          const res = await api.get("/auth/me");
          if (res.status === 200) {
            setUserToken(token);
          } else {
            await SecureStore.deleteItemAsync("token");
          }
        }
      } catch (err) {
        console.log("Auth bootstrap failed:", err.message);
        await SecureStore.deleteItemAsync("token").catch(() => {});
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const signIn = useCallback(async (token) => {
    await SecureStore.setItemAsync("token", token);
    setUserToken(token);
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync("token");
    setUserToken(null);
  }, []);

  const value = {
    isLoading,
    userToken,
    isSignedIn: !!userToken,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
