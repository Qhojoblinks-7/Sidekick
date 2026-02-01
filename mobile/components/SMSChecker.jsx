import React, { useEffect, useRef, useContext, useState } from "react";
import { AppState, View, Text } from "react-native";
import { Button } from "../components/ui/Button";
import { useSelector } from "react-redux";
import { selectSmsEnabled } from "../store/store";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { readAndProcessSMS, syncMissedTrips, startLiveTracking } from "../services/smsService";
import { addTransaction } from "../store/store";

// Counter for debugging SMS checks
let smsCheckCount = 0;
// Flag to prevent simultaneous SMS checks
let isChecking = false;

const SMSChecker = () => {
  const smsEnabled = useSelector(selectSmsEnabled);
  const { isAuthenticated } = useContext(AuthContext);
  const { showToast } = useToast();
  const intervalRef = useRef(null);
  const [isManualCheckLoading, setIsManualCheckLoading] = useState(false);
  const [listenerActive, setListenerActive] = useState(false);

  const checkSMS = async () => {
    console.log(
      `[DEBUG] checkSMS called: smsEnabled=${smsEnabled}, isAuthenticated=${isAuthenticated}, isChecking=${isChecking}`,
    );
    if (smsEnabled && isAuthenticated && !isChecking) {
      isChecking = true;
      smsCheckCount++;
      console.log(
        `[DEBUG] Checking for new SMS transactions... (check ${smsCheckCount})`,
      );
      try {
        await readAndProcessSMS(true);
        console.log(
          `[DEBUG] SMS check ${smsCheckCount} completed successfully`,
        );
      } catch (error) {
        console.error("SMS processing failed:", error);
        let message = "Failed to process SMS transactions";
        if (error.message.includes("permission")) {
          message =
            "SMS permission denied. Please enable SMS access in settings.";
        } else if (error.message.includes("consent")) {
          message = "SMS consent required to process transactions.";
        }
        showToast(message, "error");
      } finally {
        isChecking = false;
      }
    } else {
      console.log(
        `[DEBUG] Skipping SMS check: smsEnabled=${smsEnabled}, isAuthenticated=${isAuthenticated}, isChecking=${isChecking}`,
      );
    }
  };

  const handleManualCheck = async () => {
    if (isManualCheckLoading) return;
    setIsManualCheckLoading(true);
    console.log("[DEBUG] Manual check for payments started");

    try {
      // Check if SMS bulk reading is available
      let smsAvailable = false;
      try {
        const SmsAndroid = require("react-native-get-sms-android");
        smsAvailable = SmsAndroid && typeof SmsAndroid.list === "function";
      } catch (e) {
        smsAvailable = false;
      }

      if (!smsAvailable) {
        showToast(
          "SMS bulk reading not available in Expo. Use live tracking for new payments.",
          "info",
        );
        return;
      }

      // Use existing syncMissedTrips function to check for missed payments
      const missedPayments = await syncMissedTrips();
      if (missedPayments && missedPayments.length > 0) {
        showToast(
          `Found ${missedPayments.length} missed payment(s)`,
          "success",
        );
      } else {
        showToast("No missed payments found", "info");
      }
    } catch (error) {
      console.error("[DEBUG] Manual check failed:", error);
      if (error.message.includes("SMS reading library not available")) {
        showToast("SMS reading not supported in this environment", "warning");
      } else {
        showToast("Failed to check for payments", "error");
      }
    } finally {
      setIsManualCheckLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      `SMSChecker: useEffect for app state - smsEnabled: ${smsEnabled}, isAuthenticated: ${isAuthenticated}`,
    );
    const handleAppStateChange = (nextAppState) => {
      console.log(`SMSChecker: App state changed to: ${nextAppState}`);
      if (nextAppState === "active") {
        console.log("SMSChecker: App became active, triggering SMS check");
        checkSMS();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    // Initial check when component mounts
    console.log(`SMSChecker: Component mounted, performing initial SMS check`);
    checkSMS();

    return () => {
      console.log(
        "SMSChecker: Component unmounting, removing app state listener",
      );
      subscription?.remove();
    };
  }, [smsEnabled, isAuthenticated]);

  // Start live SMS tracking when SMS is enabled and user is authenticated
  useEffect(() => {
    let stopTracking = null;
    
    if (smsEnabled && isAuthenticated) {
      console.log("SMSChecker: Starting live SMS tracking");
      stopTracking = startLiveTracking((parsedData) => {
        console.log("SMSChecker: Live SMS received:", parsedData);
        showToast(`New transaction: GHS ${parsedData.amount}`, "success");
      });
    }

    return () => {
      if (stopTracking) {
        console.log("SMSChecker: Stopping live SMS tracking");
        stopTracking();
      }
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

  // This component runs SMS checks in the background
  // No visible UI - it's just for background processing
  return null;
};

export default SMSChecker;
