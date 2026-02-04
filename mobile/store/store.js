import { configureStore, createSlice } from '@reduxjs/toolkit';

import { persistStore, persistReducer } from 'redux-persist';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { combineReducers } from '@reduxjs/toolkit';

// UI Slice for general app state
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
  },
  reducers: {
    setOnline: (state, action) => { state.isOnline = action.payload; },
    setSyncing: (state, action) => { state.isSyncing = action.payload; },
    setLastSyncTime: (state, action) => { state.lastSyncTime = action.payload; },
  },
});

// Settings Slice for user preferences
const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    dailyTarget: 500.00,
    vehicleType: 'Bicycle',
  },
  reducers: {
    setDailyTarget: (state, action) => { state.dailyTarget = action.payload; },
    setVehicleType: (state, action) => { state.vehicleType = action.payload; },
    loadSettings: (state, action) => { Object.assign(state, action.payload); },
  },
});

// Data Slice for API data
const dataSlice = createSlice({
  name: 'data',
  initialState: {
    summary: {
      net_profit: 0,
      total_debt: 0,
      expenses: 0,
    },
    transactions: [],
    expenses: [],
    pendingTransactions: [],
    pendingExpenses: [],
  },
  reducers: {
    setSummary: (state, action) => { state.summary = action.payload; },
    setTransactions: (state, action) => { state.transactions = action.payload; },
    setExpenses: (state, action) => { state.expenses = action.payload; },
    addTransaction: (state, action) => { state.transactions.unshift(action.payload); },
    addExpense: (state, action) => { state.expenses.unshift(action.payload); },
    removeTransaction: (state, action) => { state.transactions = state.transactions.filter(tx => tx.id != action.payload); },
    removeExpense: (state, action) => { state.expenses = state.expenses.filter(exp => exp.id != action.payload); },
    updateTransaction: (state, action) => {
      const index = state.transactions.findIndex(tx => tx.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = { ...state.transactions[index], ...action.payload };
      }
    },
    updateExpense: (state, action) => {
      const index = state.expenses.findIndex(exp => exp.id === action.payload.id);
      if (index !== -1) {
        state.expenses[index] = { ...state.expenses[index], ...action.payload };
      }
    },
    updatePlatformDebt: (state, action) => { state.summary.total_debt = action.payload; },
  },
});
const persistConfig = {

  key: 'root',

  storage: AsyncStorage,

  whitelist: ['data'],

};

const rootReducer = combineReducers({

  ui: uiSlice.reducer,

  settings: settingsSlice.reducer,

  data: dataSlice.reducer,

});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const { setOnline, setSyncing, setLastSyncTime } = uiSlice.actions;

export const { setDailyTarget, setVehicleType, loadSettings } = settingsSlice.actions;
export const {
  setSummary,
  setTransactions,
  setExpenses,
  addTransaction,
  addExpense,
  removeTransaction,
  removeExpense,
  updateTransaction,
  updateExpense,
  updatePlatformDebt
} = dataSlice.actions;

// Selectors
export const selectIsOnline = (state) => state.ui.isOnline;
export const selectIsSyncing = (state) => state.ui.isSyncing;
export const selectLastSyncTime = (state) => state.ui.lastSyncTime;

export const selectDailyTarget = (state) => state.settings.dailyTarget;
export const selectVehicleType = (state) => state.settings.vehicleType;

export const selectSummary = (state) => state.data.summary;
export const selectTransactions = (state) => state.data.transactions;
export const selectExpenses = (state) => state.data.expenses;

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    settings: settingsSlice.reducer,
    data: dataSlice.reducer,
  },
});