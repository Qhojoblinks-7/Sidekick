import React, { useContext, useMemo, useRef, useEffect } from 'react';
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
  const hasShownPicker = useRef(false);

  /**
   * ANDROID LOGIC: 
   * Uses the native Imperative API to open the system dialog directly.
   */
  const showAndroidPicker = () => {
    // Prevent multiple picker opens
    if (hasShownPicker.current) {
      console.log('[DEBUG] hasShownPicker is true, preventing duplicate picker open');
      return;
    }
    hasShownPicker.current = true;
    console.log('[DEBUG] showAndroidPicker called with customDate:', customDate ? customDate.toISOString() : 'null');

    DateTimePickerAndroid.open({
      value: customDate || new Date(),
      onChange: (event, selectedDate) => {
        console.log('[DEBUG] DateTimePicker onChange event:', event.type, selectedDate ? selectedDate.toISOString() : 'null');
        // Close our internal state trigger
        setCustomDateModalVisible(false);
        
        if (event.type === 'set' && selectedDate) {
          // Set to midnight (12 AM) of the selected date
          const midnightDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
          setCustomDate(midnightDate);
          const startDate = new Date(midnightDate);
          const endDate = new Date(midnightDate);
          endDate.setDate(endDate.getDate() + 1); // 12 AM next day
          setSelectedPeriod({ type: "custom", startDate, endDate });
        }
      },
      mode: 'date',
      display: 'calendar', // Your preferred style
    });
  };

  // Reset the ref when modal visibility changes
  useEffect(() => {
    console.log('[DEBUG] useEffect triggered - customDateModalVisible:', customDateModalVisible, 'customDate:', customDate ? customDate.toISOString() : 'null');
    if (customDateModalVisible) {
      hasShownPicker.current = false;
      console.log('[DEBUG] hasShownPicker reset to false');
      // Small delay to ensure component is ready
      const timer = setTimeout(() => {
        console.log('[DEBUG] setTimeout callback executed, calling showAndroidPicker');
        showAndroidPicker();
      }, 100);
      return () => {
        console.log('[DEBUG] useEffect cleanup - clearing timeout');
        clearTimeout(timer);
      };
    }
  }, [customDateModalVisible, customDate]);

  /**
   * iOS LOGIC:
   * Handles the local state inside the Modal.
   */
  const handleIosChange = (event, selectedDate) => {
    if (selectedDate) setCustomDate(selectedDate);
  };

  const handleIosSave = () => {
    // Set to midnight (12 AM) of the selected date
    const midnightDate = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate(), 0, 0, 0, 0);
    setCustomDate(midnightDate);
    const startDate = new Date(midnightDate);
    const endDate = new Date(midnightDate);
    endDate.setDate(endDate.getDate() + 1); // 12 AM next day
    setSelectedPeriod({ type: "custom", startDate, endDate });
    setCustomDateModalVisible(false);
  };

  // Don't render anything on Android (picker is native)
  if (Platform.OS === 'android' && customDateModalVisible) {
    return null;
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