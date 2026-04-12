import { useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

/**
 * Custom hook for authentication helpers.
 * Provides token storage, retrieval, and logout.
 */
const useAuth = () => {
  const [loading, setLoading] = useState(false);

  const getToken = useCallback(async () => {
    return await SecureStore.getItemAsync("token");
  }, []);

  const saveToken = useCallback(async (token) => {
    await SecureStore.setItemAsync("token", token);
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await SecureStore.deleteItemAsync("token");
    } finally {
      setLoading(false);
    }
  }, []);

  return { getToken, saveToken, logout, loading };
};

export default useAuth;
