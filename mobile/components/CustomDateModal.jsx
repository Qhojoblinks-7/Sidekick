import React, { useContext, useMemo } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  Platform, 
  StyleSheet 
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { ThemeContext } from '../contexts/ThemeContext';

const CustomDateModal = ({
  customDateModalVisible,
  setCustomDateModalVisible,
  customDate,
  setCustomDate,
  setSelectedPeriod,
}) => {
  const { colors, theme } = useContext(ThemeContext);
  const styles = useMemo(() => createStyles(colors), [colors]);

  /**
   * ANDROID LOGIC: 
   * Uses the native Imperative API to open the system dialog directly.
   */
  const showAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: customDate || new Date(),
      onChange: (event, selectedDate) => {
        // Close our internal state trigger
        setCustomDateModalVisible(false);
        
        if (event.type === 'set' && selectedDate) {
          setCustomDate(selectedDate);
          const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
          setSelectedPeriod({ type: "custom", startDate, endDate });
        }
      },
      mode: 'date',
      display: 'calendar', // Your preferred style
    });
  };

  /**
   * iOS LOGIC:
   * Handles the local state inside the Modal.
   */
  const handleIosChange = (event, selectedDate) => {
    if (selectedDate) setCustomDate(selectedDate);
  };

  const handleIosSave = () => {
    const startDate = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate());
    const endDate = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate() + 1);
    setSelectedPeriod({ type: "custom", startDate, endDate });
    setCustomDateModalVisible(false);
  };

  // Trigger Android native picker if modal becomes visible
  if (Platform.OS === 'android' && customDateModalVisible) {
    showAndroidPicker();
    return null; // Don't render a Modal on Android
  }

  // iOS Rendering
  return (
    <Modal
      visible={customDateModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setCustomDateModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        onPress={() => setCustomDateModalVisible(false)} 
        activeOpacity={1}
      >
        <TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Custom Date</Text>
            
            <DateTimePicker
              value={customDate || new Date()}
              mode="date"
              display="inline" // Modern iOS 14+ look
              themeVariant={theme}
              onChange={handleIosChange}
              style={styles.datePicker}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCustomDateModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleIosSave}
              >
                <Text style={styles.saveButtonText}>Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const createStyles = (colors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    color: colors.textMain,
  },
  datePicker: {
    width: '100%',
    height: 320,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 8,
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
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: '700',
  },
});

export default CustomDateModal;