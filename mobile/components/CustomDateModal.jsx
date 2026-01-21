import React, { useContext } from 'react';
import { Modal, View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemeContext } from '../contexts/ThemeContext';

const CustomDateModal = ({
  customDateModalVisible,
  setCustomDateModalVisible,
  customDate,
  setCustomDate,
  setSelectedPeriod,
}) => {
  const { colors } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      width: '80%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 20,
      color: colors.textMain,
    },
    datePicker: {
      alignSelf: 'center',
      marginVertical: 20,
      height: 200,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    modalButton: {
      flex: 1,
      padding: 10,
      borderRadius: 10,
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.profit,
    },
    cancelButtonText: {
      color: colors.textMain,
      textAlign: 'center',
    },
    saveButtonText: {
      color: colors.textMain,
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={customDateModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setCustomDateModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Custom Date</Text>
          <DateTimePicker
            value={customDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setCustomDate(selectedDate || customDate);
              if (Platform.OS === 'android' && selectedDate) {
                setSelectedPeriod("custom");
                setCustomDateModalVisible(false);
              }
            }}
            style={styles.datePicker}
          />
          {Platform.OS === 'ios' && (
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCustomDateModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  setSelectedPeriod("custom");
                  setCustomDateModalVisible(false);
                }}
              >
                <Text style={styles.saveButtonText}>Select</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CustomDateModal;