import React, { useMemo, useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionItem } from "../../components/TransactionItem";
import { FilterHub } from "../../components/FilterHub";
import { EditTransactionModal } from "../../components/EditTransactionModal";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useSelector, useDispatch } from "react-redux";
import {
  useUpdateTransaction,
  useUpdateExpense,
} from "../../hooks/useTransactions";
import {
  removeTransaction,
  removeExpense,
  updateTransaction,
  updateExpense,
} from "../../store/store";
import { apiCall, SessionExpiredError } from "../../services/apiService";
import { registerSessionExpiredHandler, triggerSessionExpired } from "../../hooks/usePeriodSummary";
import * as SecureStore from "expo-secure-store";
import { useHistoryData } from "../../hooks/useTransactions";
import { TransactionSkeleton } from "../../components/LoadingSkeleton";

export default function History() {
  const { colors } = useContext(ThemeContext);
  const { data: historyData, isLoading: isHistoryLoading, refetch: refetchHistory } = useHistoryData();
  const { mutate: updateTransaction, isPending: isUpdating } =
    useUpdateTransaction();
  const { mutate: updateExpense, isPending: isUpdatingExpense } =
    useUpdateExpense();
  const dispatch = useDispatch();

  // Use data from React Query hook, fall back to Redux store
  const transactionsData = historyData?.transactions || [];
  const expensesData = historyData?.expenses || [];

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState("All");

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState("");

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Expense edit modal
  const [editExpenseModalVisible, setEditExpenseModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Fuel");
  const [expenseDescription, setExpenseDescription] = useState("");

  // Select mode state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Register session expiration handler
  useEffect(() => {
    const unregister = registerSessionExpiredHandler(async () => {
      dispatch(setTransactions([]));
      dispatch(setExpenses([]));
    });
    return () => unregister();
  }, [dispatch]);

  // Transform and combine data from Redux store
  const allTransactions = useMemo(() => {
    // Transform transactions
    const transformedTransactions = transactionsData.map((tx) => {
      const createdAt = new Date(tx.created_at);
      const timeString = createdAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // Determine type based on amounts
      let type = "profit";
      let amount = tx.rider_profit;

      if (parseFloat(tx.platform_debt) > 0) {
        type = "debt";
        amount = tx.platform_debt;
      }

      return {
        id: `tx-${tx.id}`,
        platform: tx.platform,
        amount: parseFloat(amount).toFixed(2),
        time: timeString,
        type: type,
        status: tx.status,
        created_at: createdAt,
        rider_profit: parseFloat(tx.rider_profit),
        platform_debt: parseFloat(tx.platform_debt || 0),
        isTip: tx.is_tip || false,
        syncStatus:
          tx.status === "synced"
            ? "synced"
            : tx.status === "local"
              ? "local"
              : "edited",
      };
    });

    // Transform expenses
    const transformedExpenses = expensesData.map((exp) => {
      const createdAt = new Date(exp.created_at);
      const timeString = createdAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return {
        id: `exp-${exp.id}`,
        platform: exp.category,
        amount: parseFloat(exp.amount).toFixed(2),
        time: timeString,
        type: "expense",
        status: exp.status,
        created_at: createdAt,
        syncStatus: "local",
      };
    });

    // Combine and sort by created_at (most recent first)
    return [...transformedTransactions, ...transformedExpenses].sort(
      (a, b) => b.created_at - a.created_at,
    );
  }, [transactionsData, expensesData]);

  // Filter transactions based on selectedFilter
  const transactions = useMemo(() => {
    if (selectedFilter === "All") return allTransactions;
    if (selectedFilter === "Yango")
      return allTransactions.filter((tx) => tx.platform === "YANGO");
    if (selectedFilter === "Bolt")
      return allTransactions.filter((tx) => tx.platform === "BOLT");
    if (selectedFilter === "Private")
      return allTransactions.filter((tx) => tx.type === "expense");
    return allTransactions;
  }, [allTransactions, selectedFilter]);

  // Today's transaction count for the subtitle
  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allTransactions.filter((tx) => new Date(tx.created_at) >= today)
      .length;
  }, [allTransactions]);

  const handleDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const item = itemToDelete;
      const isExpense = item.id.startsWith("exp-");
      const endpoint = isExpense ? "/api/expenses/" : "/api/transactions/";
      const id = item.id.replace(isExpense ? "exp-" : "tx-", "");
      await apiCall(`${endpoint}${id}/`, { method: "DELETE" });
      if (isExpense) {
        dispatch(removeExpense(parseInt(id)));
      } else {
        dispatch(removeTransaction(parseInt(id)));
      }
      setSuccessMessage("Transaction deleted successfully");
      setSuccessModalVisible(true);
    } catch (error) {
      console.error("Delete error:", error);
      if (error instanceof SessionExpiredError) {
        await triggerSessionExpired();
        return;
      }
      Alert.alert("Error", "Failed to delete transaction");
    } finally {
      setDeleteModalVisible(false);
      setItemToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      for (const id of selectedItems) {
        const isExpense = id.startsWith("exp-");
        const endpoint = isExpense ? "/api/expenses/" : "/api/transactions/";
        const realId = id.replace(isExpense ? "exp-" : "tx-", "");
        await apiCall(`${endpoint}${realId}/`, { method: "DELETE" });
        if (isExpense) {
          dispatch(removeExpense(parseInt(realId)));
        } else {
          dispatch(removeTransaction(parseInt(realId)));
        }
      }
      setSuccessMessage("Selected items deleted successfully");
      setSuccessModalVisible(true);
      setSelectedItems([]);
      setIsSelectMode(false);
    } catch (error) {
      console.error("Bulk delete error:", error);
      if (error instanceof SessionExpiredError) {
        await triggerSessionExpired();
        return;
      }
      Alert.alert("Error", "Failed to delete some items");
    }
  };

  const saveExpense = () => {
    const value = parseFloat(expenseAmount);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid expense amount.");
      return;
    }
    updateExpense(
      {
        id: selectedExpense.id.replace("exp-", ""),
        updatedExpense: {
          amount: value,
          category: expenseCategory,
          description: expenseDescription,
        },
      },
      {
        onSuccess: (result) => {
          dispatch(updateExpense(result));
          setEditExpenseModalVisible(false);
          Alert.alert("Success", "Expense updated successfully");
        },
      },
    );
  };

  const handleMarkAsTip = () => {
    if (!selectedTransaction) return;
    updateTransaction(
      {
        id: selectedTransaction.id.replace("tx-", ""),
        updatedTx: {
          rider_profit: parseFloat(selectedTransaction.amount),
          platform_debt: 0,
          is_tip: true,
        },
      },
      {
        onSuccess: (result) => {
          dispatch(updateTransaction(result));
          setEditModalVisible(false);
          Alert.alert("✨ Tip Confirmed!", "Full amount is now your profit!");
        },
      },
    );
  };

  const handleFeeUpdate = (fee) => {
    if (!selectedTransaction) return;
    updateTransaction(
      {
        id: selectedTransaction.id.replace("tx-", ""),
        updatedTx: {
          rider_profit: parseFloat(selectedTransaction.amount) - fee,
          platform_debt: fee,
          is_tip: false,
        },
      },
      {
        onSuccess: (result) => {
          dispatch(updateTransaction(result));
          setEditModalVisible(false);
          setDeliveryFee("");
          Alert.alert("Success", "Delivery fee updated!");
        },
      },
    );
  };

  const handleSelectAll = () => {
    setSelectedItems(transactions.map((tx) => tx.id));
  };

  const handleDeselectAll = () => {
    setSelectedItems([]);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerWrapper: {
      marginTop: 30,
    },
    scroll: {
      paddingHorizontal: 16,
      paddingBottom: 100, // Space for floating action bar
    },
    empty: {
      marginTop: 80,
      alignItems: "center",
    },
    emptyText: {
      color: colors.textTertiary,
      fontStyle: "italic",
    },
    summary: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontWeight: "bold",
      fontSize: 12,
      textTransform: "uppercase",
    },
    summaryValue: {
      color: colors.profit,
      fontWeight: "900",
      fontSize: 16,
    },
    // Floating Action Bar
    floatingActionBar: {
      position: "absolute",
      bottom: 20,
      left: 16,
      right: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    bulkDeleteButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.expense,
      gap: 8,
    },
    bulkDeleteText: {
      color: colors.textMain,
      fontWeight: "800",
      fontSize: 14,
    },
    selectedCount: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: "600",
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
    inputLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginBottom: 8,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.textMain,
      backgroundColor: colors.card,
      marginBottom: 16,
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
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrapper}>
        {/* Filter Hub */}
        <FilterHub
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        transactionCount={todayCount}
        isSelectMode={isSelectMode}
        onSelectModeChange={(mode) => {
          setIsSelectMode(mode);
          if (!mode) setSelectedItems([]);
        }}
        selectedItemsCount={selectedItems.length}
        totalItems={transactions.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        />
      </View>

      {/* The Feed */}
      {isHistoryLoading ? (
        <View style={styles.scroll}>
          <TransactionSkeleton count={8} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No transactions detected yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TransactionItem
              platform={item.platform}
              amount={item.amount}
              time={item.time}
              type={item.type}
              status={item.status}
              isTip={item.isTip}
              riderProfit={item.rider_profit}
              platformDebt={item.platform_debt}
              syncStatus={item.syncStatus}
              onPress={() => {
                if (item.type === "expense") {
                  setSelectedExpense(item);
                  setExpenseAmount(item.amount);
                  setExpenseCategory(item.platform);
                  setExpenseDescription("");
                  setEditExpenseModalVisible(true);
                } else {
                  setSelectedTransaction(item);
                  setDeliveryFee("");
                  setEditModalVisible(true);
                }
              }}
              onLongPress={() => {
                if (!isSelectMode) {
                  setIsSelectMode(true);
                  setSelectedItems([item.id]);
                }
              }}
              isSelectMode={isSelectMode}
              isSelected={selectedItems.includes(item.id)}
              onSelect={() => {
                if (selectedItems.includes(item.id)) {
                  setSelectedItems(selectedItems.filter((id) => id !== item.id));
                } else {
                  setSelectedItems([...selectedItems, item.id]);
                }
              }}
            />
          )}
          ListFooterComponent={
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Today's Transactions</Text>
              <Text style={styles.summaryValue}>{transactions.length} Total</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Bar for Bulk Actions */}
      {isSelectMode && selectedItems.length > 0 && (
        <View style={styles.floatingActionBar}>
          <Text style={styles.selectedCount}>
            {selectedItems.length} selected
          </Text>
          <TouchableOpacity
            style={styles.bulkDeleteButton}
            onPress={handleBulkDelete}
          >
            <Ionicons name="trash" size={18} color={colors.textMain} />
            <Text style={styles.bulkDeleteText}>
              Delete Selected ({selectedItems.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        transaction={selectedTransaction}
        onSave={handleFeeUpdate}
        onMarkAsTip={handleMarkAsTip}
        isUpdating={isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Transaction</Text>
            <Text style={styles.inputLabel}>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.saveButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        visible={editExpenseModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditExpenseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Expense</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount"
              keyboardType="numeric"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />
            <Text style={styles.inputLabel}>Category</Text>
            <View style={[styles.vehicleOption, { marginBottom: 20 }]}>
              <Text style={styles.vehicleText}>{expenseCategory}</Text>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Description"
              value={expenseDescription}
              onChangeText={setExpenseDescription}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditExpenseModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveExpense}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Success</Text>
            <Text
              style={[
                styles.inputLabel,
                { textAlign: "center", marginBottom: 20 },
              ]}
            >
              {successMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.saveButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Import Ionicons for the delete icon
import { Ionicons } from "@expo/vector-icons";
