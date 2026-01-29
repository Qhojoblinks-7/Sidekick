import React, { useEffect, useRef, useContext } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import { selectSmsEnabled } from '../store/store';
import { AuthContext } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { readAndProcessSMS } from '../services/smsService';

// Counter for debugging SMS checks
let smsCheckCount = 0;
// Flag to prevent simultaneous SMS checks
let isChecking = false;

const SMSChecker = () => {
  const smsEnabled = useSelector(selectSmsEnabled);
  const { isAuthenticated } = useContext(AuthContext);
  const { showToast } = useToast();
  const intervalRef = useRef(null);

  const checkSMS = async () => {
    if (smsEnabled && isAuthenticated && !isChecking) {
      isChecking = true;
      smsCheckCount++;
      console.log(`Checking for new SMS transactions... (check ${smsCheckCount})`);
      try {
        await readAndProcessSMS(true);
      } catch (error) {
        console.error('SMS processing failed:', error);
        let message = 'Failed to process SMS transactions';
        if (error.message.includes('permission')) {
          message = 'SMS permission denied. Please enable SMS access in settings.';
        } else if (error.message.includes('consent')) {
          message = 'SMS consent required to process transactions.';
        }
        showToast(message, 'error');
      } finally {
        isChecking = false;
      }
    }
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        checkSMS();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial check when component mounts
    checkSMS();

    return () => {
      subscription?.remove();
    };
  }, [smsEnabled, isAuthenticated]);

  useEffect(() => {
    // Set up periodic checking every 5 minutes
    if (smsEnabled && isAuthenticated) {
      intervalRef.current = setInterval(checkSMS, 5 * 60 * 1000); // 5 minutes
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [smsEnabled, isAuthenticated]);

  return null; // This component doesn't render anything
};

export default SMSChecker;