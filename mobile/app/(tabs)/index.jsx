import React, { useState, useEffect, useContext } from "react";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import {
  ScrollView,
  View,
  StyleSheet,
  Vibration,
  Alert,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import { GoalProgressBar } from "../../components/GoalProgressBar";
import PageHeader from "../../components/PageHeader";
import DashboardCards from "../../components/DashboardCards";
import TransactionList from "../../components/TransactionList";
import CustomDateModal from "../../components/CustomDateModal";
import useDashboardData from "../../hooks/useDashboardData";
import useFilteredTransactions from "../../hooks/useFilteredTransactions";
import usePeriodSummary from "../../hooks/usePeriodSummary";
import { useAddTransaction } from "../../hooks/useTransactions";
import io from "socket.io-client";

export default function Dashboard() {
  const { colors } = useContext(ThemeContext);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: addTransaction, isPending: isAdding } = useAddTransaction();
  const { summary, transactions: transactionsData } = useSelector(
    (state) => state.data,
  );
  const { dailyTarget } = useSelector((state) => state.settings);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [customDateModalVisible, setCustomDateModalVisible] = useState(false);
  const [customDate, setCustomDate] = useState(new Date());
  const [currentStep, setCurrentStep] = useState(0);
  const [manualAmount, setManualAmount] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [manualPlatform, setManualPlatform] = useState("YANGO");
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [transactionDateModalVisible, setTransactionDateModalVisible] = useState(false);
  const resetTransactionStates = () => {
    setManualAmount("");
    setAmountReceived("");
    setManualPlatform("YANGO");
    setTransactionDate(new Date());
  };
  const modalVisible = currentStep > 0 && currentStep < 4;
  const getModalTitle = () => {
    switch (currentStep) {
      case 1: return "Enter Full Fee";
      case 2: return "Enter Amount Received";
      case 3: return "Select Platform";
      default: return "Add Manual Transaction";
    }
  };
  const closeDateModal = () => {
    setTransactionDateModalVisible(false);
    if (currentStep === 4) {
      setCurrentStep(0);
      resetTransactionStates();
    }
  };
  const handleDateSelect = (date) => {
    setTransactionDate(date);
    const fullFee = parseFloat(manualAmount);
    const amtReceived = parseFloat(amountReceived);
    if (isNaN(fullFee) || fullFee <= 0 || isNaN(amtReceived) || amtReceived <= 0) {
      Alert.alert("Invalid Amounts", "Please enter valid amounts.");
      return;
    }
    let riderProfit, platformDebt, isTip = false;
    if (fullFee <= amtReceived) {
      riderProfit = fullFee;
      platformDebt = amtReceived - fullFee;
    } else {
      riderProfit = amtReceived;
      platformDebt = 0;
      isTip = true;
    }
    addTransaction(
      {
        tx_id: `manual-${Date.now()}`,
        amount_received: amtReceived,
        rider_profit: riderProfit,
        platform_debt: platformDebt,
        platform: manualPlatform,
        is_tip: isTip,
        created_at: date.toISOString(),
      },
      {
        onSuccess: () => {
          setCurrentStep(0);
          resetTransactionStates();
          showToast("Manual transaction added successfully!", "success");
        },
      },
    );
    setTransactionDateModalVisible(false);
  };
  useDashboardData();

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socket.on("new_transaction", () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      Vibration.vibrate();
      Alert.alert("New Transaction", "A new transaction has been received.");
    });
    return () => socket.disconnect();
  }, [queryClient]);
  useEffect(() => {
    if (currentStep === 4) {
      setTransactionDateModalVisible(true);
    } else {
      setTransactionDateModalVisible(false);
    }
  }, [currentStep]);

  const filteredTransactions = useFilteredTransactions(
    transactionsData,
    selectedPeriod,
    customDate,
  );
  const periodSummary = usePeriodSummary(filteredTransactions, summary);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    cardsScroll: {
      maxHeight: 300,
      paddingHorizontal: 16,
    },
    quickAddButton: {
      backgroundColor: colors.profit,
      width: 50,
      height: 50,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      bottom: 60,
      right: 30,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      zIndex: 10,
    },
    tripsTitle: {
      color: colors.textMain,
      fontSize: 18,
      fontWeight: "bold",
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 16,
      textAlign: "center",
    },
    transactionsScroll: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
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
    inputLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 24,
      color: colors.textMain,
      backgroundColor: colors.card,
      marginBottom: 20,
      textAlign: "center",
    },
    platformContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 20,
    },
    platformButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    selectedPlatform: {
      backgroundColor: colors.profit,
      borderColor: colors.profit,
    },
    platformText: {
      fontWeight: "bold",
      color: colors.textMuted,
    },
    selectedPlatformText: {
      color: colors.textMain,
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
    dateButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      backgroundColor: colors.card,
      marginBottom: 20,
      alignItems: "center",
    },
    dateButtonText: {
      fontSize: 16,
      color: colors.textMain,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader
        dropdownVisible={dropdownVisible}
        setDropdownVisible={setDropdownVisible}
        setCustomDateModalVisible={setCustomDateModalVisible}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
      />

      <GoalProgressBar
        current={periodSummary.net_profit}
        target={dailyTarget}
      />

      <ScrollView style={styles.cardsScroll}>
        <DashboardCards
          periodSummary={periodSummary}
          dailyTarget={dailyTarget}
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.quickAddButton}
        onPress={() => setCurrentStep(1)}
      >
        <Ionicons name="add" size={40} color={colors.textMain} />
      </TouchableOpacity>

      <Text style={styles.tripsTitle}>Trip History</Text>

      <ScrollView style={styles.transactionsScroll}>
        <TransactionList filteredTransactions={filteredTransactions} />
      </ScrollView>

      <CustomDateModal
        customDateModalVisible={customDateModalVisible}
        setCustomDateModalVisible={setCustomDateModalVisible}
        customDate={customDate}
        setCustomDate={setCustomDate}
        setSelectedPeriod={setSelectedPeriod}
      />

      {/* Quick Add Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { setCurrentStep(0); resetTransactionStates(); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{getModalTitle()}</Text>

{currentStep === 1 && (
  <>
    <Text style={styles.inputLabel}>Full Fee (GHS)</Text>
    <TextInput
      style={styles.input}
      placeholder="0.00"
      placeholderTextColor={colors.textMuted}
      keyboardType="numeric"
      value={manualAmount}
      onChangeText={setManualAmount}
      autoFocus={true}
    />
  </>
)}
{currentStep === 2 && (
  <>
    <Text style={styles.inputLabel}>Amount Received (GHS)</Text>
    <TextInput
      style={styles.input}
      placeholder="0.00"
      placeholderTextColor={colors.textMuted}
      keyboardType="numeric"
      value={amountReceived}
      onChangeText={setAmountReceived}
      autoFocus={true}
    />
  </>
)}
{currentStep === 3 && (
  <>
    <Text style={styles.inputLabel}>Platform</Text>
    <View style={styles.platformContainer}>
      {["YANGO", "BOLT"].map((platform) => (
        <TouchableOpacity
          key={platform}
          style={[
            styles.platformButton,
            manualPlatform === platform && styles.selectedPlatform,
          ]}
          onPress={() => setManualPlatform(platform)}
        >
          <Text
            style={[
              styles.platformText,
              manualPlatform === platform && styles.selectedPlatformText,
            ]}
          >
            {platform}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </>
)}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setCurrentStep(0);
                  resetTransactionStates();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  if (currentStep === 1) {
                    const val = parseFloat(manualAmount);
                    if (isNaN(val) || val <= 0) {
                      Alert.alert("Invalid Amount", "Please enter a valid full fee greater than 0.");
                      return;
                    }
                    setCurrentStep(2);
                  } else if (currentStep === 2) {
                    const val = parseFloat(amountReceived);
                    if (isNaN(val) || val <= 0) {
                      Alert.alert("Invalid Amount", "Please enter a valid amount received greater than 0.");
                      return;
                    }
                    setCurrentStep(3);
                  } else if (currentStep === 3) {
                    setCurrentStep(4);
                  }
                }}
              >
                <Text style={styles.saveButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomDateModal
        customDateModalVisible={transactionDateModalVisible}
        setCustomDateModalVisible={closeDateModal}
        customDate={transactionDate}
        setCustomDate={handleDateSelect}
        setSelectedPeriod={() => {}}
      />
    </SafeAreaView>
  );
}

