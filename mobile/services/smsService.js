import { PermissionsAndroid, DeviceEventEmitter, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { startReadSMS, stopReadSMS } from "@maniac-tech/react-native-expo-read-sms";
import SmsAndroid from "react-native-get-sms-android";
import { parseMoMoSMS } from "../utils/momoTracker";
import { apiCall } from "./apiService";
import { store } from "../store/store";
import { addTransaction, setSummary } from "../store/store";

// Flag to check if SMS library is available (requires development build)
let isSMSLibraryAvailable = true;

// Function to check if SMS library is properly initialized
const isSMSReadingAvailable = () => {
  if (Platform.OS !== 'android') {
    console.log('[SMS] SMS reading only supported on Android');
    return false;
  }
  
  if (!startReadSMS || typeof startReadSMS !== 'function') {
    console.warn('[SMS] startReadSMS function not available - requires development build');
    isSMSLibraryAvailable = false;
    return false;
  }
  
  return true;
};

// Counter for debugging permission requests
let permissionRequestCount = 0;

// Key for storing last processed SMS timestamp
const LAST_PROCESSED_SMS_KEY = "lastProcessedSMSTimestamp";

// Function to get last processed SMS timestamp
export const getLastProcessedSMSTimestamp = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_PROCESSED_SMS_KEY);
    return timestamp ? parseInt(timestamp) : null;
  } catch (error) {
    console.error("Error getting last processed SMS timestamp:", error);
    return null;
  }
};

// Function to set last processed SMS timestamp
export const setLastProcessedSMSTimestamp = async (timestamp) => {
  try {
    await AsyncStorage.setItem(LAST_PROCESSED_SMS_KEY, timestamp.toString());
  } catch (error) {
    console.error("Error setting last processed SMS timestamp:", error);
  }
};

// Helper function to check if a transaction with the given tx_id already exists in Redux store
const isTransactionDuplicate = (tx_id) => {
  const state = store.getState();
  return state.data.transactions.some((tx) => tx.tx_id === tx_id);
};

// Function to request SMS permissions
export const requestSMSPermissions = async () => {
  console.log("requestSMSPermissions called");
  try {
    // First, check current permission status to handle revocations
    const readSmsStatus = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    );
    const receiveSmsStatus = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    );
    const currentStatus = readSmsStatus && receiveSmsStatus;
    console.log("Current READ_SMS permission status:", readSmsStatus);
    console.log("Current RECEIVE_SMS permission status:", receiveSmsStatus);
    console.log("Overall SMS permission status:", currentStatus);

    if (currentStatus) {
      // Permission is currently granted, cache it
      console.log("Permission currently granted, caching as true");
      try {
        await AsyncStorage.setItem("smsPermissionGranted", "true");
      } catch (err) {
        console.warn("Error caching permission:", err);
      }
      return true;
    } else {
      // Permission is not granted, check cache to see if it was previously granted (revoked)
      const cachedStatus = await AsyncStorage.getItem("smsPermissionGranted");
      console.log("Cached permission status:", cachedStatus);
      if (cachedStatus === "true") {
        // Permission was revoked, update cache
        console.log("SMS permission was revoked, updating cache to false");
        try {
          await AsyncStorage.setItem("smsPermissionGranted", "false");
        } catch (err) {
          console.warn("Error updating cached permission:", err);
        }
        return false;
      }
      // Permission not granted and not previously granted, request it
      console.log("Permission not granted and not cached, will request");
    }
  } catch (err) {
    console.warn("Error checking current permission status:", err);
    // Fall back to cached status or request
    try {
      const cachedStatus = await AsyncStorage.getItem("smsPermissionGranted");
      if (cachedStatus !== null) {
        const isGranted = cachedStatus === "true";
        console.log("Falling back to cached SMS permission status:", isGranted);
        return isGranted;
      }
    } catch (cacheErr) {
      console.warn("Error reading cached permission:", cacheErr);
    }
  }

  permissionRequestCount++;
  console.log(
    `About to request SMS permission (attempt ${permissionRequestCount})`,
  );
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);
    console.log("Permission request result:", granted);
    const readSmsGranted = granted[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED;
    const receiveSmsGranted = granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED;
    const isGranted = readSmsGranted && receiveSmsGranted;
    console.log("Is READ_SMS granted:", readSmsGranted);
    console.log("Is RECEIVE_SMS granted:", receiveSmsGranted);
    console.log("Is permission granted:", isGranted);
    // Cache the result
    try {
      await AsyncStorage.setItem("smsPermissionGranted", isGranted.toString());
    } catch (err) {
      console.warn("Error caching permission:", err);
    }
    return isGranted;
  } catch (err) {
    console.warn("Error in requestSMSPermissions:", err);
    // Cache as false
    try {
      await AsyncStorage.setItem("smsPermissionGranted", "false");
    } catch (cacheErr) {
      console.warn("Error caching permission:", cacheErr);
    }
    return false;
  }
};

// Function to read SMS messages (deprecated, using only for manual sync if needed)
export const readSMS = async (hasConsent = true, minDate = null) => {
  console.log(
    "[DEBUG] readSMS called with hasConsent:",
    hasConsent,
    "minDate:",
    minDate,
  );
  try {
    console.log("[DEBUG] SmsAndroid object:", SmsAndroid);
    if (!hasConsent) {
      console.log("[DEBUG] SMS consent not given");
      throw new Error("SMS consent not given");
    }
    const hasPermission = await requestSMSPermissions();
    console.log("[DEBUG] Has permission:", hasPermission);
    if (!hasPermission) {
      console.log("[DEBUG] SMS permission not granted");
      throw new Error("SMS permission not granted");
    }

    const filter = {
      box: "inbox",
      maxCount: 50, // Read last 50 SMS or newer than minDate
    };
    if (minDate !== null) {
      filter.minDate = minDate;
    }
    console.log("[DEBUG] Filter:", filter);

    if (!SmsAndroid || !SmsAndroid.list) {
      console.log("[DEBUG] SmsAndroid not available");
      throw new Error(
        "SMS reading library not available. Please ensure you're using a development build or custom client.",
      );
    }

    if (!SmsAndroid || typeof SmsAndroid.list !== "function") {
      console.log("[DEBUG] SmsAndroid.list not a function");
      throw new Error(
        "SMS reading library not available. Please ensure you're using a development build or custom client.",
      );
    }

    console.log("[DEBUG] Calling SmsAndroid.list");
    const smsList = await new Promise((resolve, reject) => {
      SmsAndroid.list(filter, (error, smsList) => {
        console.log(
          "[DEBUG] SmsAndroid.list callback - error:",
          error,
          "smsList length:",
          smsList ? smsList.length : 0,
        );
        if (error) {
          reject(error);
        } else {
          resolve(smsList);
        }
      });
    });
    console.log("[DEBUG] SMS list retrieved, length:", smsList.length);

    return smsList;
  } catch (error) {
    console.log("[DEBUG] Error in readSMS:", error.message);
    if (!error.message.includes("permission")) {
      console.error("Error reading SMS:", error);
    }
    throw error;
  }
};

// Function to send parsed SMS data to backend API
export const sendParsedSMSToAPI = async (parsedData) => {
  try {
    // Check if transaction with this tx_id already exists in Redux store
    if (isTransactionDuplicate(parsedData.tx_id)) {
      console.log(
        `Skipping duplicate transaction with tx_id: ${parsedData.tx_id}`,
      );
      return null; // Return null to indicate duplicate
    }

    const response = await apiCall("/api/transactions/", {
      method: "POST",
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
    console.error("Error sending parsed SMS to API:", error);
    throw error;
  }
};

// Function to check if an SMS is a MoMo transaction message
export const isMoMoTransactionSMS = (sms) => {
  const body = sms.body.toLowerCase();
  console.log(`Checking SMS for MoMo pattern: ${body}`);
  // Check for presence of GHS (Ghana Cedis) and transaction keywords
  const hasAmount = body.includes("ghs");
  const hasTransactionKeyword =
    /\b(received|sent|transfer|payment|bought|charged|debited|credited)\b/.test(
      body,
    );
  const hasRef = body.includes("ref:") || body.includes("reference");
  // Additional check for common MoMo patterns
  const hasMoMoIndicator =
    body.includes("mobile money") ||
    body.includes("momo") ||
    body.includes("mtn");

  const isMoMo =
    hasAmount && (hasTransactionKeyword || hasRef || hasMoMoIndicator);
  console.log(
    `SMS is MoMo transaction: ${isMoMo} (hasAmount: ${hasAmount}, hasTransactionKeyword: ${hasTransactionKeyword}, hasRef: ${hasRef}, hasMoMoIndicator: ${hasMoMoIndicator})`,
  );
  return isMoMo;
};

// Function to filter MoMo transaction SMS from a list
export const filterMoMoSMS = (smsList) => {
  return smsList.filter(isMoMoTransactionSMS);
};

// Function to read and process SMS (deprecated, use live tracking instead)
export const readAndProcessSMS = async (hasConsent = true) => {
  console.log("[DEBUG] readAndProcessSMS called (deprecated)");

  // Check if SMS reading is available
  if (!SmsAndroid || typeof SmsAndroid.list !== "function") {
    console.log("[DEBUG] SMS bulk reading not available - skipping");
    return;
  }

  const lastTimestamp = await getLastProcessedSMSTimestamp();
  console.log("[DEBUG] Last timestamp:", lastTimestamp);
  const smsList = await readSMS(hasConsent, lastTimestamp);
  console.log("[DEBUG] SMS list length:", smsList.length);
  const filteredSMS = filterMoMoSMS(smsList);
  console.log("[DEBUG] Filtered MoMo SMS:", filteredSMS.length);
  let latestTimestamp = lastTimestamp || 0;
  for (const sms of filteredSMS) {
    console.log("[DEBUG] Processing SMS date:", sms.date);
    const parsed = parseMoMoSMS(sms.body);
    if (parsed) {
      console.log("[DEBUG] Parsed:", parsed);
      const result = await sendParsedSMSToAPI(parsed);
      if (result === null) {
        console.log(
          "[DEBUG] Skipped duplicate transaction from SMS processing",
        );
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
    console.log("[DEBUG] Updated timestamp to:", latestTimestamp);
  }
};

// Live tracking listener
let smsEventListener = null;

// Function to start live SMS tracking
export const startLiveTracking = (onNewTrip) => {
  console.log("[SMS] startLiveTracking called");
  
  // Check if SMS reading is available
  if (!isSMSReadingAvailable()) {
    console.error("[SMS] SMS reading not available - cannot start tracking");
    console.error("[SMS] This feature requires a development build (not Expo Go)");
    console.error("[SMS] Run: npx expo run:android --configuration Debug");
    return () => {};
  }
  
  // Remove any existing listener
  if (smsEventListener) {
    smsEventListener.remove();
    smsEventListener = null;
  }

  // Listen for incoming SMS via DeviceEventEmitter (correct API for this library)
  smsEventListener = DeviceEventEmitter.addListener('received_sms', async (smsData) => {
    console.log("Received SMS event:", smsData);
    
    // Parse the SMS data - the library returns array format [address, body]
    let address = "";
    let body = "";
    
    try {
      // The library returns a string representation of an array
      const parsed = JSON.parse(smsData);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        address = parsed[0];
        body = parsed[1];
      } else if (typeof parsed === 'object' && parsed !== null) {
        address = parsed[0] || "";
        body = parsed[1] || "";
      }
    } catch (e) {
      console.error("Error parsing SMS data:", e);
    }
    
    console.log("SMS from:", address, "Body:", body);
    const parsed = parseMoMoSMS(body);

    if (parsed) {
      // Send to API and notify only if not a duplicate
      try {
        const result = await sendParsedSMSToAPI(parsed);
        if (result !== null) {
          onNewTrip(parsed);
        }
      } catch (error) {
        console.error("Error processing live SMS:", error);
      }
    }
  });

  // Start the SMS receiver using the correct callback API
  try {
    startReadSMS(
      (success) => {
        console.log("SMS listener started successfully:", success);
      },
      (error) => {
        console.error("Failed to start SMS listener:", error);
        isSMSLibraryAvailable = false;
      }
    );
  } catch (error) {
    console.error("Error starting SMS listener:", error);
    isSMSLibraryAvailable = false;
  }

  // Return a function to stop the listener
  return () => {
    console.log("Stopping SMS tracking");
    if (smsEventListener) {
      smsEventListener.remove();
      smsEventListener = null;
    }
    // Also try to call stopReadSMS if available
    try {
      if (stopReadSMS && typeof stopReadSMS === 'function') {
        stopReadSMS();
      }
    } catch (e) {
      // Ignore if not available
    }
  };
};

// Scanner for missed trips
export const syncMissedTrips = async () => {
  try {
    console.log("Starting syncMissedTrips");

    // Check if SMS reading is available (not supported in Expo)
    if (!SmsAndroid || typeof SmsAndroid.list !== "function") {
      console.log("SMS bulk reading not available in this environment (Expo limitation)");
      console.log("Relying on live SMS tracking for new transactions");
      return [];
    }

    const lastTimestamp = await getLastProcessedSMSTimestamp();
    console.log("Last processed timestamp:", lastTimestamp);
    const smsList = await readSMS(true, lastTimestamp);
    console.log("SMS list length:", smsList.length);
    const newTrips = [];
    let latestTimestamp = lastTimestamp || 0;

    for (const sms of smsList) {
      console.log(
        "Processing SMS:",
        sms.body.substring(0, 100),
        "... Date:",
        sms.date,
      );
      const parsed = parseMoMoSMS(sms.body);
      if (parsed) {
        console.log("Parsed SMS:", parsed);
        try {
          const result = await sendParsedSMSToAPI(parsed);
          if (result !== null) {
            newTrips.push(parsed);
            console.log("Added new trip:", parsed.tx_id);
          } else {
            console.log("Skipped duplicate trip:", parsed.tx_id);
          }
        } catch (error) {
          console.error("Error sending missed trip to API:", error);
        }
      } else {
        console.log("SMS not parsed as MoMo transaction");
      }
      // Update latest timestamp
      if (sms.date > latestTimestamp) {
        latestTimestamp = sms.date;
      }
    }

    console.log("New trips found:", newTrips.length);
    // Set the last processed timestamp
    if (latestTimestamp > (lastTimestamp || 0)) {
      await setLastProcessedSMSTimestamp(latestTimestamp);
      console.log("Updated last processed timestamp to:", latestTimestamp);
    }

    return newTrips;
  } catch (error) {
    if (error.message.includes("permission")) {
      console.log("Permission denied for SMS access");
      // Permission denied, return empty array silently
      return [];
    }
    if (error.message.includes("SMS reading library not available")) {
      console.log("SMS bulk reading not supported in Expo - using live tracking only");
      return [];
    }
    console.error("Error syncing missed trips:", error);
    throw error; // Re-throw other errors
  }
};
