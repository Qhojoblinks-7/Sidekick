import React, { useState, useEffect, useContext, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { setSyncing, addTransaction as addTransactionAction, selectSummary, selectTransactions, selectDailyTarget, selectSmsEnabled, selectIsSyncing } from "../../store/store";
import { apiCall } from "../../services/apiService";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import { GoalProgressBar } from "../../components/GoalProgressBar";
import PageHeader from "../../components/PageHeader";
import DashboardCards from "../../components/DashboardCards";
import TransactionList from "../../components/TransactionList";
import CustomDateModal from "../../components/CustomDateModal";
import { HeroSection } from "../../components/HeroSection";
import { PlatformHealth } from "../../components/PlatformHealth";
import useDashboardData from "../../hooks/useDashboardData";
import useFilteredTransactions from "../../hooks/useFilteredTransactions";
import usePeriodSummary from "../../hooks/usePeriodSummary";
import { HeroSkeleton, CardSkeleton, TransactionSkeleton } from "../../components/LoadingSkeleton";
// import { startLiveTracking, syncMissedTrips, requestSMSPermissions } from "../../services/smsService";
import io from "socket.io-client";
import { SOCKET_BASE_URL } from "../../constants/API";

export default function Dashboard() {
  const { colors } = useContext(ThemeContext);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const summary = useSelector(selectSummary);
  const transactionsData = useSelector(selectTransactions);
  const dailyTarget = useSelector(selectDailyTarget);
  const smsEnabled = useSelector(selectSmsEnabled);
  const isSyncing = useSelector(selectIsSyncing);

  const getInitialPeriod = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { type: "today", startDate, endDate };
  };

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [period, setPeriod] = useState(getInitialPeriod());
  const [customDateModalVisible, setCustomDateModalVisible] = useState(false);
  const [customDate, setCustomDate] = useState(new Date());
  const [currentStep, setCurrentStep] = useState(0);
  const [fieldStep, setFieldStep] = useState(0);
  const [manualAmount, setManualAmount] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [manualPlatform, setManualPlatform] = useState("YANGO");
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [transactionDateModalVisible, setTransactionDateModalVisible] = useState(false);
  const [tripPrice, setTripPrice] = useState("");
  const [bonuses, setBonuses] = useState("");
  const [systemFees, setSystemFees] = useState("");
  const [grossTotal, setGrossTotal] = useState("");
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
  const hasSyncedOnStartup = useRef(false);
  const hasRequestedPermission = useRef(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const resetTransactionStates = () => {
    setManualAmount("");
    setAmountReceived("");
    setManualPlatform("YANGO");
    setTransactionDate(new Date());
    setTripPrice("");
    setBonuses("");
    setSystemFees("");
    setGrossTotal("");
    setFieldStep(0);
  };

  const updateSummary = async () => {
    try {
      const response = await apiCall('/api/summary/daily/');
      if (response.ok) {
        const summary = await response.json();
        dispatch(setSummary(summary));
      } else {
        console.error('Failed to fetch summary:', response.status);
      }
    } catch (error) {
      console.error('Error updating summary:', error);
    }
  };

  const addTransaction = async (transactionData, options = {}) => {
    try {
      const response = await apiCall('/api/transactions/', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });
      if (response.ok) {
        const newTransaction = await response.json();
        console.log('[TX_DEBUG] New transaction from API:', newTransaction);
        
        // Optimistically add to Redux store immediately
        dispatch(addTransactionAction(newTransaction));
        console.log('[TX_DEBUG] Dispatched to Redux');
        
        // Invalidate React Query cache to refresh data from server
        console.log('[TX_DEBUG] Before invalidation - invalidating dashboardData and periodSummary');
        await queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        await queryClient.invalidateQueries({ queryKey: ['periodSummary'] });
        
        // Force refetch immediately - use refetchQueries with exact match
        console.log('[TX_DEBUG] Refetching queries...');
        await queryClient.refetchQueries({ queryKey: ['dashboardData'], exact: false });
        await queryClient.refetchQueries({ queryKey: ['periodSummary'], exact: false });
        console.log('[TX_DEBUG] Refetch complete');
        
        console.log('[TX_DEBUG] Cache invalidated and refetched');
        
        if (options.onSuccess) options.onSuccess();
      } else {
        console.error('Failed to add transaction:', response.status);
        if (options.onError) options.onError(new Error(`Failed: ${response.status}`));
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      if (options.onError) options.onError(error);
    }
  };

  const modalVisible = currentStep === 1 || currentStep === 2;
  const getModalTitle = () => {
    switch (currentStep) {
      case 1: return "Select Platform";
      case 2: {
        const fields = manualPlatform === "YANGO" ? [
          { label: 'Trip Price' },
          { label: 'Bonuses' },
          { label: 'System Fees' },
          { label: 'Gross Total' },
        ] : [
          { label: 'Full Fee' },
          { label: 'Amount Received' },
        ];
        return `Enter ${fields[fieldStep]?.label}`;
      }
      default: return "Add Manual Transaction";
    }
  };
  const closeDateModal = () => {
    setTransactionDateModalVisible(false);
    if (currentStep === 3) {
      setCurrentStep(0);
      resetTransactionStates();
    }
  };
  const handleDateSelect = (selectedPeriod) => {
    console.log('[HANDLE_DATE] Function started');
    const date = selectedPeriod.startDate;
    console.log('[HANDLE_DATE] Date:', date.toISOString());
    setTransactionDate(date);
    
    let tp = parseFloat(tripPrice);
    let b = parseFloat(bonuses || 0);
    let sf = parseFloat(systemFees || 0);
    let gt = parseFloat(grossTotal);
    
    let tripPlusBonuses = tp + b;
    let tipAmount = gt - tripPlusBonuses;
    
    console.log('[HANDLE_DATE] Inputs:', { tp, b, sf, gt, tripPlusBonuses, tipAmount });
    
    // Validate: gross_total must be >= trip_price + bonuses
    if (gt < tripPlusBonuses) {
      Alert.alert(
        "Invalid Amount",
        `Gross Total (GHS ${gt}) is less than Trip + Bonuses (GHS ${tripPlusBonuses}).\n\nThis would result in a loss. Please check your entries.`,
        [{ text: "OK", onPress: () => setTransactionDateModalVisible(false) }]
      );
      return;
    }
    
    let riderProfit, platformDebt, isTip = false, amtReceived;
    
    if (manualPlatform === "YANGO") {
      // For Yango: platform_debt = system_fees
      riderProfit = tp + b - sf;
      platformDebt = sf;
      amtReceived = gt;
      
      // Tip scenario: if customer paid more than (trip + bonuses)
      isTip = tipAmount > 0;
      
      console.log('[HANDLE_DATE] Yango calculation:', { 
        riderProfit, 
        platformDebt, 
        isTip, 
        tipAmount: isTip ? tipAmount : 0 
      });
    } else {
      const fullFee = parseFloat(manualAmount);
      amtReceived = parseFloat(amountReceived);
      if (amtReceived > fullFee) {
        riderProfit = fullFee;
        platformDebt = parseFloat((amtReceived - fullFee).toFixed(2));
        isTip = false;
      } else {
        riderProfit = amtReceived;
        platformDebt = 0;
        isTip = fullFee > amtReceived;
      }
      console.log('[HANDLE_DATE] Bolt calculation:', { fullFee, amtReceived, riderProfit, platformDebt });
    }
    riderProfit = parseFloat(riderProfit.toFixed(2));
    platformDebt = parseFloat(platformDebt.toFixed(2));
    
    // Build transaction data with all fields
    const transactionData = {
      tx_id: `manual-${Date.now()}`,
      amount_received: amtReceived,
      rider_profit: riderProfit,
      platform_debt: platformDebt,
      platform: manualPlatform,
      is_tip: isTip,
      created_at: date.toISOString(),
    };
    
    // Add Bolt-specific fields
    if (manualPlatform === "BOLT") {
      transactionData.full_fee = parseFloat(manualAmount);
      transactionData.tip_amount = isTip ? parseFloat((parseFloat(manualAmount) - amtReceived).toFixed(2)) : 0;
    }
    
    console.log('[HANDLE_DATE] Final transaction:', transactionData);
    
    addTransaction(transactionData, {
      onSuccess: () => {
        console.log('[HANDLE_DATE] ✅ Transaction saved successfully!');
        setCurrentStep(0);
        resetTransactionStates();
        showToast("Manual transaction added successfully!", "success");
      },
      onError: (error) => {
        console.log('[HANDLE_DATE] ❌ Transaction error:', error.message);
        showToast(`Failed to add transaction: ${error.message}`, "error");
      },
    });
    setTransactionDateModalVisible(false);
  };
  const { isLoading, refetch, isFetching } = useDashboardData();
  const isDataLoading = isLoading;

  useEffect(() => {
    const socket = io(SOCKET_BASE_URL);
    socket.on("new_transaction", () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      Vibration.vibrate();
      Alert.alert("New Transaction", "A new transaction has been received.");
    });
    return () => socket.disconnect();
  }, [queryClient]);

  useEffect(() => {
    // SMS functionality disabled
    /*
    let stopListening = () => {};

    if (smsEnabled && !hasSyncedOnStartup.current) {
      hasSyncedOnStartup.current = true;
      // 1. Run the Scanner once on startup (non-blocking)
      syncMissedTrips(null).then((trips) => { // Assuming lastKnownTripId is null for now
        if (trips.length > 0) {
          trips.forEach((trip) => {
            addTransaction(
              {
                tx_id: trip.transactionId,
                amount_received: trip.amount,
                rider_profit: trip.rider_profit || trip.amount, // Use calculated value or fallback
                platform_debt: trip.platform_debt || 0, // Use calculated value or fallback
                platform: trip.source === 'Bolt Food' ? 'BOLT' : 'YANGO',
                is_tip: trip.is_tip || false,
                created_at: new Date().toISOString(),
              },
              {
                onSuccess: () => {
                  showToast(`Synced missed payment: GHS ${trip.amount} from ${trip.source}`, "success");
                },
              },
            );
          });
        }
      }).catch((error) => {
        console.error('Startup sync failed:', error);
        // Optionally show toast if permission denied
        if (error.message.includes('permission')) {
          showToast('SMS permission required for automatic payment capture', 'warning');
        }
      });
    }

    if (smsEnabled && !hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      // 2. Start the Live Listener (only if permission granted)
      requestSMSPermissions().then((granted) => {
        if (granted) {
          stopListening = startLiveTracking((trip) => {
            addTransaction(
              {
                tx_id: trip.transactionId,
                amount_received: trip.amount,
                rider_profit: trip.rider_profit || trip.amount, // Use calculated value or fallback
                platform_debt: trip.platform_debt || 0, // Use calculated value or fallback
                platform: trip.source === 'Bolt Food' ? 'BOLT' : 'YANGO',
                is_tip: trip.is_tip || false,
                created_at: new Date().toISOString(),
              },
              {
                onSuccess: () => {
                  showToast(`New ${trip.source} Payment: GHS ${trip.amount}`, "success");
                  Vibration.vibrate();
                },
              },
            );
          });
        }
      });
    } else if (!smsEnabled) {
      // Reset flags when SMS is disabled
      hasSyncedOnStartup.current = false;
      hasRequestedPermission.current = false;
    }

    return () => stopListening();
    */
  }, [smsEnabled]);
  useEffect(() => {
    if (currentStep === 3) {
      console.log('[DEBUG] currentStep === 3, setting transactionDateModalVisible to true');
      console.log('[DEBUG] transactionDate:', transactionDate.toISOString());
      setTransactionDateModalVisible(true);
    } else {
      console.log('[DEBUG] currentStep !== 3, setting transactionDateModalVisible to false');
      setTransactionDateModalVisible(false);
    }
  }, [currentStep]);

  const filteredTransactions = useFilteredTransactions(
    transactionsData,
    period,
  );

  // Paginated transactions for infinite scroll
  const paginatedTransactions = filteredTransactions.slice(0, page * ITEMS_PER_PAGE);

  const handleLoadMore = () => {
    if (!loadingMore && paginatedTransactions.length < filteredTransactions.length) {
      setLoadingMore(true);
      // Simulate network delay for smooth UX
      setTimeout(() => {
        setPage(prev => prev + 1);
        setLoadingMore(false);
      }, 500);
    }
  };
  const { data: periodSummary } = usePeriodSummary(period);
  const summaryData = periodSummary || {
    yango_income: 0,
    bolt_income: 0,
    expenses: 0,
    yango_debt: 0,
    bolt_debt: 0,
    net_profit: 0,
    total_debt: 0,
  };

  // Calculate total income for the Hero section
  const totalIncome = (summaryData.yango_income || 0) + (summaryData.bolt_income || 0);

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
    activityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 16,
    },
    activityTitle: {
      color: colors.textMain,
      fontSize: 18,
      fontWeight: "bold",
    },
    syncButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.border,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    syncButtonText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
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
    <View style={styles.container}>
      <View style={{ marginTop: 50, marginHorizontal: 15 }}>
        <PageHeader
          dropdownVisible={dropdownVisible}
          setDropdownVisible={setDropdownVisible}
          setCustomDateModalVisible={setCustomDateModalVisible}
          period={period}
          onPeriodChange={setPeriod}
        />
      </View>

      {/* Show skeleton while loading */}
      {isDataLoading ? (
        <>
          <HeroSkeleton />
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </View>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
          </View>
          <TransactionSkeleton count={5} />
        </>
      ) : (
        <>
          <HeroSection
            netProfit={summaryData.net_profit}
            income={totalIncome}
            expenses={summaryData.expenses}
            target={dailyTarget}
          />

          <PlatformHealth
            boltDebt={summaryData.bolt_debt}
            yangoDebt={summaryData.yango_debt}
            boltLimit={500}
            yangoLimit={500}
          />

          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => setCurrentStep(1)}
          >
            <Ionicons name="add" size={40} color={colors.textMain} />
          </TouchableOpacity>

          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
          </View>

          <ScrollView 
            style={styles.transactionsScroll}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
          >
            <TransactionList filteredTransactions={paginatedTransactions} />
            {loadingMore && (
              <Text style={{ color: colors.textMuted, textAlign: 'center', padding: 10 }}>
                Loading more...
              </Text>
            )}
          </ScrollView>
        </>
      )}

      <CustomDateModal
        customDateModalVisible={customDateModalVisible}
        setCustomDateModalVisible={setCustomDateModalVisible}
        customDate={customDate}
        setCustomDate={setCustomDate}
        setSelectedPeriod={setPeriod}
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
    <Text style={styles.inputLabel}>Platform</Text>
    <View style={styles.platformContainer}>
      {["YANGO", "BOLT"].map((platform) => (
        <TouchableOpacity
          key={platform}
          style={[
            styles.platformButton,
            manualPlatform === platform && styles.selectedPlatform,
          ]}
          onPress={() => {
            setManualPlatform(platform);
            setCurrentStep(2);
            setFieldStep(0);
          }}
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
    <View style={{ alignItems: 'center', marginTop: 20 }}>
      <TouchableOpacity
        style={[styles.modalButton, styles.cancelButton, { width: '50%' }]}
        onPress={() => {
          setCurrentStep(0);
          resetTransactionStates();
        }}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </>
)}
{currentStep === 2 && (
  <>
    {(() => {
      const fields = manualPlatform === "YANGO" ? [
        { label: 'Trip Price (GHS)', placeholder: '0.00', value: tripPrice, setValue: setTripPrice },
        { label: 'Bonuses (GHS)', placeholder: '0.00', value: bonuses, setValue: setBonuses },
        { label: 'System Fees (GHS)', placeholder: '0.00', value: systemFees, setValue: setSystemFees },
        { label: 'Gross Total (GHS)', placeholder: '0.00', value: grossTotal, setValue: setGrossTotal },
      ] : [
        { label: 'Full Fee (GHS)', placeholder: '0.00', value: manualAmount, setValue: setManualAmount },
        { label: 'Amount Received (GHS)', placeholder: '0.00', value: amountReceived, setValue: setAmountReceived },
      ];
      const currentField = fields[fieldStep];
      return (
        <>
          <Text style={styles.inputLabel}>{currentField.label}</Text>
          <TextInput
            style={styles.input}
            placeholder={currentField.placeholder}
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={currentField.value}
            onChangeText={currentField.setValue}
            autoFocus={true}
          />
        </>
      );
    })()}
  </>
)}

{currentStep === 2 && (
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
        const fields = manualPlatform === "YANGO" ? [
          { value: tripPrice, min: 0.01, label: 'Trip Price' },
          { value: bonuses, min: 0, label: 'Bonuses' },
          { value: systemFees, min: 0, label: 'System Fees' },
          { value: grossTotal, min: 0.01, label: 'Gross Total' },
        ] : [
          { value: manualAmount, min: 0.01, label: 'Full Fee' },
          { value: amountReceived, min: 0.01, label: 'Amount Received' },
        ];
        const currentField = fields[fieldStep];
        const val = parseFloat(currentField.value);
        if (isNaN(val) || val < currentField.min) {
          Alert.alert("Invalid Amount", `Please enter a valid ${currentField.label.replace(' (GHS)', '')} greater than or equal to ${currentField.min}.`);
          return;
        }
        if (fieldStep < fields.length - 1) {
          setFieldStep(fieldStep + 1);
        } else {
          setCurrentStep(3);
        }
      }}
    >
      <Text style={styles.saveButtonText}>Next</Text>
    </TouchableOpacity>
  </View>
)}
          </View>
        </View>
      </Modal>

      <CustomDateModal
        customDateModalVisible={transactionDateModalVisible}
        setCustomDateModalVisible={closeDateModal}
        customDate={transactionDate}
        setCustomDate={setTransactionDate}
        setSelectedPeriod={handleDateSelect}
      />

      {/* Syncing Modal */}
      <Modal
        visible={isSyncing}
        transparent={true}
        animationType="fade"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <ActivityIndicator size="large" color={colors.profit} />
            <Text style={{
              color: colors.textMain,
              fontSize: 18,
              fontWeight: 'bold',
              marginTop: 16,
            }}>
              Syncing Messages...
            </Text>
            <Text style={{
              color: colors.textMuted,
              fontSize: 14,
              textAlign: 'center',
              marginTop: 8,
            }}>
              Checking for missed payments
            </Text>
          </View>
        </View>
      </Modal>

    </View>
  );
}

