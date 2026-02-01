import * as SecureStore from "expo-secure-store";

// API URL with proper fallback for development and production
// IMPORTANT: Set EXPO_PUBLIC_API_URL in your environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// Validate API URL is configured
if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn('WARNING: EXPO_PUBLIC_API_URL is not set! Using fallback: http://localhost:8000');
  console.warn('Please set EXPO_PUBLIC_API_URL in your .env file or environment variables');
}

// Get stored tokens
export const getAccessToken = async () => {
  return await SecureStore.getItemAsync("accessToken");
};

export const getRefreshToken = async () => {
  return await SecureStore.getItemAsync("refreshToken");
};

// Refresh access token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(`${API_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      await SecureStore.setItemAsync("accessToken", data.access);
      return data.access;
    }
    return null;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
};

// Logout - clear all tokens
export const logout = async () => {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
};

// Session expired error class
export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired. Please login again.");
    this.name = "SessionExpiredError";
  }
}

// API call with automatic token attachment and refresh
export const apiCall = async (endpoint, options = {}) => {
  console.log(`API Call: ${endpoint}`, { options });
  console.log(`Full URL: ${API_URL}${endpoint}`);

  let accessToken = await getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  try {
    let response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log(`API Response: ${endpoint}`, { status: response.status, ok: response.ok });

    // If 401, try refreshing token
    if (response.status === 401 && accessToken) {
      console.log("Token expired, attempting refresh");
      const newToken = await refreshAccessToken();
      if (newToken) {
        accessToken = newToken;
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        });
        console.log("Token refreshed successfully");
      } else {
        // Refresh failed, need to logout
        console.error("Token refresh failed, clearing tokens");
        await logout();
        throw new SessionExpiredError();
      }
    }

    if (!response.ok) {
      console.error(`API Error: ${endpoint}`, { status: response.status, statusText: response.statusText });
      const errorText = await response.text();
      console.error("Error response body:", errorText);
    }

    return response;
  } catch (error) {
    console.error(`Network error for ${endpoint}:`, error);
    throw error;
  }
};
