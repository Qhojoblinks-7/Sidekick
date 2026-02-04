import * as SecureStore from 'expo-secure-store';
import crypto from 'crypto-js';

/**
 * Request Hash Utility
 * 
 * Generates and validates HMAC-SHA256 hashes for transaction requests.
 * Uses SecureStore for secret key management.
 */

// Cache for the secret key
let cachedSecretKey = null;

/**
 * Get or generate the API secret key
 * @returns {Promise<string>} The API secret key
 */
export const getApiSecretKey = async () => {
  if (cachedSecretKey) {
    return cachedSecretKey;
  }

  try {
    // Try to get stored secret
    cachedSecretKey = await SecureStore.getItemAsync('sms_api_secret');
    
    if (!cachedSecretKey) {
      // Generate a new secret (in production, this should come from the backend)
      // For now, we use a default that's configured in the backend settings
      cachedSecretKey = 'default_sms_api_secret_change_in_production';
      await SecureStore.setItemAsync('sms_api_secret', cachedSecretKey);
    }
    
    return cachedSecretKey;
  } catch (error) {
    console.error('[Hash] Failed to get API secret:', error);
    return 'default_sms_api_secret_change_in_production';
  }
};

/**
 * Generate HMAC-SHA256 hash for transaction request
 * @param {string} txId - Transaction reference ID
 * @param {number} amount - Transaction amount
 * @param {string} platform - Platform name (YANGO, BOLT, PRIVATE)
 * @returns {Promise<string>} Hexadecimal hash string
 */
export const generateTransactionHash = async (txId, amount, platform) => {
  try {
    const secretKey = await getApiSecretKey();
    
    // Create canonical message
    const message = `${txId}:${amount}:${platform}`;
    
    // Generate HMAC-SHA256 hash
    const hash = crypto.HmacSHA256(message, secretKey);
    
    return hash.toString(crypto.enc.Hex);
  } catch (error) {
    console.error('[Hash] Failed to generate transaction hash:', error);
    return '';
  }
};

/**
 * Generate HMAC-SHA256 hash for expense request
 * @param {number} amount - Expense amount
 * @param {string} category - Expense category
 * @param {string} description - Expense description (first 50 chars)
 * @returns {Promise<string>} Hexadecimal hash string
 */
export const generateExpenseHash = async (amount, category, description) => {
  try {
    const secretKey = await getApiSecretKey();
    
    // Create canonical message for expenses
    const message = `EXPENSE:${amount}:${category}:${description.substring(0, 50)}`;
    
    // Generate HMAC-SHA256 hash
    const hash = crypto.HmacSHA256(message, secretKey);
    
    return hash.toString(crypto.enc.Hex);
  } catch (error) {
    console.error('[Hash] Failed to generate expense hash:', error);
    return '';
  }
};

/**
 * Generate hash with metadata
 * @param {Object} data - Transaction/expense data
 * @returns {Promise<Object>} Data with request_hash added
 */
export const signRequest = async (data) => {
  const isExpense = data.category !== undefined;
  
  let hash;
  if (isExpense) {
    hash = await generateExpenseHash(
      data.amount,
      data.category,
      data.description || ''
    );
  } else {
    hash = await generateTransactionHash(
      data.tx_id,
      data.amount_received,
      data.platform
    );
  }
  
  return {
    ...data,
    request_hash: hash,
  };
};

/**
 * Clear cached secret key (for logout)
 */
export const clearCachedSecret = () => {
  cachedSecretKey = null;
};

export default {
  getApiSecretKey,
  generateTransactionHash,
  generateExpenseHash,
  signRequest,
  clearCachedSecret,
};
