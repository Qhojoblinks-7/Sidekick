import React, { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { getAccessToken, logout as logoutUser } from "../services/apiService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await getAccessToken();
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error("Failed to check auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    isAuthenticated,
    isLoading,
    user,
    setIsAuthenticated,
    setUser,
    logout: async () => {
      await logoutUser();
      setIsAuthenticated(false);
      setUser(null);
    },
  };

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
};
