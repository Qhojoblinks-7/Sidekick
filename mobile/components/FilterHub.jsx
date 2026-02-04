import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';

export const FilterHub = ({ 
  selectedFilter, 
  onFilterChange, 
  transactionCount, 
  isSelectMode, 
  onSelectModeChange,
  selectedItemsCount,
  totalItems,
  onSelectAll,
  onDeselectAll
}) => {
  const { colors } = useContext(ThemeContext);

  const filters = [
    { key: 'All', label: 'All', color: colors.textMain },
    { key: 'Yango', label: 'Yango', color: colors.yango?.yellow || '#fbbf24' },
    { key: 'Bolt', label: 'Bolt', color: colors.bolt?.green || '#10b981' },
    { key: 'Private', label: 'Private', color: colors.textMuted, showLock: true },
  ];

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    subtitle: {
      color: colors.profit,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 2,
    },
    selectButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    selectButtonActive: {
      backgroundColor: colors.profit,
      borderColor: colors.profit,
    },
    selectButtonText: {
      color: colors.textMain,
      fontWeight: 'bold',
      fontSize: 12,
    },
    selectButtonTextActive: {
      color: colors.textMain,
    },
    // Segmented Control
    segmentedContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
    },
    segmentActive: {
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    segmentText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },
    segmentTextActive: {
      color: colors.textMain,
    },
    lockIcon: {
      marginLeft: 4,
    },
    // Select Mode Bar
    selectModeBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
    },
    selectInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectCount: {
      color: colors.textMain,
      fontWeight: 'bold',
      fontSize: 14,
    },
    selectActions: {
      flexDirection: 'row',
      gap: 8,
    },
    selectAction: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    selectActionText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMain,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header with Select Button */}
      <View style={styles.headerContent}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Transactions Feed</Text>
          <Text style={styles.subtitle}>
            {transactionCount > 0 
              ? `Processing ${transactionCount} MoMo message${transactionCount !== 1 ? 's' : ''} today`
              : 'No messages detected yet'
            }
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.selectButton, isSelectMode && styles.selectButtonActive]}
          onPress={() => {
            onSelectModeChange(!isSelectMode);
            if (isSelectMode) {
              onSelectAll();
            }
          }}
        >
          <Text style={[styles.selectButtonText, isSelectMode && styles.selectButtonTextActive]}>
            {isSelectMode ? 'Cancel' : 'Select'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Select Mode Bar or Segmented Control */}
      {isSelectMode ? (
        <View style={styles.selectModeBar}>
          <View style={styles.selectInfo}>
            <Text style={styles.selectCount}>
              {selectedItemsCount} of {totalItems} selected
            </Text>
          </View>
          <View style={styles.selectActions}>
            <TouchableOpacity style={styles.selectAction} onPress={onSelectAll}>
              <Text style={styles.selectActionText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectAction} onPress={onDeselectAll}>
              <Text style={styles.selectActionText}>Deselect All</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.segmentedContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.segment,
                selectedFilter === filter.key && styles.segmentActive,
              ]}
              onPress={() => onFilterChange(filter.key)}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedFilter === filter.key && styles.segmentTextActive,
                  { color: selectedFilter === filter.key ? filter.color : colors.textMuted },
                ]}
              >
                {filter.label}
              </Text>
              {filter.showLock && (
                <Ionicons 
                  name="lock-closed" 
                  size={12} 
                  color={colors.textMuted} 
                  style={styles.lockIcon}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default FilterHub;
