import React, { useState, useContext } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useDispatch, useSelector } from "react-redux";
import { ThemeContext } from "../contexts/ThemeContext";
import { isMoMoTransactionSMS } from "../services/smsService";
import { parseMoMoSMS } from "../utils/momoTracker";
import { apiCall } from "../services/apiService";
import { addTransaction, addExpense } from "../store/store";

const ManualSMSModal = ({ visible, onClose }) => {
  const { colors } = useContext(ThemeContext);
  const dispatch = useDispatch();
  const transactions = useSelector((state) => state.data.transactions);
  const [smsContent, setSmsContent] = useState("");

  // Check if transaction already exists in Redux store
  const isDuplicateTransaction = (txId) => {
    return transactions.some((tx) => tx.tx_id === txId);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      setSmsContent(clipboardContent);
    } catch (error) {
      Alert.alert("Error", "Failed to paste from clipboard.");
    }
  };

  const handleSubmit = async () => {
    if (!smsContent.trim()) {
      Alert.alert("Error", "Please enter SMS content.");
      return;
    }

    // Validate the SMS
    const mockSMS = { body: smsContent };
    if (!isMoMoTransactionSMS(mockSMS)) {
      Alert.alert("Invalid SMS", "This does not appear to be a valid MoMo transaction SMS.");
      return;
    }

    try {
      const parsed = parseMoMoSMS(smsContent);
      if (!parsed) {
        Alert.alert("Invalid SMS", "Could not parse the SMS content.");
        return;
      }
      
      // Check for duplicate transaction
      if (!isPrivate && isDuplicateTransaction(parsed.tx_id)) {
        Alert.alert("Duplicate", "This transaction has already been added.");
        return;
      }
      
      // Determine platform and calculate expense-like values
      const isPrivate = parsed.platform === 'PRIVATE';
      
      if (isPrivate) {
        // Treat as expense if private
        const expenseData = {
          amount: parsed.amount_received,
          category: 'Private',
          description: `Manual entry from SMS - Ref: ${parsed.tx_id}`,
        };
        const response = await apiCall('/api/expenses/', {
          method: 'POST',
          body: JSON.stringify(expenseData),
        });
        if (response.ok) {
          const expense = await response.json();
          dispatch(addExpense(expense));
          Alert.alert("Success", "Expense added successfully.");
          setSmsContent("");
          onClose();
        } else {
          const errorData = await response.json().catch(() => ({}));
          Alert.alert("Error", errorData.detail || "Failed to process expense.");
        }
      } else {
        // Treat as transaction
        const response = await apiCall('/api/transactions/', {
          method: 'POST',
          body: JSON.stringify(parsed),
        });
        if (response.ok) {
          const transaction = await response.json();
          dispatch(addTransaction(transaction));
          Alert.alert("Success", "Transaction processed successfully.");
          setSmsContent("");
          onClose();
        } else {
          const errorData = await response.json().catch(() => ({}));
          Alert.alert("Error", errorData.detail || "Failed to process transaction.");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process SMS. Please try again.");
    }
  };

  const styles = StyleSheet.create({
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
      width: "90%",
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
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.textMain,
      backgroundColor: colors.card,
      marginBottom: 20,
      minHeight: 100,
      textAlignVertical: "top",
    },
    pasteButton: {
      backgroundColor: colors.profit,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 20,
    },
    pasteButtonText: {
      color: colors.textMain,
      fontWeight: "bold",
      fontSize: 16,
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
    submitButton: {
      backgroundColor: colors.profit,
    },
    cancelButtonText: {
      color: '#FFFFFF',
      fontWeight: "bold",
    },
    submitButtonText: {
      color: colors.textMain,
      fontWeight: "bold",
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add SMS Manually</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste SMS content here..."
            value={smsContent}
            onChangeText={setSmsContent}
            multiline={true}
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.pasteButton} onPress={handlePasteFromClipboard}>
            <Text style={styles.pasteButtonText}>Paste from Clipboard</Text>
          </TouchableOpacity>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ManualSMSModal;