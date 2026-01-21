import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAddTransaction } from '../hooks/useTransactions';
import { Colors } from '../constants/Colors';

export default function ConfirmModal() {
  const { amount, txId, platform } = useLocalSearchParams();
  const { mutate, isPending } = useAddTransaction();

  const handleYes = () => {
    mutate({
      tx_id: txId,
      amount_received: amount,
      rider_profit: amount,
      platform_debt: 0,
      platform: platform || 'YANGO'
    }, {
      onSuccess: () => router.back()
    });
  };

  const handleNo = () => {
    // For now, assume no delivery fee, all is tip or something
    mutate({
      tx_id: txId,
      amount_received: amount,
      rider_profit: 0,
      platform_debt: amount,
      platform: platform || 'YANGO'
    }, {
      onSuccess: () => router.back()
    });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.question}>
          You received GH₵{amount} for {platform || 'YANGO'}. Is this the exact delivery fee?
        </Text>

        <TouchableOpacity
          disabled={isPending}
          onPress={handleYes}
          style={[styles.button, styles.yesButton]}
        >
          {isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>YES</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          disabled={isPending}
          onPress={handleNo}
          style={[styles.button, styles.noButton]}
        >
          <Text style={styles.buttonText}>NO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 24,
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: Colors.card,
    padding: 32,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  question: {
    color: Colors.textMain,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  yesButton: {
    backgroundColor: Colors.profit,
  },
  noButton: {
    backgroundColor: Colors.expense,
  },
  buttonText: {
    color: Colors.textMain,
    textAlign: 'center',
    fontWeight: '900',
  },
});