import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { Slot, useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../store/store';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import Toast from '../components/ui/Toast';
import { setSessionExpirationCallback } from '../services/apiService';
// import SMSChecker from '../components/SMSChecker';

const queryClient = new QueryClient();

function SessionHandler() {
  const router = useRouter();

  React.useEffect(() => {
    // Set up session expiration callback to redirect to auth
    const unsubscribe = setSessionExpirationCallback(() => {
      console.log('Session expired, redirecting to auth...');
      router.replace('/auth');
    });

    return () => {
      // Cleanup if needed
    };
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <View style={{ flex: 1 }}>
                  <SessionHandler />
                  <Slot />
                  <Toast />
                  {/* <SMSChecker /> */}
                </View>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  );
}