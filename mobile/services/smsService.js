import { Platform, NativeModules, DeviceEventEmitter } from 'react-native';

/**
 * SMS Service Module
 * 
 * Provides unified SMS reading capabilities across Android and iOS platforms.
 * Includes safe NativeModule resolution for compatibility with custom ROMs.
 */

// Safe NativeModule resolution strategy
// Different devices may have different module names or missing bridges
const resolveSMSModule = () => {
  if (Platform.OS !== 'android') {
    return null;
  }

  // Try multiple module names for compatibility
  const moduleNames = [
    'ExpoSmsAndroid',
    'SmsAndroid', 
    'ExpoReadSms',  // Alternative package
    'RNSmsAndroid',
  ];

  for (const moduleName of moduleNames) {
    try {
      const module = NativeModules[moduleName];
      if (module && typeof module.getAllMessages === 'function') {
        console.log(`[SMS] Successfully resolved: ${moduleName}`);
        return { module, name: moduleName };
      }
    } catch (error) {
      console.log(`[SMS] Module not found: ${moduleName}`);
    }
  }

  console.warn('[SMS] No compatible SMS module found');
  return null;
};

// Lazy initialization to prevent startup crashes
let smsModuleCache = null;
let iosModuleAvailable = null;

const getAndroidModule = () => {
  if (smsModuleCache) {
    return smsModuleCache;
  }
  smsModuleCache = resolveSMSModule();
  return smsModuleCache;
};

const checkIOSAvailability = async () => {
  if (iosModuleAvailable !== null) {
    return iosModuleAvailable;
  }
  
  try {
    const expoSms = require('expo-sms');
    const { isAvailable } = await expoSms.isAvailableAsync();
    iosModuleAvailable = isAvailable;
    return iosModuleAvailable;
  } catch (error) {
    console.warn('[SMS] iOS SMS module check failed:', error.message);
    iosModuleAvailable = false;
    return false;
  }
};

/**
 * Request SMS permissions
 * @returns {Promise<{granted: boolean, status: string}>} Permission status
 */
export const requestSmsPermission = async () => {
  console.log('[SMS] Requesting SMS permission...');
  
  if (Platform.OS === 'android') {
    const android = getAndroidModule();
    if (!android) {
      return { granted: false, status: 'module_not_found' };
    }
    
    try {
      const result = await android.module.hasPermission?.() ?? false;
      console.log('[SMS] Android permission granted:', result);
      return { granted: result, status: result ? 'granted' : 'denied' };
    } catch (error) {
      console.error('[SMS] Permission check error:', error);
      return { granted: false, status: 'error', error: error.message };
    }
  } else {
    try {
      const expoSms = require('expo-sms');
      const { status } = await expoSms.requestPermissionsAsync();
      const granted = status === 'granted';
      console.log('[SMS] iOS permission status:', status);
      return { granted, status };
    } catch (error) {
      console.error('[SMS] iOS permission error:', error);
      return { granted: false, status: 'error', error: error.message };
    }
  }
};

/**
 * Check if SMS permissions are currently granted
 * @returns {Promise<boolean>} True if permissions granted
 */
export const hasSmsPermission = async () => {
  const result = await requestSmsPermission();
  return result.granted;
};

/**
 * Check if SMS functionality is available on the device
 * @returns {Promise<{available: boolean, reason?: string}>}
 */
export const isSmsAvailable = async () => {
  if (Platform.OS === 'android') {
    const android = getAndroidModule();
    if (!android) {
      return { available: false, reason: 'No compatible SMS module found' };
    }
    return { available: true, module: android.name };
  } else {
    const available = await checkIOSAvailability();
    if (!available) {
      return { available: false, reason: 'SMS not available on this iOS device' };
    }
    return { available: true };
  }
};

/**
 * Get all SMS messages
 * @param {Object} options - Options for filtering
 * @param {number} options.maxCount - Maximum messages to retrieve (default: 100)
 * @param {string} options.filterAddress - Filter by sender address
 * @returns {Promise<Array>} Array of SMS messages
 */
export const getAllMessages = async (options = {}) => {
  const { maxCount = 100, filterAddress } = options;
  
  console.log(`[SMS] Fetching messages (max: ${maxCount})...`);
  
  if (Platform.OS === 'android') {
    const android = getAndroidModule();
    if (!android) {
      throw new Error('SMS module not available on this device');
    }
    
    try {
      const messages = await android.module.getAllMessages?.() ?? [];
      
      // Apply filtering if specified
      if (filterAddress) {
        return messages.filter(msg => 
          msg.address?.toLowerCase().includes(filterAddress.toLowerCase())
        );
      }
      
      return messages.slice(0, maxCount);
    } catch (error) {
      console.error('[SMS] Error fetching messages:', error);
      throw new Error(`Failed to fetch SMS: ${error.message}`);
    }
  } else {
    try {
      const expoSms = require('expo-sms');
      const messages = await expoSms.getMessagesAsync?.() ?? [];
      
      // Normalize iOS message format to match Android
      return messages.map(msg => ({
        id: msg.id || Date.now() + Math.random(),
        address: msg.address || '',
        body: msg.body || '',
        date: msg.date ? new Date(msg.date).getTime() : Date.now(),
        type: msg.type === 'incoming' ? 1 : 2,
      })).slice(0, maxCount);
    } catch (error) {
      console.error('[SMS] iOS error fetching messages:', error);
      throw new Error(`iOS SMS fetch failed: ${error.message}`);
    }
  }
};

/**
 * Get messages filtered by date range
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<Array>} Filtered messages
 */
export const getMessagesByDateRange = async (startDate, endDate) => {
  const messages = await getAllMessages({ maxCount: 1000 });
  
  return messages.filter(msg => {
    const msgDate = new Date(msg.date);
    return msgDate >= startDate && msgDate <= endDate;
  });
};

/**
 * Start listening for incoming SMS messages (Android only)
 * @param {Function} callback Callback function when SMS is received
 * @returns {Promise<{success: boolean, stop: Function}>}
 */
export const startListening = async (callback) => {
  console.log('[SMS] Starting real-time listener...');
  
  if (Platform.OS === 'android') {
    const android = getAndroidModule();
    if (!android) {
      console.warn('[SMS] Cannot start listener - no module available');
      return { success: false, stop: () => {} };
    }
    
    try {
      // Register event listener
      const listener = DeviceEventEmitter.addListener('onSMSReceived', (messages) => {
        console.log(`[SMS] Received ${messages?.length || 0} messages`);
        if (callback && Array.isArray(messages)) {
          messages.forEach(msg => callback(msg));
        }
      });
      
      // Start native listening
      await android.module.startListening?.();
      
      console.log('[SMS] Real-time listener started successfully');
      
      return {
        success: true,
        stop: () => {
          listener.remove();
          android.module.stopListening?.();
          console.log('[SMS] Real-time listener stopped');
        }
      };
    } catch (error) {
      console.error('[SMS] Failed to start listener:', error);
      return { success: false, stop: () => {}, error: error.message };
    }
  } else {
    console.warn('[SMS] Background SMS listening not supported on iOS');
    return { 
      success: false, 
      stop: () => {},
      reason: 'iOS does not support background SMS listening' 
    };
  }
};

/**
 * Stop listening for incoming SMS messages
 * @returns {Promise<boolean>} True if stopped successfully
 */
export const stopListening = async () => {
  if (Platform.OS === 'android') {
    const android = getAndroidModule();
    if (!android) return false;
    
    try {
      await android.module.stopListening?.();
      return true;
    } catch (error) {
      console.error('[SMS] Error stopping listener:', error);
      return false;
    }
  }
  return true;
};

/**
 * Validate SMS message structure
 * @param {Object} message - SMS message object
 * @returns {boolean} True if message has required fields
 */
export const isValidMessage = (message) => {
  return (
    message &&
    typeof message === 'object' &&
    (message.body || message.body?.length > 0) &&
    (message.address || message.date)
  );
};

/**
 * Parse SMS content to check if it's a transaction
 * @param {string} body - SMS message body
 * @returns {boolean} True if likely a transaction SMS
 */
export const isTransactionSMS = (body) => {
  if (!body || typeof body !== 'string') return false;
  
  const transactionPatterns = [
    /you have received/i,
    /GHS\s+\d+\.\d+/i,
    /mobile money/i,
    /transaction id/i,
    /ref:/i,
    /balance/i,
  ];
  
  return transactionPatterns.some(pattern => pattern.test(body));
};

export default {
  requestSmsPermission,
  hasSmsPermission,
  isSmsAvailable,
  getAllMessages,
  getMessagesByDateRange,
  startListening,
  stopListening,
  isValidMessage,
  isTransactionSMS,
};
