import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  Modal,
} from "react-native";
import { Button } from "../../components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../../contexts/ThemeContext";
import { apiCall } from "../../services/apiService";
import { requestSMSPermissions } from "../../services/smsService";
import SMSConsentModal from "../../components/SMSConsentModal";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import {
  setOnline,
  setSyncing,
  setLastSyncTime,
  setDailyTarget,
  setVehicleType,
  setSmsEnabled,
  setSummary,
  setTransactions,
  setExpenses,
  updatePlatformDebt,
} from "../../store/store";
import { useAuth } from "../../hooks/useAuth";

export default function Settings() {
  const { colors } = useContext(ThemeContext);
  const dispatch = useDispatch();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { isOnline, isSyncing, lastSyncTime } = useSelector(
    (state) => state.ui,
  );
  const { dailyTarget, vehicleType, smsEnabled } = useSelector(
    (state) => state.settings,
  );
  const { summary, transactions } = useSelector((state) => state.data);

  // Calculate rider stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyEarnings = transactions
    .filter((tx) => {
      const txDate = new Date(tx.created_at);
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, tx) => sum + parseFloat(tx.rider_profit || 0), 0);

  const bestTip = Math.max(
    ...transactions.map((tx) => parseFloat(tx.rider_profit || 0)),
    0,
  );

  // Modal states
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [smsConsentModalVisible, setSmsConsentModalVisible] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [tempTarget, setTempTarget] = useState("");

  const vehicleTypes = ["Bicycle", "Motorcycle", "Car"];

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            await logout();
            router.replace("/auth");
          },
          style: "destructive",
        },
      ],
      { cancelable: false },
    );
  };

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await apiCall("/api/summary/daily/");
      dispatch(setOnline(response.ok));
    } catch (error) {
      dispatch(setOnline(false));
    }
  };

  const syncData = async () => {
    if (isSyncing) return;

    dispatch(setSyncing(true));

    // Timeout after 5 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const fetchOptions = { signal: controller.signal };

      const [summaryRes, transactionsRes, expensesRes] = await Promise.all([
        apiCall("/api/summary/daily/"),
        apiCall("/api/transactions/"),
        apiCall("/api/expenses/"),
      ]);

      if (!summaryRes.ok || !transactionsRes.ok || !expensesRes.ok) {
        throw new Error("Failed to sync data");
      }

      const summaryData = await summaryRes.json();
      const transactionsData = await transactionsRes.json();
      const expensesData = await expensesRes.json();

      // Update Redux store with fresh data
      dispatch(setSummary(summaryData));
      dispatch(setTransactions(transactionsData));
      dispatch(setExpenses(expensesData));

      // Update connection status and sync time
      dispatch(setOnline(true));
      dispatch(setLastSyncTime(new Date().getTime()));

      clearTimeout(timeoutId);
      showAlert("Sync Complete", "Profit dashboard updated.");
    } catch (error) {
      if (error.name === "AbortError") {
        showAlert("Timeout", "Server is taking too long to respond.");
      } else {
        showAlert("Sync Failed", "Cannot reach Sidekick Backend.");
      }
    } finally {
      dispatch(setSyncing(false));
    }
  };

  const handleClearDebt = async () => {
    Alert.alert(
      "Settle Debt",
      "Are you sure you have paid Bolt/Yango? This will reset your Debt Card to GH₵ 0.00.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Paid",
          onPress: async () => {
            try {
              // Update Redux store to clear debt
              dispatch(updatePlatformDebt(0));
              showAlert("Success", "Platform debt has been cleared.");
            } catch (error) {
              showAlert("Error", "Failed to clear debt. Please try again.");
            }
          },
        },
      ],
    );
  };

  const handleTargetChange = () => {
    setTempTarget(dailyTarget);
    setTargetModalVisible(true);
  };

  const saveTarget = () => {
    const value = parseFloat(tempTarget);
    if (isNaN(value) || value <= 0) {
      showAlert("Invalid Amount", "Please enter a valid target amount.");
      return;
    }
    dispatch(setDailyTarget(value));
    setTargetModalVisible(false);
  };

  const handleVehicleChange = () => {
    setVehicleModalVisible(true);
  };

  const selectVehicle = (type) => {
    dispatch(setVehicleType(type));
    setVehicleModalVisible(false);
  };

  const handleSmsToggle = () => {
    if (smsEnabled) {
      // Disable SMS
      dispatch(setSmsEnabled(false));
      showAlert("SMS Disabled", "SMS capture has been turned off.");
    } else {
      // Show consent modal
      setSmsConsentModalVisible(true);
    }
  };

  const handleSmsConsent = async () => {
    setSmsConsentModalVisible(false);
    try {
      const hasPermission = await requestSMSPermissions();
      if (hasPermission) {
        dispatch(setSmsEnabled(true));
        showAlert("SMS Enabled", "SMS capture is now active. Transaction messages will be automatically processed.");
      } else {
        showAlert("Permission Denied", "SMS permission is required to enable SMS capture.");
      }
    } catch (error) {
      showAlert("Error", "Failed to request SMS permissions.");
    }
  };

  const handleSmsDeny = () => {
    setSmsConsentModalVisible(false);
  };

  const handleSignOut = () => {
    handleLogout();
  };

  const SettingOption = ({ icon, label, value, onPress, isSyncing }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 20,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 12,
      }}
      disabled={isSyncing}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Ionicons name={icon} size={20} color={colors.textMuted} />
        <Text
          style={{
            color: colors.textMain,
            marginLeft: 12,
            fontWeight: "bold",
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          color: colors.profit,
          fontWeight: "bold",
        }}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      height: 600,
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 100,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 16,
    },
    title: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    mainTitle: {
      color: colors.textMain,
      fontSize: 30,
      fontWeight: "900",
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginBottom: 16,
      marginLeft: 8,
    },
    profileContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 24,
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: 14,
      flex: 1,
      marginLeft: 12,
    },
    statValue: {
      color: colors.profit,
      fontSize: 18,
      fontWeight: "bold",
    },
    settlementBox: {
      backgroundColor: colors.card,
      padding: 24,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      marginBottom: 32,
    },
    settlementText: {
      color: colors.textSecondary,
      textAlign: "center",
      fontSize: 14,
      marginBottom: 16,
    },
    highlight: {
      color: colors.debt,
      fontWeight: "bold",
    },
    signOut: {
      paddingVertical: 16,
      marginTop: 16,
    },
    signOutText: {
      color: colors.expense,
      textAlign: "center",
      fontWeight: "bold",
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 40,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      width: "80%",
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.textMain,
      textAlign: "center",
      marginBottom: 20,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 18,
      color: colors.textMain,
      backgroundColor: colors.card,
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.profit,
    },
    cancelButtonText: {
      color: colors.textMuted,
      fontWeight: "bold",
    },
    saveButtonText: {
      color: colors.textMain,
      fontWeight: "bold",
    },
    vehicleOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      backgroundColor: colors.card,
    },
    selectedVehicle: {
      borderColor: colors.profit,
      backgroundColor: "rgba(34, 197, 94, 0.1)",
    },
    vehicleText: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 12,
    },
    selectedVehicleText: {
      color: colors.profit,
    },
    alertModalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      width: "80%",
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.border,
    },
    alertMessage: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: "center",
      marginBottom: 20,
    },
    alertButton: {
      backgroundColor: colors.profit,
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      minWidth: 80,
    },
    alertButtonText: {
      color: colors.textMain,
      fontWeight: "bold",
      fontSize: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Management</Text>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Profile Section */}
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileContainer}>
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={24} color={colors.profit} />
            <Text style={styles.statLabel}>Total Earned This Month</Text>
            <Text style={styles.statValue}>
              GH₵ {monthlyEarnings.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trophy-outline" size={24} color={colors.profit} />
            <Text style={styles.statLabel}>Best Tip Received</Text>
            <Text style={styles.statValue}>GH₵ {bestTip.toFixed(2)}</Text>
          </View>
        </View>

        {/* Financial Controls */}
        <Text style={styles.sectionTitle}>App Goals</Text>
        <SettingOption
          icon="flag-outline"
          label="Daily Profit Target"
          value={`GH₵ ${dailyTarget.toFixed(2)}`}
          onPress={handleTargetChange}
        />
        <SettingOption
          icon="bicycle-outline"
          label="Vehicle Type"
          value={vehicleType}
          onPress={handleVehicleChange}
        />

        {/* Platform Settlement */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Settlement</Text>
        <View style={styles.settlementBox}>
          <Text style={styles.settlementText}>
            Currently holding{" "}
            <Text style={styles.highlight}>
              GH₵ {Math.abs(summary.total_debt).toFixed(2)}
            </Text>{" "}
            in platform cash.
          </Text>
          <Button
            label="Clear Platform Debt"
            onPress={handleClearDebt}
            disabled={summary.total_debt === 0}
          />
        </View>

        {/* Data Management */}
        <Text style={styles.sectionTitle}>System</Text>
        <SettingOption
          icon="cloud-upload-outline"
          label="Backend Sync"
          value={
            isSyncing
              ? "Syncing..."
              : isOnline
                ? lastSyncTime
                  ? `Synced ${new Date(lastSyncTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
                  : "Connected"
                : "Disconnected"
          }
          onPress={syncData}
          isSyncing={isSyncing}
        />

        <SettingOption
          icon="chatbubble-outline"
          label="SMS Capture"
          value={smsEnabled ? "Enabled" : "Disabled"}
          onPress={handleSmsToggle}
        />

        <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Daily Target Modal */}
        <Modal
          visible={targetModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setTargetModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Daily Profit Target</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter amount (e.g. 500.00)"
                keyboardType="numeric"
                value={tempTarget}
                onChangeText={setTempTarget}
                autoFocus={true}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setTargetModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveTarget}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Vehicle Type Modal */}
        <Modal
          visible={vehicleModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setVehicleModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Vehicle Type</Text>
              {vehicleTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.vehicleOption,
                    vehicleType === type && styles.selectedVehicle,
                  ]}
                  onPress={() => selectVehicle(type)}
                >
                  <Ionicons
                    name={
                      type === "Bicycle"
                        ? "bicycle-outline"
                        : type === "Motorcycle"
                          ? "bicycle-outline"
                          : "car-outline"
                    }
                    size={24}
                    color={
                      vehicleType === type ? colors.profit : colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.vehicleText,
                      vehicleType === type && styles.selectedVehicleText,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* SMS Consent Modal */}
        <SMSConsentModal
          visible={smsConsentModalVisible}
          onConsent={handleSmsConsent}
          onDeny={handleSmsDeny}
        />

        {/* Alert Modal */}
        <Modal
          visible={alertModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAlertModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.alertModalContent}>
              <Text style={styles.modalTitle}>{alertTitle}</Text>
              <Text style={styles.alertMessage}>{alertMessage}</Text>
              <TouchableOpacity
                style={[styles.modalButton, styles.alertButton]}
                onPress={() => setAlertModalVisible(false)}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
