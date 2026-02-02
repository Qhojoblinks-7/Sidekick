import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';

export const EditTransactionModal = ({
  visible,
  onClose,
  transaction,
  onSave,
  onMarkAsTip,
  isUpdating,
}) => {
  const { colors } = useContext(ThemeContext);
  const [deliveryFee, setDeliveryFee] = useState('');
  const [isTipMode, setIsTipMode] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDeliveryFee('');
      setIsTipMode(false);
    }
  }, [transaction]);

  const handleMarkAsTip = () => {
    setIsTipMode(true);
    onMarkAsTip();
  };

  const handleFeeUpdate = () => {
    const fee = parseFloat(deliveryFee);
    if (isNaN(fee) || fee < 0 || fee > parseFloat(transaction?.amount || 0)) {
      return false;
    }
    onSave(fee);
    return true;
  };

  const quickAmounts = [2, 5, 10, 20];
  const profitAmount = parseFloat(transaction?.amount || 0);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      width: '90%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textMain,
      letterSpacing: -0.5,
    },
    closeButton: {
      padding: 4,
    },
    // Transaction Summary Card
    summaryCard: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textMain,
    },
    profitHighlight: {
      color: colors.profit || '#10b981',
    },
    // Tip Toggle
    tipToggleContainer: {
      marginBottom: 20,
    },
    tipToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: isTipMode ? '#fbbf24' : colors.border,
    },
    tipToggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tipIcon: {
      marginRight: 12,
    },
    tipText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textMain,
    },
    tipSubtext: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    // Fee Input Section
    feeSection: {
      marginBottom: 20,
    },
    feeLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    feeLabelDisabled: {
      color: colors.textMuted,
      opacity: 0.5,
    },
    // Quick Tap Grid
    quickGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      gap: 8,
    },
    quickButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickButtonActive: {
      backgroundColor: colors.profit,
      borderColor: colors.profit,
    },
    quickButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textMain,
    },
    // Fee Input
    feeInput: {
      borderWidth: 1,
      borderColor: isTipMode ? colors.border : colors.profit,
      borderRadius: 12,
      padding: 16,
      fontSize: 24,
      color: isTipMode ? colors.textMuted : colors.textMain,
      backgroundColor: isTipMode ? colors.background : colors.card,
      textAlign: 'center',
      textDecorationLine: isTipMode ? 'line-through' : 'none',
    },
    // Action Buttons
    actionButtons: {
      gap: 10,
    },
    markTipButton: {
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: '#fbbf24',
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    markTipButtonText: {
      color: '#1f2937',
      fontWeight: '800',
      fontSize: 16,
    },
    updateButton: {
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.profit,
      alignItems: 'center',
    },
    updateButtonText: {
      color: colors.textMain,
      fontWeight: '800',
      fontSize: 16,
    },
    cancelButton: {
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: 'transparent',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    // Profit Preview
    profitPreview: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.profit + '20',
      borderRadius: 10,
      alignItems: 'center',
    },
    profitPreviewLabel: {
      fontSize: 10,
      color: colors.textMuted,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    profitPreviewValue: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.profit,
      marginTop: 4,
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
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Transaction</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform</Text>
              <Text style={styles.summaryValue}>{transaction?.platform}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Received</Text>
              <Text style={[styles.summaryValue, { color: colors.textMain }]}>
                GH₵ {profitAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{transaction?.time}</Text>
            </View>
          </View>

          {/* Tip Toggle */}
          <View style={styles.tipToggleContainer}>
            <TouchableOpacity
              style={styles.tipToggle}
              onPress={handleMarkAsTip}
              disabled={isUpdating}
            >
              <View style={styles.tipToggleLeft}>
                <View style={styles.tipIcon}>
                  <Ionicons 
                    name={isTipMode ? "sparkles" : "sparkles-outline"} 
                    size={24} 
                    color="#fbbf24" 
                  />
                </View>
                <View>
                  <Text style={styles.tipText}>
                    {isTipMode ? "✨ Marked as Tip" : "Mark as Tip"}
                  </Text>
                  <Text style={styles.tipSubtext}>
                    {isTipMode 
                      ? "Full amount is your profit" 
                      : "All money goes to you"}
                  </Text>
                </View>
              </View>
              <Ionicons 
                name={isTipMode ? "checkbox" : "square-outline"} 
                size={24} 
                color="#fbbf24" 
              />
            </TouchableOpacity>
          </View>

          {/* Fee Section */}
          <View style={styles.feeSection}>
            <Text style={[styles.feeLabel, isTipMode && styles.feeLabelDisabled]}>
              Delivery Fee (Platform Cut)
            </Text>
            
            {/* Quick Tap Grid */}
            {!isTipMode && (
              <View style={styles.quickGrid}>
                {quickAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.quickButton,
                      deliveryFee === String(amount) && styles.quickButtonActive,
                    ]}
                    onPress={() => setDeliveryFee(String(amount))}
                  >
                    <Text style={styles.quickButtonText}>GH₵ {amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <TextInput
              style={styles.feeInput}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              editable={!isTipMode}
            />

            {/* Profit Preview */}
            {!isTipMode && deliveryFee && (
              <View style={styles.profitPreview}>
                <Text style={styles.profitPreviewLabel}>Your Profit</Text>
                <Text style={styles.profitPreviewValue}>
                  GH₵ {(profitAmount - parseFloat(deliveryFee || 0)).toFixed(2)}
                </Text>
              </View>
            )}

            {isTipMode && (
              <View style={styles.profitPreview}>
                <Text style={styles.profitPreviewLabel}>✨ Your Profit (Tip)</Text>
                <Text style={[styles.profitPreviewValue, { fontSize: 28 }]}>
                  GH₵ {profitAmount.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!isTipMode && (
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleFeeUpdate}
                disabled={isUpdating || !deliveryFee}
              >
                <Text style={styles.updateButtonText}>
                  {isUpdating ? "Updating..." : "Update Fee"}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.markTipButton, isTipMode && { backgroundColor: colors.profit }]}
              onPress={handleMarkAsTip}
              disabled={isUpdating}
            >
              <Ionicons name="sparkles" size={18} color="#1f2937" />
              <Text style={styles.markTipButtonText}>
                {isTipMode ? "Tip Confirmed!" : "Mark as Tip"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditTransactionModal;
