import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

const PeriodFilter = ({
  dropdownVisible,
  period,
  onPeriodChange,
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

  const getDateRange = (periodOption) => {
    const now = new Date();
    let startDate, endDate;

    switch (periodOption) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    return { startDate, endDate };
  };

  return (
    <View style={styles.dropdown}>
      {["today", "week", "month", "year", "custom"].map((periodOption) => (
        <TouchableOpacity
          key={periodOption}
          style={[
            styles.dropdownItem,
            period.type === periodOption && styles.selectedDropdownItem,
          ]}
          onPress={() => {
            if (periodOption === "custom") {
              setCustomDateModalVisible(true);
            } else {
              const dateRange = getDateRange(periodOption);
              onPeriodChange({ type: periodOption, ...dateRange });
            }
            setDropdownVisible(false);
          }}
        >
          <Text
            style={[
              styles.dropdownText,
              period.type === periodOption && styles.selectedDropdownText,
            ]}
          >
            {periodOption === "today"
              ? "Today"
              : periodOption === "week"
                ? "This Week"
                : periodOption === "month"
                  ? "This Month"
                  : periodOption === "year"
                    ? "This Year"
                    : periodOption === "custom"
                      ? "Custom Date"
                      : "Filter"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default PeriodFilter;