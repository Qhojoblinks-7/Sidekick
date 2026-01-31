// utils/momoTracker.js

// Function to parse MoMo SMS (enhanced from bridge logic)
export const parseMoMoSMS = (message) => {
  // Example SMS: "You have received GHS 50.00 from YANGO GH. Ref: 1234567890. Fee: GHS 0.00. Your balance is GHS 150.00."
  const amountMatch = message.match(/GHS (\d+\.\d+)/);
  const refMatch = message.match(/Ref: (\w+)/);
  const senderMatch = message.match(/from (.+?)\./);

  if (!amountMatch || !refMatch) return null;

  const amount = parseFloat(amountMatch[1]);
  const tx_id = refMatch[1];
  const sender = senderMatch ? senderMatch[1] : '';

  // Determine platform
  let platform = 'PRIVATE';
  if (sender.toUpperCase().includes('YANGO')) {
    platform = 'YANGO';
  } else if (sender.toUpperCase().includes('BOLT')) {
    platform = 'BOLT';
  }

  // Calculate splits (example logic: 10% commission for platforms)
  let rider_profit = amount;
  let platform_debt = 0;
  if (platform !== 'PRIVATE') {
    const commission = amount * 0.1; // 10% commission
    console.log(`[CALC_DEBUG] Amount: ${amount}, Commission: ${commission}, Platform: ${platform}`);
    rider_profit = amount - commission;
    platform_debt = commission;
  }

  // Round to 2 decimal places to prevent precision issues
  const original_rider_profit = rider_profit;
  const original_platform_debt = platform_debt;
  rider_profit = parseFloat(rider_profit.toFixed(2));
  platform_debt = parseFloat(platform_debt.toFixed(2));
  console.log(`[CALC_DEBUG] Before rounding - Rider profit: ${original_rider_profit}, Platform debt: ${original_platform_debt}`);
  console.log(`[CALC_DEBUG] After rounding - Rider profit: ${rider_profit}, Platform debt: ${platform_debt}`);

  return {
    tx_id,
    amount_received: amount,
    rider_profit,
    platform_debt,
    platform,
    is_tip: false, // Assume not tip unless specified
  };
};

export const parseIncomingMoMo = (smsBody) => {
  // First try the enhanced parser
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

  // Fallback to original logic for backward compatibility
  const body = smsBody.toLowerCase();

  // 1. First, check if it's a "Sidekick" related payment
  const isBoltFood = body.includes('bolt food');
  const isYango = body.includes('yango');

  if (!isBoltFood && !isYango) {
    return null; // Ignore personal transfers from family/friends
  }

  // 2. Extract the Amount (e.g., GHS 50.00)
  const amountRegex = /(?:GHS|Amount:)\s*(\d+\.\d{2})/i;
  const amountMatch = smsBody.match(amountRegex);

  // 3. Extract the Transaction ID
  const idRegex = /(?:ID:|Ref:)\s*(\d+)/i;
  const idMatch = smsBody.match(idRegex);

  if (amountMatch) {
    return {
      amount: parseFloat(amountMatch[1]),
      transactionId: idMatch ? idMatch[1] : 'Manual-' + Date.now(),
      source: isBoltFood ? 'Bolt Food' : 'Yango',
      timestamp: new Date().toLocaleTimeString(),
      status: 'Captured'
    };
  }

  return null;
};