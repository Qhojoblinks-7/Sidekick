import { configureStore, createSlice } from '@reduxjs/toolkit';

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
    smsEnabled: false,
  },
  reducers: {
    setDailyTarget: (state, action) => { state.dailyTarget = action.payload; },
    setVehicleType: (state, action) => { state.vehicleType = action.payload; },
    setSmsEnabled: (state, action) => { state.smsEnabled = action.payload; },
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
  },
  reducers: {
    setSummary: (state, action) => { state.summary = action.payload; },
    setTransactions: (state, action) => { state.transactions = action.payload; },
    setExpenses: (state, action) => { state.expenses = action.payload; },
    addTransaction: (state, action) => { state.transactions.unshift(action.payload); },
    addExpense: (state, action) => { state.expenses.unshift(action.payload); },
    updatePlatformDebt: (state, action) => { state.summary.total_debt = action.payload; },
  },
});

export const { setOnline, setSyncing, setLastSyncTime } = uiSlice.actions;
export const { setDailyTarget, setVehicleType, setSmsEnabled } = settingsSlice.actions;
export const {
  setSummary,
  setTransactions,
  setExpenses,
  addTransaction,
  addExpense,
  updatePlatformDebt
} = dataSlice.actions;

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    settings: settingsSlice.reducer,
    data: dataSlice.reducer,
  },
});