import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { Button } from '../../components/ui/Button';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { API_BASE_URL } from '../../constants/API';
import { apiCall } from '../../services/apiService';
import { useSelector, useDispatch } from 'react-redux';
import { addExpense, setSummary } from '../../store/store';
import CustomDateModal from '../../components/CustomDateModal';

export default function Expenses() {
   const { colors } = useContext(ThemeContext);
   const { showToast } = useToast();
   const dispatch = useDispatch();
   const { dailyTarget } = useSelector(state => state.settings);
   const { summary, expenses } = useSelector(state => state.data);

   const [amount, setAmount] = useState('');
   const [category, setCategory] = useState('Fuel');
   const [isLoading, setIsLoading] = useState(false);
   const [expenseDate, setExpenseDate] = useState(new Date());
   const [expenseDateModalVisible, setExpenseDateModalVisible] = useState(false);
   const [amountPopupVisible, setAmountPopupVisible] = useState(false);
   const [categoryPopupVisible, setCategoryPopupVisible] = useState(false);
   const [datePopupVisible, setDatePopupVisible] = useState(false);

  const categories = ['Fuel', 'Data', 'Food', 'Repairs', 'Other'];
  const categoryMap = {
    'Fuel': 'FUEL',
    'Data': 'DATA',
    'Food': 'FOOD',
    'Repairs': 'REPAIRS',
    'Other': 'OTHER'
  };

  const handleSaveExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiCall('/api/expenses/', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          category: categoryMap[category],
          description: `${category} expense`,
          created_at: expenseDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to save expense: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Expense saved:', result);

      // Update Redux store with new expense and updated summary
      dispatch(addExpense(result));

      // Update summary with new expense amount
      const updatedSummary = {
        ...summary,
        expenses: summary.expenses + parseFloat(amount),
        net_profit: summary.net_profit - parseFloat(amount)
      };
      dispatch(setSummary(updatedSummary));

      // Reset form
      setAmount('');
      setCategory('Fuel');
      setExpenseDate(new Date());

      // Show success toast
      showToast('Expense logged successfully!', 'success');

    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', 'Failed to save expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 16,
      marginBottom: 32,
    },
    scroll: {
      height: 600,
      paddingHorizontal: 16,
      paddingBottom: 20,
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
      fontSize: 30,
      fontWeight: '900',
    },
    dailyBurnContainer: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 32,
      alignItems: 'center',
    },
    dailyBurnText: {
      color: colors.expense,
      fontSize: 16,
      fontWeight: 'bold',
    },
    addButton: {
      backgroundColor: colors.profit,
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 40,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
    },
    categoryTitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginBottom: 16,
      marginLeft: 8,
    },
    categoriesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      marginBottom: 40,
    },
    categoryIcon: {
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      width: 80,
      marginBottom: 16,
    },
    categoryLabel: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: 'bold',
      marginTop: 8,
      textAlign: 'center',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      width: '80%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textMain,
      textAlign: 'center',
      marginBottom: 20,
    },
    inputLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 24,
      color: colors.textMain,
      backgroundColor: colors.card,
      marginBottom: 20,
      textAlign: 'center',
    },
    modalCategoriesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    modalCategoryButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    selected: {
      backgroundColor: colors.profit,
      borderColor: colors.profit,
    },
    unselected: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    categoryText: {
      fontWeight: 'bold',
      fontSize: 12,
    },
    selectedText: {
      color: colors.textMain,
    },
    unselectedText: {
      color: colors.textMuted,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.profit,
    },
    cancelButtonText: {
      color: colors.textMuted,
      fontWeight: 'bold',
    },
    saveButtonText: {
      color: colors.textMain,
      fontWeight: 'bold',
    },
    dateButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      backgroundColor: colors.card,
      marginBottom: 20,
      alignItems: 'center',
    },
    dateButtonText: {
      fontSize: 16,
      color: colors.textMain,
    },
  });

  // Calculate today's expenses
  const todayExpenses = expenses
    .filter(exp => {
      const expDate = new Date(exp.created_at);
      const today = new Date();
      return expDate.toDateString() === today.toDateString();
    })
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
        </Text>
        <Text style={styles.mainTitle}>Outgoings</Text>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Daily Burn Summary */}
        <View style={styles.dailyBurnContainer}>
          <Text style={styles.dailyBurnText}>
            It cost you GH₵{todayExpenses.toFixed(2)} to work today.
          </Text>
        </View>

        {/* Big Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAmountPopupVisible(true)}
        >
          <Ionicons name="add" size={60} color={colors.textMain} />
        </TouchableOpacity>

        {/* Category Icons */}
        <Text style={styles.categoryTitle}>Quick Add</Text>
        <View style={styles.categoriesContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => {
                setCategory(cat);
                setAmountPopupVisible(true);
              }}
              style={styles.categoryIcon}
            >
              <Ionicons
                name={
                  cat === 'Fuel' ? 'car' :
                  cat === 'Data' ? 'wifi' :
                  cat === 'Food' ? 'restaurant' :
                  cat === 'Repairs' ? 'build' :
                  'ellipsis-horizontal'
                }
                size={32}
                color={colors.textMain}
              />
              <Text style={styles.categoryLabel}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Amount Popup */}
      <Modal
        visible={amountPopupVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAmountPopupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Amount</Text>

            <Text style={styles.inputLabel}>Amount (GHS)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAmountPopupVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  if (!amount || parseFloat(amount) <= 0) {
                    Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
                    return;
                  }
                  setAmountPopupVisible(false);
                  setCategoryPopupVisible(true);
                }}
              >
                <Text style={styles.saveButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Popup */}
      <Modal
        visible={categoryPopupVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCategoryPopupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>

            <Text style={styles.categoryTitle}>Category</Text>
            <View style={styles.modalCategoriesContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.modalCategoryButton, category === cat ? styles.selected : styles.unselected]}
                >
                  <Text style={[styles.categoryText, category === cat ? styles.selectedText : styles.unselectedText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCategoryPopupVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  setCategoryPopupVisible(false);
                  setDatePopupVisible(true);
                }}
              >
                <Text style={styles.saveButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Popup */}
      <Modal
        visible={datePopupVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDatePopupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>

            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setExpenseDateModalVisible(true)}
            >
              <Text style={styles.dateButtonText}>{expenseDate.toDateString()}</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDatePopupVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  setDatePopupVisible(false);
                  handleSaveExpense();
                }}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Adding...' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomDateModal
        customDateModalVisible={expenseDateModalVisible}
        setCustomDateModalVisible={setExpenseDateModalVisible}
        customDate={expenseDate}
        setCustomDate={setExpenseDate}
        setSelectedPeriod={() => {}}
      />

    </SafeAreaView>
  );
}