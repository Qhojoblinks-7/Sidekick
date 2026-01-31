import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';
import PeriodFilter from './PeriodFilter.jsx';
import { format } from 'date-fns';

const PageHeader = ({
  dropdownVisible,
  setDropdownVisible,
  setCustomDateModalVisible,
  period,
  onPeriodChange,
}) => {
  const { colors } = useContext(ThemeContext);

  // Format the date based on selected period
  const formattedDate = useMemo(() => {
    if (period.startDate && period.endDate) {
      return format(period.startDate, 'MMM d, yyyy');
    }
    return format(new Date(), 'MMM d, yyyy');
  }, [period.startDate, period.endDate]);

  const styles = StyleSheet.create({
    header: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateText: {
      color: colors.textMain,
      fontSize: 18,
      fontWeight: "600",
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterText: {
      color: colors.textMain,
      fontSize: 14,
      fontWeight: "600",
      marginRight: 4,
    },
  });
  return (
      <View style={styles.headerRow}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => setDropdownVisible(!dropdownVisible)}
            style={styles.filterButton}
          >
            <Text style={styles.filterText}>
              {period.type === "today"
                ? "Today"
                : period.type === "week"
                  ? "This Week"
                  : period.type === "month"
                    ? "This Month"
                    : period.type === "year"
                      ? "This Year"
                      : period.type === "custom"
                        ? "Custom"
                        : "Filter"}
            </Text>
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={colors.textMain}
            />
          </TouchableOpacity>
          <PeriodFilter
            dropdownVisible={dropdownVisible}
            period={period}
            onPeriodChange={onPeriodChange}
            setDropdownVisible={setDropdownVisible}
            setCustomDateModalVisible={setCustomDateModalVisible}
          />
        </View>
      </View>
  );
};

export default PageHeader;