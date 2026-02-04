/**
 * Advanced MoMo Parser for Ghana/Regional Networks
 * Optimized for: MTN, Telecel (Vodafone), AirtelTigo, Yango, Bolt
 * 
 * Features:
 * - Provider-specific regex patterns
 * - Named capture groups for readability
 * - Balance trap prevention
 * - Debug logging with CALC_DEBUG prefix
 */

// Configuration for each provider
const PROVIDER_PATTERNS = {
  yango: {
    keywords: ['yango'],
    amountPatterns: [
      /(?:received|paid|Amount)\s?:?\s?GHS\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /(?:GHS\s?)?(\d{1,3}(?:,\d{3})*(?:\.\d{2}))\s?(?:received|paid)/i,
    ],
    refPatterns: [
      /(?:Ref|Reference|Transaction ID|Txn ID)\s?:?\s?(\w+)/i,
      /Ref[:\s]+(\w+)/i,
    ],
    platformName: 'YANGO',
  },
  bolt: {
    keywords: ['bolt', 'bolt food'],
    amountPatterns: [
      /(?:Amount|Received|GHS)\s?:?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /(?:GHS\s?)?(\d{1,3}(?:,\d{3})*(?:\.\d{2}))/i,
    ],
    refPatterns: [
      /(?:ID|Ref|Transaction ID|Txn)\s?:?\s?(\w+)/i,
    ],
    platformName: 'BOLT',
  },
  mtn: {
    keywords: ['mtnmomo', 'mtn momo', 'mobile money'],
    amountPatterns: [
      /(?:Amt|Amount|GHS|Transaction of)\s?:?\s?GHS\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /Payment of GHS\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    ],
    refPatterns: [
      /(?:Ref|ID|Transaction ID|Txn ID|Reference)\s?:?\s?(\w+)/i,
    ],
    platformName: 'MTN',
  },
  telecel: {
    keywords: ['telecel', 'vodafone'],
    amountPatterns: [
      /(?:Amt|Amount|GHS)\s?:?\s?GHS\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /(?:GHS\s?)?(\d{1,3}(?:,\d{3})*(?:\.\d{2}))/i,
    ],
    refPatterns: [
      /(?:Ref|ID|Transaction ID|Txn ID)\s?:?\s?(\w+)/i,
    ],
    platformName: 'TELECEL',
  },
  airteltigo: {
    keywords: ['airteltigo', 'airtel', 'tigo'],
    amountPatterns: [
      /(?:Amt|Amount|GHS|received)\s?:?\s?GHS\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /You have received GHS\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    ],
    refPatterns: [
      /(?:Ref|ID|Transaction ID|Txn ID|Reference)\s?:?\s?(\w+)/i,
      /Ref[:\s]+(\w+)/i,
    ],
    platformName: 'AIRTELTIGO',
  },
};

/**
 * Identify the provider/platform from SMS body
 * @param {string} body - SMS message body
 * @returns {string} Provider key or 'unknown'
 */
const identifyProvider = (body) => {
  const lowerBody = body.toLowerCase();
  
  for (const [provider, config] of Object.entries(PROVIDER_PATTERNS)) {
    if (config.keywords.some(keyword => lowerBody.includes(keyword))) {
      console.log(`[PARSER] Identified provider: ${provider.toUpperCase()}`);
      return provider;
    }
  }
  
  return 'unknown';
};

/**
 * Extract amount using provider-specific patterns
 * @param {string} body - SMS message body
 * @param {string} provider - Provider key
 * @returns {number|null} Extracted amount or null
 */
const extractAmount = (body, provider) => {
  const config = PROVIDER_PATTERNS[provider] || PROVIDER_PATTERNS.airteltigo;
  
  for (const pattern of config.amountPatterns) {
    const match = body.match(pattern);
    if (match) {
      const rawAmount = match[1].replace(/,/g, '');
      const amount = parseFloat(rawAmount);
      
      // Sanity check: Amount should be reasonable for delivery rides
      if (amount > 0 && amount < 10000) { // Cap at 10,000 GHS
        console.log(`[PARSER] Extracted amount: GHS ${amount} using pattern ${pattern.source.substring(0, 50)}...`);
        return amount;
      } else if (amount >= 10000) {
        console.warn(`[PARSER] Suspiciously high amount detected: GHS ${amount}, may be balance`);
      }
    }
  }
  
  console.warn(`[PARSER] Could not extract amount from: ${body.substring(0, 100)}...`);
  return null;
};

/**
 * Extract transaction reference
 * @param {string} body - SMS message body
 * @param {string} provider - Provider key
 * @returns {string|null} Transaction reference or null
 */
const extractRef = (body, provider) => {
  const config = PROVIDER_PATTERNS[provider] || PROVIDER_PATTERNS.airteltigo;
  
  for (const pattern of config.refPatterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      console.log(`[PARSER] Extracted ref: ${match[1]}`);
      return match[1].trim();
    }
  }
  
  return null;
};

/**
 * Calculate platform commission and rider profit
 * @param {number} amount - Transaction amount
 * @param {string} platform - Platform name
 * @returns {Object} Commission and profit breakdown
 */
const calculateFinancials = (amount, platform) => {
  const isPrivate = platform === 'PRIVATE';
  
  // Commission rates by platform
  const commissionRates = {
    'YANGO': 0.10,   // 10% commission
    'BOLT': 0.12,     // 12% commission
    'MTN': 0.015,     // 1.5% MoMo fee
    'TELECEL': 0.015, // 1.5% MoMo fee
    'AIRTELTIGO': 0.015, // 1.5% MoMo fee
    'PRIVATE': 0,     // No commission for private transfers
  };
  
  const rate = commissionRates[platform] || 0;
  const commission = isPrivate ? 0 : parseFloat((amount * rate).toFixed(2));
  const riderProfit = parseFloat((amount - commission).toFixed(2));
  
  console.log(`[CALC_DEBUG] Amount: ${amount}, Rate: ${rate * 100}%, Commission: ${commission}, Rider Profit: ${riderProfit}`);
  
  return { commission, riderProfit };
};

/**
 * Main parsing function for MoMo SMS
 * @param {string} message - SMS message body
 * @returns {Object|null} Parsed transaction or null if invalid
 */
export const parseMoMoSMS = (message) => {
  if (!message || typeof message !== 'string') {
    console.warn('[PARSER] Invalid message received');
    return null;
  }

  console.log(`[PARSER] Parsing SMS: ${message.substring(0, 80)}...`);

  // Step 1: Identify provider
  const provider = identifyProvider(message);
  
  // Step 2: Extract amount
  const amountReceived = extractAmount(message, provider);
  if (!amountReceived) {
    console.warn('[PARSER] Failed to extract amount');
    return null;
  }

  // Step 3: Extract reference
  const tx_id = extractRef(message, provider) || `MISSING-${Date.now()}`;
  
  // Step 4: Determine platform
  let platform = 'PRIVATE';
  if (['yango', 'bolt'].includes(provider)) {
    platform = PROVIDER_PATTERNS[provider].platformName;
  } else if (['mtn', 'telecel', 'airteltigo'].includes(provider)) {
    // Private transfers from MoMo
    platform = 'PRIVATE';
  }

  // Step 5: Calculate financials
  const { commission, riderProfit } = calculateFinancials(amountReceived, platform);

  // Step 6: Return parsed transaction
  const parsed = {
    tx_id,
    amount_received: amountReceived,
    rider_profit: riderProfit,
    platform_debt: commission,
    platform,
    is_tip: false,
    parsed_at: new Date().toISOString(),
    provider: provider.toUpperCase(),
  };

  console.log(`[PARSER] Successfully parsed: ${JSON.stringify(parsed)}`);
  return parsed;
};

/**
 * Parse incoming MoMo for real-time processing
 * @param {string} smsBody - SMS message body
 * @returns {Object|null} Captured transaction or null
 */
export const parseIncomingMoMo = (smsBody) => {
  const parsed = parseMoMoSMS(smsBody);
  
  if (parsed) {
    return {
      ...parsed,
      transactionId: parsed.tx_id,
      amount: parsed.amount_received,
      source: parsed.platform === 'BOLT' ? 'Bolt Food' : parsed.platform === 'YANGO' ? 'Yango' : 'Private',
      timestamp: new Date().toLocaleTimeString(),
      status: 'Captured'
    };
  }

  return null;
};

/**
 * Validate if message is a transaction SMS
 * @param {string} body - SMS message body
 * @returns {boolean} True if likely a transaction
 */
export const isMoMoTransactionSMS = (body) => {
  if (!body || typeof body !== 'string') return false;
  
  const lowerBody = body.toLowerCase();
  
  // Check for transaction indicators
  const indicators = [
    'received',
    'payment',
    'sent',
    'transfer',
    'momo',
    'you have',
    'ghs',
  ];
  
  const hasIndicator = indicators.some(ind => lowerBody.includes(ind));
  const hasAmount = /\d{1,3}(?:,\d{3})*(?:\.\d{2})?/i.test(body);
  
  return hasIndicator && hasAmount;
};

/**
 * Parse multiple SMS messages
 * @param {Array} messages - Array of SMS message objects
 * @returns {Array} Array of parsed transactions
 */
export const parseMultipleSMS = (messages) => {
  const transactions = [];
  
  for (const msg of messages) {
    const body = typeof msg === 'string' ? msg : msg.body || '';
    const parsed = parseMoMoSMS(body);
    
    if (parsed) {
      transactions.push({
        ...parsed,
        sms_date: msg.date || Date.now(),
        sms_address: msg.address || '',
      });
    }
  }
  
  console.log(`[PARSER] Parsed ${transactions.length} transactions from ${messages.length} messages`);
  return transactions;
};

export default {
  parseMoMoSMS,
  parseIncomingMoMo,
  isMoMoTransactionSMS,
  parseMultipleSMS,
};
