import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { Button } from '../../components/ui/Button';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';
import { API_BASE_URL } from '../../constants/API';
import { useSelector, useDispatch } from 'react-redux';
import { addExpense, setSummary } from '../../store/store';

export default function Expenses() {
   const { colors } = useContext(ThemeContext);
   const dispatch = useDispatch();
   const { dailyTarget } = useSelector(state => state.settings);
   const { summary, expenses } = useSelector(state => state.data);

   const [amount, setAmount] = useState('');
   const [category, setCategory] = useState('Fuel');
   const [isLoading, setIsLoading] = useState(false);
   const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);

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
      const response = await fetch(`${API_BASE_URL}/expenses/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category: categoryMap[category],
          description: `${category} expense`,
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

      Alert.alert('Success', 'Expense logged successfully!', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);

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
      backgroundColor: colors.black,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 16,
    },
    scroll: {
      height: 600,
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    header: {
      marginBottom: 32,
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
      backgroundColor: colors.black,
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
          onPress={() => setAddExpenseModalVisible(true)}
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
                setAddExpenseModalVisible(true);
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

      {/* Add Expense Modal */}
      <Modal
        visible={addExpenseModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddExpenseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add</Text>

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
                onPress={() => setAddExpenseModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveExpense}
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

    </SafeAreaView>
  );
}