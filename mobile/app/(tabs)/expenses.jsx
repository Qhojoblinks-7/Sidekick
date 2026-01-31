import React, { useState, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  Animated,
  Dimensions,
  TextInput,
  Vibration,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { apiCall } from '../../services/apiService';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addExpense, selectDailyTarget } from '../../store/store';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'Fuel', icon: 'car', color: '#14b8a6' },      // Teal
  { id: 'Data', icon: 'wifi', color: '#3b82f6' },     // Blue
  { id: 'Food', icon: 'restaurant', color: '#f59e0b' }, // Amber
  { id: 'Repairs', icon: 'build', color: '#8b5cf6' },  // Purple
  { id: 'Other', icon: 'ellipsis-horizontal', color: '#6b7280' }, // Gray
];

export default function Expenses() {
  const { colors } = useContext(ThemeContext);
  const { showToast } = useToast();
  const { expenses } = useSelector(state => state.data);
  const dailyTarget = useSelector(selectDailyTarget);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  // Calculate daily stats
  const todayExpenses = expenses
    .filter(exp => {
      const expDate = new Date(exp.created_at);
      const today = new Date();
      return expDate.toDateString() === today.toDateString();
    })
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  // Use daily target as reference for burn percentage (or 80% of target as reasonable daily earnings)
  const averageDailyEarnings = dailyTarget * 0.8; // 80% of daily profit target
  const burnPercentage = Math.min((todayExpenses / averageDailyEarnings) * 100, 100);
  const isWarning = burnPercentage > 70;

  // Get last logged time for each category
  const getLastLogged = (categoryId) => {
    const categoryExpenses = expenses.filter(exp => exp.category === categoryId.toUpperCase());
    if (categoryExpenses.length === 0) return null;
    const lastExpense = categoryExpenses.reduce((latest, exp) => 
      new Date(exp.created_at) > new Date(latest.created_at) ? exp : latest
    );
    const diff = new Date() - new Date(lastExpense.created_at);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomSheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Mutations
  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData) => {
      const response = await apiCall('/api/expenses/', {
        method: 'POST',
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) throw new Error('Failed to add expense');
      return response.json();
    },
    onSuccess: (data) => {
      dispatch(addExpense(data));
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries({ queryKey: ['periodSummary'] });
      showToast('Expense logged!', 'success');
      closeBottomSheet();
    },
    onError: () => {
      showToast('Failed to log expense', 'error');
    },
  });

  // Bottom Sheet
  const openBottomSheet = (category) => {
    setSelectedCategory(category);
    setAmount('');
    Animated.spring(bottomSheetAnim, {
      toValue: SCREEN_HEIGHT * 0.5,
      useNativeDriver: true,
    }).start();
  };

  const closeBottomSheet = () => {
    Animated.timing(bottomSheetAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedCategory(null);
      setAmount('');
    });
  };

  // Haptic feedback
  const handleTilePress = (category) => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    } else {
      Vibration.vibrate(50);
    }
    openBottomSheet(category);
  };

  const handleSaveExpense = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    addExpenseMutation.mutate({
      amount: parseFloat(amount),
      category: selectedCategory.id.toUpperCase(),
      description: `${selectedCategory.id} expense`,
      created_at: new Date().toISOString(),
    });
  };

  // Recent expenses for feed
  const recentExpenses = expenses
    .filter(exp => {
      const expDate = new Date(exp.created_at);
      const today = new Date();
      const diff = today - expDate;
      return diff < 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 10,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    title: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    mainTitle: {
      color: colors.textMain,
      fontSize: 32,
      fontWeight: '900',
      marginBottom: 8,
    },
    scroll: {
      flex: 1,
      paddingHorizontal: 20,
    },

    // Burn Meter
    burnMeterCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
    },
    burnMeterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    burnMeterLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    burnMeterValue: {
      color: isWarning ? '#f97316' : '#14b8a6',
      fontSize: 24,
      fontWeight: '900',
    },
    burnMeterSubtext: {
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: 4,
    },
    progressBarContainer: {
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 6,
      backgroundColor: isWarning ? '#f97316' : '#14b8a6',
      width: `${burnPercentage}%`,
    },
    progressThreshold: {
      position: 'absolute',
      left: '70%',
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },

    // Category Tiles
    categoryTitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    categoryTile: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryTileOther: {
      width: '100%',
      justifyContent: 'center',
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryLabel: {
      color: colors.textMain,
      fontSize: 14,
      fontWeight: 'bold',
    },
    lastLogged: {
      color: colors.textTertiary,
      fontSize: 10,
      marginTop: 2,
    },

    // Recent History Feed
    historyTitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginBottom: 12,
      marginTop: 8,
    },
    historyCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    historyLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    historyIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    historyText: {
      color: colors.textMain,
      fontSize: 14,
      fontWeight: '600',
    },
    historyAmount: {
      color: colors.expense,
      fontSize: 16,
      fontWeight: 'bold',
    },

    // Bottom Sheet
    bottomSheetOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    bottomSheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: SCREEN_HEIGHT * 0.5,
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      transform: [{ translateY: bottomSheetAnim }],
    },
    dragHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    sheetCategory: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    sheetCategoryIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    sheetCategoryLabel: {
      color: colors.textMain,
      fontSize: 20,
      fontWeight: 'bold',
    },
    amountInput: {
      backgroundColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.textMain,
      textAlign: 'center',
      marginBottom: 24,
    },
    confirmButton: {
      backgroundColor: amount ? '#10b981' : colors.border,
      borderRadius: 16,
      padding: 18,
      alignItems: 'center',
      marginTop: 12,
    },
    confirmButtonText: {
      color: amount ? '#000' : colors.textMuted,
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Financial Command</Text>
        <Text style={styles.mainTitle}>Outgoings</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Burn Meter */}
        <View style={styles.burnMeterCard}>
          <View style={styles.burnMeterHeader}>
            <Text style={styles.burnMeterLabel}>Daily Burn</Text>
            <View>
              <Text style={styles.burnMeterValue}>-GH₵ {todayExpenses.toFixed(2)}</Text>
              <Text style={styles.burnMeterSubtext}>
                {burnPercentage.toFixed(0)}% of daily earnings
              </Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar} />
            <View style={styles.progressThreshold} />
          </View>
        </View>

        {/* Category Tiles */}
        <Text style={styles.categoryTitle}>Log Expense</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category, index) => {
            const lastLogged = getLastLogged(category.id);
            const isOther = category.id === 'Other';
            const isLastInRow = (index + 1) % 2 === 0;
            const shouldCenter = isOther && !isLastInRow;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryTile,
                  shouldCenter && styles.categoryTileOther
                ]}
                onPress={() => handleTilePress(category)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon} size={20} color={category.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryLabel}>{category.id}</Text>
                  {lastLogged && (
                    <Text style={styles.lastLogged}>Last: {lastLogged}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent History Feed */}
        <Text style={styles.historyTitle}>Recent</Text>
        {recentExpenses.length > 0 ? (
          recentExpenses.map((expense) => {
            const catConfig = CATEGORIES.find(c => c.id.toUpperCase() === expense.category) || CATEGORIES[4];
            return (
              <View key={expense.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View style={[styles.historyIcon, { backgroundColor: catConfig.color + '20' }]}>
                    <Ionicons name={catConfig.icon} size={18} color={catConfig.color} />
                  </View>
                  <Text style={styles.historyText}>
                    {new Date(expense.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={styles.historyAmount}>-GH₵ {parseFloat(expense.amount).toFixed(2)}</Text>
              </View>
            );
          })
        ) : (
          <Text style={[styles.lastLogged, { textAlign: 'center', marginTop: 20 }]}>
            No expenses today. Tap a category to log one.
          </Text>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Sheet */}
      {selectedCategory && (
        <>
          <TouchableOpacity 
            style={styles.bottomSheetOverlay} 
            onPress={closeBottomSheet}
            activeOpacity={1}
          />
          <Animated.View style={styles.bottomSheet}>
            <View style={styles.dragHandle} />
            
            <View style={styles.sheetCategory}>
              <View style={[styles.sheetCategoryIcon, { backgroundColor: selectedCategory.color + '20' }]}>
                <Ionicons name={selectedCategory.icon} size={24} color={selectedCategory.color} />
              </View>
              <Text style={styles.sheetCategoryLabel}>{selectedCategory.id}</Text>
            </View>

            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus={true}
              maxLength={8}
            />

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleSaveExpense}
              disabled={!amount || isLoading}
            >
              <Text style={styles.confirmButtonText}>
                {isLoading ? 'Saving...' : 'Log Expense'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}
