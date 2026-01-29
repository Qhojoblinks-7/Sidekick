import { PermissionsAndroid, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SmsAndroid from 'react-native-get-sms-android';
import { parseMoMoSMS } from '../utils/momoTracker';
import { apiCall } from './apiService';
import { store } from '../store/store';
import { addTransaction, setSummary } from '../store/store';

// Counter for debugging permission requests
let permissionRequestCount = 0;

// Key for storing last processed SMS timestamp
const LAST_PROCESSED_SMS_KEY = 'lastProcessedSMSTimestamp';

// Function to get last processed SMS timestamp
export const getLastProcessedSMSTimestamp = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_PROCESSED_SMS_KEY);
    return timestamp ? parseInt(timestamp) : null;
  } catch (error) {
    console.error('Error getting last processed SMS timestamp:', error);
    return null;
  }
};

// Function to set last processed SMS timestamp
export const setLastProcessedSMSTimestamp = async (timestamp) => {
  try {
    await AsyncStorage.setItem(LAST_PROCESSED_SMS_KEY, timestamp.toString());
  } catch (error) {
    console.error('Error setting last processed SMS timestamp:', error);
  }
};

// Helper function to check if a transaction with the given tx_id already exists in Redux store
const isTransactionDuplicate = (tx_id) => {
  const state = store.getState();
  return state.data.transactions.some(tx => tx.tx_id === tx_id);
};

// Function to request SMS permissions
export const requestSMSPermissions = async () => {
  try {
    // First, check current permission status to handle revocations
    const currentStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    console.log('Current SMS permission status:', currentStatus);

    if (currentStatus) {
      // Permission is currently granted, cache it
      try {
        await AsyncStorage.setItem('smsPermissionGranted', 'true');
      } catch (err) {
        console.warn('Error caching permission:', err);
      }
      return true;
    } else {
      // Permission is not granted, check cache to see if it was previously granted (revoked)
      const cachedStatus = await AsyncStorage.getItem('smsPermissionGranted');
      if (cachedStatus === 'true') {
        // Permission was revoked, update cache
        console.log('SMS permission was revoked, updating cache');
        try {
          await AsyncStorage.setItem('smsPermissionGranted', 'false');
        } catch (err) {
          console.warn('Error updating cached permission:', err);
        }
        return false;
      }
      // Permission not granted and not previously granted, request it
    }
  } catch (err) {
    console.warn('Error checking current permission status:', err);
    // Fall back to cached status or request
    try {
      const cachedStatus = await AsyncStorage.getItem('smsPermissionGranted');
      if (cachedStatus !== null) {
        const isGranted = cachedStatus === 'true';
        console.log('Falling back to cached SMS permission status:', isGranted);
        return isGranted;
      }
    } catch (cacheErr) {
      console.warn('Error reading cached permission:', cacheErr);
    }
  }

  permissionRequestCount++;
  console.log(`About to request SMS permission (attempt ${permissionRequestCount})`);
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission',
        message: 'This app needs access to your SMS to read transaction messages.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    console.log('Permission granted result:', granted);
    const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
    // Cache the result
    try {
      await AsyncStorage.setItem('smsPermissionGranted', isGranted.toString());
    } catch (err) {
      console.warn('Error caching permission:', err);
    }
    return isGranted;
  } catch (err) {
    console.warn('Error in requestSMSPermissions:', err);
    // Cache as false
    try {
      await AsyncStorage.setItem('smsPermissionGranted', 'false');
    } catch (cacheErr) {
      console.warn('Error caching permission:', cacheErr);
    }
    return false;
  }
};

// Function to read SMS messages
export const readSMS = async (hasConsent = true, minDate = null) => {
  try {
    if (!hasConsent) {
      throw new Error('SMS consent not given');
    }
    const hasPermission = await requestSMSPermissions();
    if (!hasPermission) {
      throw new Error('SMS permission not granted');
    }

    const options = {
      box: 'inbox',
      maxCount: 50, // Read last 50 SMS or newer than minDate
    };
    if (minDate !== null) {
      options.minDate = minDate;
    }

    const smsList = await new Promise((resolve, reject) => {
      SmsAndroid.list(
        JSON.stringify(options),
        (fail) => {
          reject(new Error(fail));
        },
        (count, smsList) => {
          const messages = JSON.parse(smsList);
          resolve(messages);
        },
      );
    });

    return smsList;
  } catch (error) {
    if (!error.message.includes('permission')) {
      console.error('Error reading SMS:', error);
    }
    throw error;
  }
};

// Function to send parsed SMS data to backend API
export const sendParsedSMSToAPI = async (parsedData) => {
  try {
    // Check if transaction with this tx_id already exists in Redux store
    if (isTransactionDuplicate(parsedData.tx_id)) {
      console.log(`Skipping duplicate transaction with tx_id: ${parsedData.tx_id}`);
      return null; // Return null to indicate duplicate
    }

    const response = await apiCall('/api/transactions/', {
      method: 'POST',
      body: JSON.stringify(parsedData),
    });

    if (response.ok) {
      const transaction = await response.json();
      store.dispatch(addTransaction(transaction));
      return transaction;
    } else {
      throw new Error(`API call failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending parsed SMS to API:', error);
    throw error;
  }
};

// Function to check if an SMS is a MoMo transaction message
export const isMoMoTransactionSMS = (sms) => {
  const body = sms.body.toLowerCase();
  console.log(`Checking SMS for MoMo pattern: ${body}`);
  // Check for presence of GHS (Ghana Cedis) and transaction keywords
  const hasAmount = body.includes('ghs');
  const hasTransactionKeyword = /\b(received|sent|transfer|payment|bought|charged|debited|credited)\b/.test(body);
  const hasRef = body.includes('ref:') || body.includes('reference');
  // Additional check for common MoMo patterns
  const hasMoMoIndicator = body.includes('mobile money') || body.includes('momo') || body.includes('mtn');

  const isMoMo = hasAmount && (hasTransactionKeyword || hasRef || hasMoMoIndicator);
  console.log(`SMS is MoMo transaction: ${isMoMo} (hasAmount: ${hasAmount}, hasTransactionKeyword: ${hasTransactionKeyword}, hasRef: ${hasRef}, hasMoMoIndicator: ${hasMoMoIndicator})`);
  return isMoMo;
};

// Function to filter MoMo transaction SMS from a list
export const filterMoMoSMS = (smsList) => {
  return smsList.filter(isMoMoTransactionSMS);
};

// Function to read and process SMS (read, parse, and send to API)
export const readAndProcessSMS = async (hasConsent = true) => {
  const lastTimestamp = await getLastProcessedSMSTimestamp();
  const smsList = await readSMS(hasConsent, lastTimestamp);
  const filteredSMS = filterMoMoSMS(smsList);
  let latestTimestamp = lastTimestamp || 0;
  for (const sms of filteredSMS) {
    const parsed = parseMoMoSMS(sms.body);
    if (parsed) {
      const result = await sendParsedSMSToAPI(parsed);
      if (result === null) {
        console.log('Skipped duplicate transaction from SMS processing');
      }
    }
    // Update latest timestamp
    if (sms.date > latestTimestamp) {
      latestTimestamp = sms.date;
    }
  }
  // Set the last processed timestamp
  if (latestTimestamp > (lastTimestamp || 0)) {
    await setLastProcessedSMSTimestamp(latestTimestamp);
  }
};

// Live tracking listener
export const startLiveTracking = (onNewTrip) => {
  // Listen for the broadcast from the native side
  const subscription = DeviceEventEmitter.addListener('onSMSReceived', async (data) => {
    const message = JSON.parse(data);
    const parsed = parseMoMoSMS(message.messageBody);

    if (parsed) {
      // Send to API and notify only if not a duplicate
      try {
        const result = await sendParsedSMSToAPI(parsed);
        if (result !== null) {
          onNewTrip(parsed);
        }
      } catch (error) {
        console.error('Error processing live SMS:', error);
      }
    }
  });

  return () => subscription.remove();
};

// Scanner for missed trips
export const syncMissedTrips = async () => {
  try {
    const lastTimestamp = await getLastProcessedSMSTimestamp();
    const smsList = await readSMS(true, lastTimestamp);
    const newTrips = [];
    let latestTimestamp = lastTimestamp || 0;

    for (const sms of smsList) {
      const parsed = parseMoMoSMS(sms.body);
      if (parsed) {
        try {
          const result = await sendParsedSMSToAPI(parsed);
          if (result !== null) {
            newTrips.push(parsed);
          }
        } catch (error) {
          console.error('Error sending missed trip to API:', error);
        }
      }
      // Update latest timestamp
      if (sms.date > latestTimestamp) {
        latestTimestamp = sms.date;
      }
    }

    // Set the last processed timestamp
    if (latestTimestamp > (lastTimestamp || 0)) {
      await setLastProcessedSMSTimestamp(latestTimestamp);
    }

    return newTrips;
  } catch (error) {
    if (error.message.includes('permission')) {
      // Permission denied, return empty array silently
      return [];
    }
    console.error('Error syncing missed trips:', error);
    throw error; // Re-throw other errors
  }
};