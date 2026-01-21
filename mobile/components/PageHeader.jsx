import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';
import PeriodFilter from './PeriodFilter.jsx';

const PageHeader = ({
  dropdownVisible,
  setDropdownVisible,
  setCustomDateModalVisible,
  selectedPeriod,
  setSelectedPeriod,
}) => {
  const { colors } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    header: {
      marginBottom: 32,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    calendarButton: {
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 10,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterText: {
      color: colors.textMain,
      fontSize: 12,
      fontWeight: "bold",
      marginLeft: 4,
    },
    title: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    mainTitle: {
      color: colors.textMain,
      fontSize: 30,
      fontWeight: "900",
    },
    rightContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    filterContainer: {
      position: "relative",
    },
  });

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Text style={styles.mainTitle}>Dashboard</Text>
        <View style={styles.rightContainer}>
          <TouchableOpacity
            onPress={() => {
              setDropdownVisible(false);
              setCustomDateModalVisible(true);
            }}
            style={styles.calendarButton}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.textMain} />
          </TouchableOpacity>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              onPress={() => setDropdownVisible(!dropdownVisible)}
              style={styles.filterButton}
            >
              <Ionicons
                name="filter-outline"
                size={20}
                color={colors.textMain}
              />
              <Text style={styles.filterText}>
                {selectedPeriod === "today"
                  ? "Today"
                  : selectedPeriod === "week"
                    ? "This Week"
                    : selectedPeriod === "month"
                      ? "This Month"
                      : selectedPeriod === "year"
                        ? "This Year"
                        : selectedPeriod === "custom"
                          ? "Custom Date"
                          : "Filter"}
              </Text>
              <Ionicons
                name={dropdownVisible ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.textMain}
              />
            </TouchableOpacity>
            <PeriodFilter
              dropdownVisible={dropdownVisible}
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
              setDropdownVisible={setDropdownVisible}
              setCustomDateModalVisible={setCustomDateModalVisible}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default PageHeader;