import React, { createContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAccessToken, logout as logoutUser, setSessionExpirationCallback } from "../services/apiService";
import { store } from '../store/store';
import { setDailyTarget, setVehicleType } from '../store/store';

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
          if (parsed.dailyTarget !== undefined) {
            store.dispatch(setDailyTarget(parsed.dailyTarget));
          }
          if (parsed.vehicleType !== undefined) {
            store.dispatch(setVehicleType(parsed.vehicleType));
          }
        }
      } catch (error) {
        console.error("Failed to check auth status or load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Set up session expiration callback to notify the app
  useEffect(() => {
    const unsubscribe = setSessionExpirationCallback(async () => {
      console.log("Session expired, logging out...");
      await logoutUser();
      setIsAuthenticated(false);
      setUser(null);
    });

    return unsubscribe;
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
