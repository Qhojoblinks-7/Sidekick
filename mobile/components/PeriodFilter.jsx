import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

const PeriodFilter = ({
  dropdownVisible,
  selectedPeriod,
  setSelectedPeriod,
  setDropdownVisible,
  setCustomDateModalVisible,
}) => {
  const { colors } = useContext(ThemeContext);

  if (!dropdownVisible) return null;

  const styles = StyleSheet.create({
    dropdown: {
      position: "absolute",
      top: "100%",
      right: 0,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 8,
      minWidth: 120,
      zIndex: 10,
    },
    dropdownItem: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    selectedDropdownItem: {
      backgroundColor: "rgba(34, 197, 94, 0.1)",
    },
    dropdownText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: "bold",
    },
    selectedDropdownText: {
      color: colors.profit,
    },
  });

  return (
    <View style={styles.dropdown}>
      {["today", "week", "month", "year"].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.dropdownItem,
            selectedPeriod === period && styles.selectedDropdownItem,
          ]}
          onPress={() => {
            if (period === "custom") {
              setCustomDateModalVisible(true);
            } else {
              setSelectedPeriod(period);
            }
            setDropdownVisible(false);
          }}
        >
          <Text
            style={[
              styles.dropdownText,
              selectedPeriod === period && styles.selectedDropdownText,
            ]}
          >
            {period === "today"
              ? "Today"
              : period === "week"
                ? "This Week"
                : period === "month"
                  ? "This Month"
                  : period === "year"
                    ? "This Year"
                    : "Custom Date"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default PeriodFilter;