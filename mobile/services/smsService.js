import { PermissionsAndroid } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import axios from 'axios';

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
          maxCount: 10, // Read last 10 SMS
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

// Function to send SMS to bridge
export const sendSMSToBridge = async (message) => {
  try {
    const response = await axios.post('http://localhost:3001/sms', { message });
    return response.data;
  } catch (error) {
    console.error('Error sending SMS to bridge:', error);
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

// Function to read and process SMS (read and send relevant to bridge)
export const readAndProcessSMS = async (hasConsent = true) => {
  try {
    const smsList = await readSMS(hasConsent);
    const filteredSMS = filterMoMoSMS(smsList);
    for (const sms of filteredSMS) {
      await sendSMSToBridge(sms.body);
    }
  } catch (error) {
    console.error('Error processing SMS:', error);
  }
};