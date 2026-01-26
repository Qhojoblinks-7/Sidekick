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
import { ThemeContext } from "../contexts/ThemeContext";
import { isMoMoTransactionSMS } from "../services/smsService";
import { apiCall } from "../services/apiService";

const ManualSMSModal = ({ visible, onClose }) => {
  const { colors } = useContext(ThemeContext);
  const [smsContent, setSmsContent] = useState("");

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
      const parsed = parseSMS(smsContent);
      if (!parsed) {
        Alert.alert("Invalid SMS", "Could not parse the SMS content.");
        return;
      }
      const endpoint = parsed.type === 'transaction' ? '/api/transactions/' : '/api/expenses/';
      const response = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });
      if (response.ok) {
        Alert.alert("Success", `${parsed.type === 'transaction' ? 'Transaction' : 'Expense'} processed successfully.`);
        setSmsContent("");
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert("Error", errorData.detail || "Failed to process.");
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
      color: colors.textMuted,
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