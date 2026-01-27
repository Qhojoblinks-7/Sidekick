import React, { useEffect, useRef, useContext } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import { AuthContext } from '../contexts/AuthContext';
import { readAndProcessSMS } from '../services/smsService';

const SMSChecker = () => {
  const { smsEnabled } = useSelector((state) => state.settings);
  const { isAuthenticated } = useContext(AuthContext);
  const intervalRef = useRef(null);

  const checkSMS = async () => {
    if (smsEnabled && isAuthenticated) {
      console.log('Checking for new SMS transactions...');
      await readAndProcessSMS(true);
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