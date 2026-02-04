import React, { useState, useContext, useEffect, useCallback } from "react";
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
import { isSmsAvailable, isTransactionSMS } from "../services/smsService";
import { parseMoMoSMS } from "../utils/momoTracker";
import { apiCall } from "../services/apiService";
import { addTransaction, addExpense } from "../store/store";

/**
 * ManualSMSModal - Manual SMS Entry with Auto-Detection
 * 
 * Provides manual SMS entry with clipboard auto-detection
 * and instant transaction parsing for improved UX.
 */

const ManualSMSModal = ({ visible, onClose }) => {
  const { colors } = useContext(ThemeContext);
  const dispatch = useDispatch();
  const transactions = useSelector((state) => state.data.transactions);
  
  const [smsContent, setSmsContent] = useState("");
  const [isDetected, setIsDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [smsAvailable, setSmsAvailable] = useState(true);

  // Check SMS availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const { available } = await isSmsAvailable();
      setSmsAvailable(available);
    };
    checkAvailability();
  }, []);

  // Auto-detect clipboard content when modal opens
  useEffect(() => {
    if (visible) {
      autoDetectClipboard();
    }
  }, [visible]);

  // Auto-detect clipboard and parse
  const autoDetectClipboard = useCallback(async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      
      if (clipboardContent && clipboardContent.trim().length > 0) {
        console.log('[ManualSMS] Clipboard content detected');
        
        // Check if it looks like a transaction SMS
        if (isTransactionSMS(clipboardContent)) {
          setSmsContent(clipboardContent);
          setIsDetected(true);
          
          // Try to parse immediately
          const parsed = parseMoMoSMS(clipboardContent);
          if (parsed) {
            setParsedData(parsed);
            console.log('[ManualSMS] Auto-parsed:', parsed);
          }
        } else {
          // Non-transaction content, still show but without detection
          setSmsContent(clipboardContent);
          setIsDetected(false);
          setParsedData(null);
        }
      }
    } catch (error) {
      console.log('[ManualSMS] Clipboard detection failed:', error);
    }
  }, []);

  // Check if transaction already exists
  const isDuplicateTransaction = useCallback((txId) => {
    return transactions.some((tx) => tx.tx_id === txId);
  }, [transactions]);

  // Parse SMS content (for preview)
  const previewParsedData = useCallback((content) => {
    if (!content || !isTransactionSMS(content)) {
      return null;
    }
    return parseMoMoSMS(content);
  }, []);

  // Handle content changes
  const handleContentChange = (text) => {
    setSmsContent(text);
    
    // Re-parse for preview
    const parsed = previewParsedData(text);
    setParsedData(parsed);
    setIsDetected(!!parsed);
  };

  // Paste from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      setSmsContent(clipboardContent);
      handleContentChange(clipboardContent);
    } catch (error) {
      Alert.alert("Error", "Failed to paste from clipboard.");
    }
  };

  // Clear content
  const handleClear = () => {
    setSmsContent("");
    setParsedData(null);
    setIsDetected(false);
  };

  // Submit and create transaction
  const handleSubmit = async () => {
    if (!smsContent.trim()) {
      Alert.alert("Error", "Please enter SMS content.");
      return;
    }

    // Validate the SMS
    const mockSMS = { body: smsContent };
    if (!isTransactionSMS(smsContent)) {
      Alert.alert(
        "Invalid SMS", 
        "This does not appear to be a valid transaction SMS. Please check the content."
      );
      return;
    }

    // Parse the SMS
    const parsed = parseMoMoSMS(smsContent);
    if (!parsed) {
      Alert.alert("Invalid SMS", "Could not parse the SMS content.");
      return;
    }

    // Check for duplicate
    if (isDuplicateTransaction(parsed.tx_id)) {
      Alert.alert("Duplicate", "This transaction has already been added.");
      return;
    }

    setIsLoading(true);

    try {
      const isPrivate = parsed.platform === 'PRIVATE';
      
      if (isPrivate) {
        // Treat as expense
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
          handleClear();
          onClose();
        } else {
          const errorData = await response.json().catch(() => ({}));
          Alert.alert("Error", errorData.detail || "Failed to process expense.");
        }
      } else {
        // Treat as transaction
        const response = await apiCall('/api/transactions/', {
          method: 'POST',
          body: JSON.stringify({
            ...parsed,
            manual_entry: true,
          }),
        });
        
        if (response.ok) {
          const transaction = await response.json();
          dispatch(addTransaction(transaction));
          Alert.alert("Success", "Transaction processed successfully.");
          handleClear();
          onClose();
        } else {
          const errorData = await response.json().catch(() => ({}));
          Alert.alert("Error", errorData.detail || "Failed to process transaction.");
        }
      }
    } catch (error) {
      console.error('[ManualSMS] Submit error:', error);
      Alert.alert("Error", "Failed to process SMS. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic styles
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
    detectionBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.profit + "20",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    detectionText: {
      color: colors.profit,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 8,
    },
    previewCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    previewLabel: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    previewValue: {
      color: colors.textMain,
      fontSize: 14,
      fontWeight: "600",
    },
    previewAmount: {
      color: colors.profit,
      fontSize: 18,
      fontWeight: "bold",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.textMain,
      backgroundColor: colors.card,
      marginBottom: 12,
      minHeight: 100,
      textAlignVertical: "top",
    },
    inputDisabled: {
      backgroundColor: colors.background,
      opacity: 0.7,
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    pasteButton: {
      backgroundColor: colors.profit,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      flex: 1,
    },
    pasteButtonText: {
      color: colors.textMain,
      fontWeight: "bold",
      fontSize: 16,
    },
    clearButton: {
      backgroundColor: colors.background,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center",
      marginLeft: 8,
    },
    clearButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
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
      backgroundColor: isDetected ? colors.profit : colors.border,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    cancelButtonText: {
      color: '#FFFFFF',
      fontWeight: "bold",
    },
    submitButtonText: {
      color: colors.textMain,
      fontWeight: "bold",
    },
    unavailableText: {
      color: colors.textSecondary,
      textAlign: "center",
      padding: 20,
      fontSize: 14,
    },
  });

  if (!smsAvailable) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manual SMS Entry</Text>
            <Text style={styles.unavailableText}>
              SMS reading is not available on this device. Please copy and paste 
              your transaction SMS below.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Paste SMS content here..."
              value={smsContent}
              onChangeText={handleContentChange}
              multiline={true}
              numberOfLines={4}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.pasteButton} 
                onPress={handlePasteFromClipboard}
              >
                <Text style={styles.pasteButtonText}>Paste from Clipboard</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.submitButton,
                  !isDetected && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!isDetected || isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Processing...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

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
          
          {/* Detection Badge */}
          {isDetected && parsedData && (
            <View style={styles.detectionBadge}>
              <Text style={styles.detectionText}>✓ Auto-detected transaction</Text>
            </View>
          )}
          
          {/* Preview Card */}
          {parsedData && (
            <View style={styles.previewCard}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Platform</Text>
                <Text style={styles.previewValue}>{parsedData.platform}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Amount</Text>
                <Text style={styles.previewAmount}>GHS {parsedData.amount_received}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Your Profit</Text>
                <Text style={styles.previewValue}>GHS {parsedData.rider_profit}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Platform Fee</Text>
                <Text style={styles.previewValue}>GHS {parsedData.platform_debt}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Reference</Text>
                <Text style={styles.previewValue}>{parsedData.tx_id}</Text>
              </View>
            </View>
          )}
          
          {/* SMS Input */}
          <TextInput
            style={styles.input}
            placeholder="Paste SMS content here..."
            value={smsContent}
            onChangeText={handleContentChange}
            multiline={true}
            numberOfLines={4}
          />
          
          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.pasteButton} 
              onPress={handlePasteFromClipboard}
            >
              <Text style={styles.pasteButtonText}>Paste from Clipboard</Text>
            </TouchableOpacity>
            {smsContent.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={handleClear}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Submit Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton, 
                styles.submitButton,
                (!isDetected || isLoading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!isDetected || isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Processing...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ManualSMSModal;
