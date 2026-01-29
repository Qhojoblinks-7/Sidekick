 import React, { useMemo, useContext, useState } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { TransactionItem } from "../../components/TransactionItem";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useSelector, useDispatch } from "react-redux";
import { useUpdateTransaction, useUpdateExpense } from "../../hooks/useTransactions";
import { removeTransaction, removeExpense, updateTransaction, updateExpense } from '../../store/store';
import { apiCall } from '../../services/apiService';

export default function History() {
  const { colors } = useContext(ThemeContext);
  const { transactions: transactionsData, expenses: expensesData } =
    useSelector((state) => state.data);
  const { mutate: updateTransaction, isPending: isUpdating } =
    useUpdateTransaction();

  const { mutate: updateExpense, isPending: isUpdatingExpense } = useUpdateExpense();

  const dispatch = useDispatch();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState("");

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [itemToDelete, setItemToDelete] = useState(null);

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [editExpenseModalVisible, setEditExpenseModalVisible] = useState(false);
  
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  const [expenseAmount, setExpenseAmount] = useState("");
  
  const [expenseCategory, setExpenseCategory] = useState("Fuel");
  
  const [expenseDescription, setExpenseDescription] = useState("");

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

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

  const handleDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const item = itemToDelete;
      const isExpense = item.id.startsWith('exp-');
      const endpoint = isExpense ? '/api/expenses/' : '/api/transactions/';
      const id = item.id.replace(isExpense ? 'exp-' : 'tx-', '');
      await apiCall(`${endpoint}${id}/`, { method: 'DELETE' });
      if (isExpense) {
        dispatch(removeExpense(parseInt(id)));
      } else {
        dispatch(removeTransaction(parseInt(id)));
      }
      setSuccessMessage('Transaction deleted successfully');
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete transaction');
    } finally {
      setDeleteModalVisible(false);
      setItemToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      for (const id of selectedItems) {
        const isExpense = id.startsWith('exp-');
        const endpoint = isExpense ? '/api/expenses/' : '/api/transactions/';
        const realId = id.replace(isExpense ? 'exp-' : 'tx-', '');
        await apiCall(`${endpoint}${realId}/`, { method: 'DELETE' });
        if (isExpense) {
          dispatch(removeExpense(parseInt(realId)));
        } else {
          dispatch(removeTransaction(parseInt(realId)));
        }
      }
      setSuccessMessage('Selected items deleted successfully');
      setSuccessModalVisible(true);
      setSelectedItems([]);
      setIsSelectMode(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      Alert.alert('Error', 'Failed to delete some items');
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 16,
      marginBottom: 32,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerText: {
      flex: 1,
    },
    selectButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    selectButtonText: {
      color: colors.textSecondary,
      fontWeight: 'bold',
    },
    scroll: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    title: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 4,
      marginBottom: 16,
    },
    mainTitle: {
      color: colors.textMain,
      fontSize: 30,
      fontWeight: "900",
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
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontWeight: "bold",
    },
    summaryValue: {
      color: colors.profit,
      fontWeight: "900",
    },
    filterContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    filterButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    filterButtonActive: {
      backgroundColor: colors.profit,
      borderColor: colors.profit,
    },
    filterButtonText: {
      color: colors.textSecondary,
      fontWeight: "bold",
    },
    filterButtonTextActive: {
      color: colors.textMain,
    },
    bulkActions: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    deleteButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: colors.expense,
      alignItems: 'center',
    },
    deleteButtonDisabled: {
      backgroundColor: colors.border,
    },
    deleteButtonText: {
      color: colors.textMain,
      fontWeight: 'bold',
    },
    deleteButtonTextDisabled: {
      color: colors.textMuted,
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
      {/* Page Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Transactions Feed</Text>
            <Text style={styles.subtitle}>
              Your personal bank statement. Every MoMo message processed shows up
              here.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {
              setIsSelectMode(!isSelectMode);
              setSelectedItems([]);
            }}
          >
            <Text style={styles.selectButtonText}>
              {isSelectMode ? 'Cancel' : 'Select'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {["All", "Yango", "Bolt", "Private"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bulk Actions */}
      {isSelectMode && (
        <View style={styles.bulkActions}>
          <TouchableOpacity
            style={[styles.deleteButton, selectedItems.length === 0 && styles.deleteButtonDisabled]}
            onPress={handleBulkDelete}
            disabled={selectedItems.length === 0}
          >
            <Text style={[styles.deleteButtonText, selectedItems.length === 0 && styles.deleteButtonTextDisabled]}>
              Delete Selected ({selectedItems.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* The Feed */}
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
            onLongPress={() => handleDelete(item)}
            isSelectMode={isSelectMode}
            isSelected={selectedItems.includes(item.id)}
            onSelect={() => {
              if (selectedItems.includes(item.id)) {
                setSelectedItems(selectedItems.filter(id => id !== item.id));
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

      {/* Edit Transaction Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Transaction</Text>

            <Text style={styles.inputLabel}>
              Received Amount: GH₵{selectedTransaction?.amount}
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => {
                updateTransaction(
                  {
                    id: selectedTransaction.id.replace("tx-", ""),
                    updatedTx: {
                      rider_profit: parseFloat(selectedTransaction.amount),
                      platform_debt: 0,
                    },
                  },
                  {
                    onSuccess: (result) => {
                      dispatch(updateTransaction(result));
                      setEditModalVisible(false);
                      Alert.alert("Success", "Transaction updated successfully");
                    },
                  },
                );
              }}
              disabled={isUpdating}
            >
              <Text style={styles.saveButtonText}>
                {isUpdating ? "Updating..." : "Mark as Tip"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Or Enter Delivery Fee (GHS)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={deliveryFee}
              onChangeText={setDeliveryFee}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  const fee = parseFloat(deliveryFee);
                  if (
                    isNaN(fee) ||
                    fee < 0 ||
                    fee > parseFloat(selectedTransaction.amount)
                  ) {
                    Alert.alert(
                      "Invalid Fee",
                      "Please enter a valid delivery fee.",
                    );
                    return;
                  }
                  updateTransaction(
                    {
                      id: selectedTransaction.id.replace("tx-", ""),
                      updatedTx: {
                        rider_profit:
                          parseFloat(selectedTransaction.amount) - fee,
                        platform_debt: fee,
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
                }}
                disabled={isUpdating}
              >
                <Text style={styles.saveButtonText}>
                  {isUpdating ? "Updating..." : "Update Fee"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            <Text style={styles.inputLabel}>Are you sure you want to delete this transaction? This action cannot be undone.</Text>
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
            <Text style={[styles.inputLabel, { textAlign: 'center', marginBottom: 20 }]}>
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
