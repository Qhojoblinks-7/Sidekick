import { Platform } from 'react-native';

let SMSModule;

if (Platform.OS === 'android') {
  SMSModule = require('react-native').NativeModules.ExpoSmsAndroid;
} else {
  SMSModule = require('expo-sms');
}

/**
 * Request SMS permissions
 * @returns {Promise<boolean>} True if permissions granted
 */
export const requestSmsPermission = async () => {
  if (Platform.OS === 'android') {
    const { hasPermission } = await SMSModule.hasPermission();
    return hasPermission;
  } else {
    const { status } = await SMSModule.requestPermissionsAsync();
    return status === 'granted';
  }
};

/**
 * Check if SMS permissions are granted
 * @returns {Promise<boolean>} True if permissions granted
 */
export const hasSmsPermission = async () => {
  if (Platform.OS === 'android') {
    const { hasPermission } = await SMSModule.hasPermission();
    return hasPermission;
  } else {
    const { status } = await SMSModule.requestPermissionsAsync();
    return status === 'granted';
  }
};

/**
 * Get all SMS messages
 * @returns {Promise<Array>} Array of SMS messages
 */
export const getAllMessages = async () => {
  if (Platform.OS === 'android') {
    return await SMSModule.getAllMessages();
  } else {
    const { isAvailable } = await SMSModule.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('SMS is not available on this device');
    }
    const messages = await SMSModule.getMessagesAsync();
    return messages.map(msg => ({
      id: msg.id || Date.now(),
      address: msg.address || '',
      body: msg.body || '',
      date: msg.date ? new Date(msg.date).getTime() : Date.now(),
      type: msg.type === 'incoming' ? 1 : 2
    }));
  }
};

/**
 * Start listening for incoming SMS messages
 * @param {Function} callback Callback function when SMS is received
 * @returns {Promise<boolean>} True if started successfully
 */
export const startListening = async (callback) => {
  if (Platform.OS === 'android') {
    const { DeviceEventEmitter } = require('react-native');
    DeviceEventEmitter.addListener('onSMSReceived', callback);
    const result = await SMSModule.startListening();
    return result;
  } else {
    // iOS doesn't support background SMS listening
    console.warn('Background SMS listening is not supported on iOS');
    return false;
  }
};

/**
 * Stop listening for incoming SMS messages
 * @returns {Promise<boolean>} True if stopped successfully
 */
export const stopListening = async () => {
  if (Platform.OS === 'android') {
    return await SMSModule.stopListening();
  } else {
    return true;
  }
};

export default {
  requestSmsPermission,
  hasSmsPermission,
  getAllMessages,
  startListening,
  stopListening
};
