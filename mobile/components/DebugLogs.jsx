import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useToast } from '../contexts/ToastContext';

let logHistory = [];
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args) => {
  logHistory.push({ type: 'log', message: args.join(' '), timestamp: new Date().toISOString() });
  if (logHistory.length > 100) logHistory.shift(); // Keep only last 100 logs
  originalConsoleLog(...args);
};

console.error = (...args) => {
  logHistory.push({ type: 'error', message: args.join(' '), timestamp: new Date().toISOString() });
  if (logHistory.length > 100) logHistory.shift();
  originalConsoleError(...args);
};

console.warn = (...args) => {
  logHistory.push({ type: 'warn', message: args.join(' '), timestamp: new Date().toISOString() });
  if (logHistory.length > 100) logHistory.shift();
  originalConsoleWarn(...args);
};

const DebugLogs = ({ visible, onClose }) => {
  const [logs, setLogs] = useState(logHistory);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs([...logHistory]);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Debug Logs</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollView}>
          {logs.map((log, index) => (
            <Text key={index} style={[styles.log, styles[log.type]]}>
              [{log.timestamp}] {log.message}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 16,
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  log: {
    fontSize: 12,
    marginBottom: 5,
  },
  log: {
    color: '#000',
  },
  error: {
    color: '#FF0000',
  },
  warn: {
    color: '#FFA500',
  },
});

export default DebugLogs;