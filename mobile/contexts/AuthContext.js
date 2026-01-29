import React, { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAccessToken, logout as logoutUser } from "../services/apiService";
import { store } from '../store/store';
import { loadSettings } from '../store/store';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const rememberMe = await SecureStore.getItemAsync("rememberMe");
        if (rememberMe === "false") {
          setIsAuthenticated(false);
        } else {
          const token = await getAccessToken();
          setIsAuthenticated(!!token);
        }

        // Load settings from AsyncStorage at app startup
        const stored = await AsyncStorage.getItem('settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          store.dispatch(loadSettings(parsed));
        }
      } catch (error) {
        console.error("Failed to check auth status or load settings:", error);
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
