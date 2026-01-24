import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';

const SMSConsentModal = ({ visible, onConsent, onDeny }) => {
  const { colors } = React.useContext(ThemeContext);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark-outline" size={32} color={colors.profit} />
          <Text style={[styles.title, { color: colors.textMain }]}>SMS Permission Required</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            To automatically track your ride earnings and expenses, Sidekick needs access to your SMS messages. This allows us to:
          </Text>

          <View style={styles.bulletPoints}>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color={colors.profit} />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                Read mobile money transaction messages (MTN Mobile Money, AirtelTigo Money, etc.)
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color={colors.profit} />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                Automatically record payments received from Bolt, Yango, and other platforms
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color={colors.profit} />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                Track expenses and transfers for accurate profit calculations
              </Text>
            </View>
          </View>

          <Text style={[styles.privacyNote, { color: colors.textMuted }]}>
            Your SMS data is processed locally on your device and only transaction details are sent to our secure server. We never store or share your full message content.
          </Text>
        </ScrollView>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.denyButton, { borderColor: colors.border }]}
            onPress={onDeny}
          >
            <Text style={[styles.buttonText, { color: colors.textMuted }]}>Deny</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.consentButton, { backgroundColor: colors.profit }]}
            onPress={onConsent}
          >
            <Text style={[styles.buttonText, { color: colors.textMain }]}>Allow Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
  },
  content: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  bulletPoints: {
    marginBottom: 20,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  privacyNote: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  denyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  consentButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SMSConsentModal;