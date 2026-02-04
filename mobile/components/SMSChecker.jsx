import React, { useEffect, useRef, useContext, useState, useCallback } from "react";
import { AppState, View, Text } from "react-native";
import { useSelector } from "react-redux";
import { selectSmsEnabled } from "../store/store";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { 
  getAllMessages, 
  isTransactionSMS, 
  startListening, 
  isSmsAvailable 
} from "../services/smsService";
import { parseMoMoSMS } from "../utils/momoTracker";
import { apiCall } from "../services/apiService";
import { addTransaction } from "../store/store";

/**
 * SMSChecker - Background SMS Processing Component
 * 
 * Handles automatic SMS reading, parsing, and transaction creation.
 * Uses refs to prevent race conditions and ensure reliable operation.
 */

// Counter for debugging SMS checks (using ref to persist across renders)
const smsCheckCountRef = { current: 0 };

// Active listener reference
let activeListener = null;

const SMSChecker = () => {
  const smsEnabled = useSelector(selectSmsEnabled);
  const { isAuthenticated, user } = useContext(AuthContext);
  const { showToast } = useToast();
  
  // Refs for race condition prevention
  const isCheckingRef = useRef(false);
  const intervalRef = useRef(null);
  const listenerRef = useRef(null);
  const [isManualCheckLoading, setIsManualCheckLoading] = useState(false);
  const [listenerActive, setListenerActive] = useState(false);
  const [moduleAvailable, setModuleAvailable] = useState(true);

  // Process a single SMS message
  const processSingleMessage = useCallback(async (message) => {
    try {
      // Validate message
      if (!message || !message.body) {
        console.log('[SMS] Skipping invalid message');
        return null;
      }

      // Check if it's a transaction SMS
      if (!isTransactionSMS(message.body)) {
        console.log('[SMS] Non-transaction SMS, skipping');
        return null;
      }

      // Parse the SMS
      const parsed = parseMoMoSMS(message.body);
      if (!parsed) {
        console.log('[SMS] Could not parse SMS');
        return null;
      }

      console.log(`[SMS] Parsed: ${parsed.platform} - GHS ${parsed.amount_received}`);

      // Send to backend
      const response = await apiCall('/api/transactions/', {
        method: 'POST',
        body: JSON.stringify({
          ...parsed,
          // Add metadata
          sms_address: message.address,
          sms_date: message.date,
        }),
      });

      if (response.ok) {
        const transaction = await response.json();
        return transaction;
      } else {
        console.error('[SMS] API error:', response.status);
        return null;
      }
    } catch (error) {
      console.error('[SMS] Process error:', error);
      return null;
    }
  }, []);

  // Check and process SMS messages
  const checkSMS = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckingRef.current) {
      console.log('[SMS] Skipping check - already in progress');
      return;
    }

    if (!smsEnabled || !isAuthenticated) {
      console.log(`[SMS] Skipping - smsEnabled: ${smsEnabled}, auth: ${isAuthenticated}`);
      return;
    }

    isCheckingRef.current = true;
    smsCheckCountRef.current += 1;

    try {
      console.log(`[SMS] Checking for new messages... (check ${smsCheckCountRef.current})`);
      
      // Check module availability
      const { available } = await isSmsAvailable();
      if (!available) {
        console.log('[SMS] SMS module not available');
        setModuleAvailable(false);
        return;
      }

      // Fetch all messages
      const messages = await getAllMessages({ maxCount: 50 });
      
      if (!messages || messages.length === 0) {
        console.log('[SMS] No messages found');
        return;
      }

      console.log(`[SMS] Found ${messages.length} messages`);

      // Process messages
      const newTransactions = [];
      for (const message of messages) {
        const transaction = await processSingleMessage(message);
        if (transaction) {
          newTransactions.push(transaction);
          // Add to Redux store
          addTransaction(transaction);
        }
      }

      if (newTransactions.length > 0) {
        console.log(`[SMS] Created ${newTransactions.length} new transactions`);
        showToast(`Added ${newTransactions.length} new transaction(s)`, 'success');
      }

    } catch (error) {
      console.error('[SMS] Check failed:', error);
      
      let message = 'Failed to process SMS transactions';
      if (error.message.includes('permission')) {
        message = 'SMS permission denied. Please enable SMS access in settings.';
      } else if (error.message.includes('consent')) {
        message = 'SMS consent required to process transactions.';
      } else if (error.message.includes('module_not_found')) {
        message = 'SMS reading not supported on this device.';
      }
      
      showToast(message, 'error');
    } finally {
      isCheckingRef.current = false;
    }
  }, [smsEnabled, isAuthenticated, processSingleMessage, showToast]);

  // Sync missed trips (for when app was closed)
  const syncMissedTrips = useCallback(async () => {
    if (isCheckingRef.current) {
      return [];
    }

    isCheckingRef.current = true;

    try {
      const { available } = await isSmsAvailable();
      if (!available) {
        return [];
      }

      // Get messages from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const messages = await getMessagesByDateRange(oneDayAgo, new Date());
      
      const transactions = [];
      for (const message of messages) {
        const transaction = await processSingleMessage(message);
        if (transaction) {
          transactions.push(transaction);
        }
      }

      return transactions;
    } catch (error) {
      console.error('[SMS] Sync missed trips error:', error);
      return [];
    } finally {
      isCheckingRef.current = false;
    }
  }, [processSingleMessage]);

  // Manual check handler
  const handleManualCheck = useCallback(async () => {
    if (isManualCheckLoading) return;
    setIsManualCheckLoading(true);

    try {
      console.log('[SMS] Manual check started');
      
      const { available } = await isSmsAvailable();
      if (!available) {
        showToast(
          'SMS reading not supported in this environment. Use live tracking for new payments.',
          'info'
        );
        return;
      }

      const transactions = await syncMissedTrips();
      
      if (transactions && transactions.length > 0) {
        showToast(
          `Found ${transactions.length} missed payment(s)`,
          'success'
        );
      } else {
        showToast('No missed payments found', 'info');
      }
    } catch (error) {
      console.error('[SMS] Manual check failed:', error);
      showToast('Failed to check for payments', 'error');
    } finally {
      setIsManualCheckLoading(false);
    }
  }, [isManualCheckLoading, syncMissedTrips, showToast]);

  // Start live SMS tracking
  const startLiveTracking = useCallback(() => {
    if (!smsEnabled || !isAuthenticated) {
      return () => {};
    }

    console.log('[SMS] Starting live tracking...');

    const result = startListening((parsedData) => {
      console.log('[SMS] Live SMS received:', parsedData);
      showToast(`New transaction: GHS ${parsedData.amount}`, 'success');
    });

    if (result.success) {
      listenerRef.current = result.stop;
      setListenerActive(true);
    }

    return () => {
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
        setListenerActive(false);
      }
    };
  }, [smsEnabled, isAuthenticated, showToast]);

  // App state change handler
  useEffect(() => {
    console.log(`[SMS] App state effect - smsEnabled: ${smsEnabled}, auth: ${isAuthenticated}`);

    const handleAppStateChange = (nextAppState) => {
      console.log(`[SMS] App state changed to: ${nextAppState}`);
      
      if (nextAppState === 'active') {
        // App came to foreground - check for new SMS
        console.log('[SMS] App foregrounded, checking SMS');
        checkSMS();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    // Initial check on mount
    if (smsEnabled && isAuthenticated) {
      console.log('[SMS] Initial SMS check');
      checkSMS();
    }

    return () => {
      console.log('[SMS] App state effect cleanup');
      subscription?.remove();
    };
  }, [smsEnabled, isAuthenticated, checkSMS]);

  // Live tracking effect
  useEffect(() => {
    let cleanup = () => {};

    if (smsEnabled && isAuthenticated && moduleAvailable) {
      console.log('[SMS] Setting up live tracking');
      cleanup = startLiveTracking();
    }

    return () => {
      cleanup();
    };
  }, [smsEnabled, isAuthenticated, moduleAvailable, startLiveTracking]);

  // Periodic polling effect (backup for when app is in background)
  useEffect(() => {
    // Only set up polling on Android (iOS doesn't support background execution)
    if (Platform.OS !== 'android') {
      return;
    }

    if (smsEnabled && isAuthenticated && moduleAvailable) {
      console.log('[SMS] Setting up 5-minute polling');
      intervalRef.current = setInterval(checkSMS, 5 * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) {
        console.log('[SMS] Clearing polling interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [smsEnabled, isAuthenticated, moduleAvailable, checkSMS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[SMS] Component unmounting, cleaning up...');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
    };
  }, []);

  // This component runs SMS checks in the background
  // No visible UI - it's just for background processing
  return null;
};

// Export functions for external use
export const readAndProcessSMS = async (force = false) => {
  if (!force && smsCheckCountRef.current > 0) {
    // Skip if recently checked
    const lastCheck = Date.now();
    if (Date.now() - lastCheck < 60000) {
      console.log('[SMS] Skipping recent check');
      return;
    }
  }
  
  // The actual implementation is in the component via checkSMS
  // This is a placeholder for external API
  console.log('[SMS] readAndProcessSMS called');
};

export { SMSChecker as default };
