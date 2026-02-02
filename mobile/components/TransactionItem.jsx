import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';

export const TransactionItem = ({ 
  platform, 
  amount, 
  time, 
  type, 
  status, 
  onPress, 
  onLongPress, 
  isSelectMode, 
  isSelected, 
  onSelect, 
  showNetProfit = true,
  isTip = false,
  riderProfit = null,
  platformDebt = null,
  syncStatus = 'synced' // 'synced', 'local', 'edited'
}) => {
  const { colors } = useContext(ThemeContext);
  const isExpense = type === 'expense';
  const isDebt = type === 'debt';

  // Determine platform color and border accent
  let platformColor = colors.textMain;
  let borderColor = colors.border;
  let platformLabel = '';
  
  if (platform === 'YANGO') {
    platformColor = colors.yango ? colors.yango.yellow : '#fbbf24';
    borderColor = colors.yango ? colors.yango.yellow : '#fbbf24';
    platformLabel = 'Y';
  } else if (platform === 'BOLT') {
    platformColor = colors.bolt ? colors.bolt.green : '#10b981';
    borderColor = colors.bolt ? colors.bolt.green : '#10b981';
    platformLabel = 'B';
  } else if (isExpense) {
    platformColor = colors.expense;
    borderColor = colors.expense;
    platformLabel = 'X';
  }

  // Get icon for platform/category
  const getIcon = () => {
    if (platform === 'YANGO') {
      return <Image source={require('../assets/yango.jpg')} style={styles.platformIcon} />;
    } else if (platform === 'BOLT') {
      return <Image source={require('../assets/bolt.png')} style={styles.platformIcon} />;
    } else if (isExpense) {
      const iconName = {
        'FUEL': 'car',
        'DATA': 'wifi',
        'FOOD': 'restaurant',
        'REPAIRS': 'build',
        'OTHER': 'ellipsis-horizontal'
      }[platform] || 'cash';
      return <Ionicons name={iconName} size={24} color={platformColor} />;
    }
    return null;
  };

  // Status dot based on sync status
  const getStatusDot = () => {
    const statusConfig = {
      'synced': { color: colors.profit || '#10b981', icon: 'checkmark-circle', label: 'Synced' },
      'local': { color: colors.textMuted || '#9ca3af', icon: 'ellipse', label: 'Local' },
      'edited': { color: '#fbbf24', icon: 'create', label: 'Edited' },
    };
    const config = statusConfig[syncStatus] || statusConfig['synced'];
    return (
      <View style={styles.statusContainer}>
        <Ionicons name={config.icon} size={12} color={config.color} />
        <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  // Split logic display
  const showSplitLogic = !isExpense && !isDebt && (riderProfit !== null || platformDebt !== null);
  const profitValue = riderProfit !== null ? riderProfit : (isDebt ? 0 : amount);
  const debtValue = platformDebt !== null ? platformDebt : 0;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 12,
    },
    // Tip styling - sparkle/gold border
    containerTip: {
      borderColor: '#fbbf24',
      borderWidth: 2,
      backgroundColor: colors.card,
    },
    tipBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fbbf24',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tipBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#1f2937',
      marginLeft: 4,
    },
    // Vertical border accent
    borderAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: borderColor,
    },
    contentContainer: {
      flexDirection: 'row',
      padding: 16,
      paddingLeft: 20, // Account for border accent
    },
    checkboxContainer: {
      marginRight: 12,
      justifyContent: 'center',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.black,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    platformIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    platformLabel: {
      fontWeight: '900',
      fontSize: 13,
      marginBottom: 2,
      letterSpacing: -0.5,
    },
    platform: {
      fontWeight: '900',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    time: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 4,
    },
    statusLabel: {
      fontSize: 9,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    right: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingLeft: 12,
    },
    amount: {
      fontWeight: '900',
      fontSize: 20,
      letterSpacing: -1,
    },
    typeText: {
      color: colors.textTertiary,
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
      fontWeight: '600',
    },
    // Split logic indicator
    splitContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      gap: 8,
    },
    splitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    splitLabel: {
      fontSize: 9,
      fontWeight: '600',
      color: colors.textMuted,
      marginRight: 4,
    },
    splitValue: {
      fontSize: 10,
      fontWeight: '800',
    },
    profitValue: {
      color: colors.profit || '#10b981',
    },
    debtValue: {
      color: colors.expense || '#ef4444',
    },
    expenseLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  const Container = (onPress || onLongPress) ? TouchableOpacity : View;

  return (
    <Container 
      style={[styles.container, isTip && styles.containerTip]} 
      onPress={onPress} 
      onLongPress={onLongPress}
    >
      {/* Tip Badge */}
      {isTip && (
        <View style={styles.tipBadge}>
          <Ionicons name="sparkles" size={12} color="#1f2937" />
          <Text style={styles.tipBadgeText}>TIP</Text>
        </View>
      )}
      
      {/* Vertical Accent */}
      <View style={styles.borderAccent} />
      
      <View style={styles.contentContainer}>
        {isSelectMode && (
          <TouchableOpacity onPress={onSelect} style={styles.checkboxContainer}>
            <Ionicons 
              name={isSelected ? "checkbox" : "square-outline"} 
              size={24} 
              color={isSelected ? colors.profit : colors.textMuted} 
            />
          </TouchableOpacity>
        )}
        
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          <View>
            {!isExpense && !isDebt && (
              <Text style={[styles.platformLabel, { color: platformColor }]}>
                {platform === 'YANGO' ? 'Yango Delivery' : platform === 'BOLT' ? 'Bolt Food' : platform}
              </Text>
            )}
            {isExpense && (
              <Text style={[styles.platform, { color: platformColor }]}>
                {platform === 'FUEL' ? '⛽ Fuel' : platform}
              </Text>
            )}
            <Text style={styles.time}>{time}</Text>
            {getStatusDot()}
          </View>
        </View>
        
        <View style={styles.right}>
          <Text style={[styles.amount, { color: isExpense || isDebt ? colors.expense : colors.textMain }]}>
            {isExpense || isDebt ? '-' : '+'} GH₵ {parseFloat(amount || 0).toFixed(2)}
          </Text>
          <Text style={styles.typeText}>
            {type === 'profit' ? 'Your Fee' : type === 'expense' ? 'Expense' : type === 'debt' ? 'Debt' : type}
          </Text>
          
          {/* Split Logic Indicator */}
          {showSplitLogic && (
            <View style={styles.splitContainer}>
              <View style={styles.splitItem}>
                <Text style={styles.splitLabel}>P:</Text>
                <Text style={[styles.splitValue, styles.profitValue]}>
                  {parseFloat(profitValue).toFixed(0)}
                </Text>
              </View>
              {parseFloat(debtValue) >= 0 && platformDebt !== null && (
                <View style={styles.splitItem}>
                  <Text style={styles.splitLabel}>D:</Text>
                  <Text style={[styles.splitValue, styles.debtValue]}>
                    {parseFloat(debtValue).toFixed(0)}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Expense Label */}
          {isExpense && (
            <Text style={styles.expenseLabel}>[Expense]</Text>
          )}
        </View>
      </View>
    </Container>
  );
};

export default TransactionItem;
