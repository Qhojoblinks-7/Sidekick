import { PermissionsAndroid, DeviceEventEmitter } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { parseMoMoSMS } from '../utils/momoTracker';
import { apiCall } from './apiService';

// Function to request SMS permissions
export const requestSMSPermissions = async () => {
  console.log('About to request SMS permission');
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
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Error in requestSMSPermissions:', err);
    return false;
  }
};

// Function to read SMS messages
export const readSMS = async (hasConsent = true) => {
  try {
    if (!hasConsent) {
      throw new Error('SMS consent not given');
    }
    const hasPermission = await requestSMSPermissions();
    if (!hasPermission) {
      throw new Error('SMS permission not granted');
    }

    const smsList = await new Promise((resolve, reject) => {
      SmsAndroid.list(
        JSON.stringify({
          box: 'inbox',
          maxCount: 50, // Read last 50 SMS
        }),
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
    console.error('Error reading SMS:', error);
    throw error;
  }
};

// Function to send parsed SMS data to backend API
export const sendParsedSMSToAPI = async (parsedData) => {
  try {
    const response = await apiCall('/api/transactions/', {
      method: 'POST',
      body: JSON.stringify(parsedData),
    });
    return response;
  } catch (error) {
    console.error('Error sending parsed SMS to API:', error);
    throw error;
  }
};

// Function to check if an SMS is a MoMo transaction message
export const isMoMoTransactionSMS = (sms) => {
  const body = sms.body.toLowerCase();
  // Check for presence of GHS (Ghana Cedis) and transaction keywords
  const hasAmount = body.includes('ghs');
  const hasTransactionKeyword = /\b(received|sent|transfer|payment|bought|charged|debited|credited)\b/.test(body);
  const hasRef = body.includes('ref:') || body.includes('reference');
  // Additional check for common MoMo patterns
  const hasMoMoIndicator = body.includes('mobile money') || body.includes('momo') || body.includes('mtn');

  return hasAmount && (hasTransactionKeyword || hasRef || hasMoMoIndicator);
};

// Function to filter MoMo transaction SMS from a list
export const filterMoMoSMS = (smsList) => {
  return smsList.filter(isMoMoTransactionSMS);
};

// Function to read and process SMS (read, parse, and send to API)
export const readAndProcessSMS = async (hasConsent = true) => {
  try {
    const smsList = await readSMS(hasConsent);
    const filteredSMS = filterMoMoSMS(smsList);
    for (const sms of filteredSMS) {
      const parsed = parseMoMoSMS(sms.body);
      if (parsed) {
        await sendParsedSMSToAPI(parsed);
      }
    }
  } catch (error) {
    console.error('Error processing SMS:', error);
  }
};

// Live tracking listener
export const startLiveTracking = (onNewTrip) => {
  // Listen for the broadcast from the native side
  const subscription = DeviceEventEmitter.addListener('onSMSReceived', async (data) => {
    const message = JSON.parse(data);
    const parsed = parseMoMoSMS(message.messageBody);

    if (parsed) {
      // Send to API and notify
      try {
        await sendParsedSMSToAPI(parsed);
        onNewTrip(parsed);
      } catch (error) {
        console.error('Error processing live SMS:', error);
      }
    }
  });

  return () => subscription.remove();
};

// Scanner for missed trips
export const syncMissedTrips = async (lastKnownTripId, onSyncComplete) => {
  try {
    const smsList = await readSMS(true);
    const newTrips = [];

    for (const sms of smsList) {
      const parsed = parseMoMoSMS(sms.body);
      // Only add if it's a valid transaction and not already in our DB
      if (parsed && parsed.tx_id !== lastKnownTripId) {
        try {
          await sendParsedSMSToAPI(parsed);
          newTrips.push(parsed);
        } catch (error) {
          console.error('Error sending missed trip to API:', error);
        }
      }
    }

    onSyncComplete(newTrips);
  } catch (error) {
    console.error('Error syncing missed trips:', error);
    onSyncComplete([]);
  }
};