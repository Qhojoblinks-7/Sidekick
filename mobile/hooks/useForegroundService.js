import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as SecureStore from 'expo-secure-store';

/**
 * Foreground Service Hook
 * 
 * Manages background tracking for SMS processing.
 * Ensures SMS is read 100% of the time even when app is in background.
 */

const FOREGROUND_SERVICE_TASK = 'SidekickTracking';
const BACKGROUND_FETCH_TASK = 'SidekickFetch';

export const FOREGROUND_SERVICE_TASK_NAME = FOREGROUND_SERVICE_TASK;
export const BACKGROUND_FETCH_TASK_NAME = BACKGROUND_FETCH_TASK;

// Task implementation for background fetch
// SMS functionality disabled - commented out
/*
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('[ForegroundService] Background fetch triggered');
    
    // Import dynamically to avoid circular dependencies
    const { readAndProcessSMS } = await import('../services/smsService');
    await readAndProcessSMS(true);
    
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('[ForegroundService] Background fetch error:', error);
    return BackgroundFetch.Result.Failed;
  }
});
*/

/**
 * Register background tasks
 */
export const registerBackgroundTasks = async () => {
  if (Platform.OS !== 'android') {
    console.log('[ForegroundService] Background tasks only supported on Android');
    return false;
  }

  try {
    // Register background fetch
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 5 * 60, // 5 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[ForegroundService] Background tasks registered');
    return true;
  } catch (error) {
    console.error('[ForegroundService] Failed to register tasks:', error);
    return false;
  }
};

/**
 * Unregister background tasks
 */
export const unregisterBackgroundTasks = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('[ForegroundService] Background tasks unregistered');
  } catch (error) {
    console.error('[ForegroundService] Failed to unregister tasks:', error);
  }
};

/**
 * Start foreground service notification
 */
export const startForegroundService = async () => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const ForegroundService = (await import('expo-foreground-service')).default;
    
    await ForegroundService.startServiceAsync({
      notificationTitle: 'Sidekick Active',
      notificationText: 'Tracking your earnings...',
      notificationColor: '#000000',
      iconAssetPath: './assets/brand-icon.png',
    });

    console.log('[ForegroundService] Started');
    return true;
  } catch (error) {
    console.error('[ForegroundService] Start error:', error);
    return false;
  }
};

/**
 * Stop foreground service
 */
export const stopForegroundService = async () => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const ForegroundService = (await import('expo-foreground-service')).default;
    await ForegroundService.stopServiceAsync();
    console.log('[ForegroundService] Stopped');
    return true;
  } catch (error) {
    console.error('[ForegroundService] Stop error:', error);
    return false;
  }
};

/**
 * Hook for managing foreground service
 */
export const useForegroundService = () => {
  const [isServiceActive, setIsServiceActive] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState(null);

  // Check if service is already running
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const ForegroundService = (await import('expo-foreground-service')).default;
        const status = await ForegroundService.isTaskRegistered();
        setIsServiceActive(status);
      } catch (error) {
        console.log('[ForegroundService] Status check error:', error.message);
      }
    };

    checkServiceStatus();
  }, []);

  // Register tasks on mount
  useEffect(() => {
    const init = async () => {
      const registered = await registerBackgroundTasks();
      setIsRegistered(registered);
    };
    
    if (Platform.OS === 'android') {
      init();
    }
  }, []);

  // Start service
  const startService = useCallback(async () => {
    try {
      setError(null);
      
      // Check permissions
      const { status } = await BackgroundFetch.getStatusAsync();
      if (status === BackgroundFetch.Status.Denied) {
        setError('Background fetch is disabled. Enable in system settings.');
        return false;
      }

      const started = await startForegroundService();
      if (started) {
        setIsServiceActive(true);
        
        // Also start background fetch
        await BackgroundFetch.setTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 5 * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }

      return started;
    } catch (error) {
      setError(error.message);
      return false;
    }
  }, []);

  // Stop service
  const stopService = useCallback(async () => {
    try {
      await stopForegroundService();
      await unregisterBackgroundTasks();
      setIsServiceActive(false);
      setIsRegistered(false);
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  }, []);

  // Toggle service
  const toggleService = useCallback(async () => {
    if (isServiceActive) {
      return await stopService();
    } else {
      return await startService();
    }
  }, [isServiceActive, startService, stopService]);

  return {
    isServiceActive,
    isRegistered: isRegistered && Platform.OS === 'android',
    error,
    startService,
    stopService,
    toggleService,
    isAndroid: Platform.OS === 'android',
  };
};

export default useForegroundService;
