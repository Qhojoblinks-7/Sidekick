const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

// Function to parse MoMo SMS
function parseMoMoSMS(message) {
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
    rider_profit = amount - commission;
    platform_debt = commission;
  }

  return {
    tx_id,
    amount_received: amount,
    rider_profit,
    platform_debt,
    platform,
    is_tip: false, // Assume not tip unless specified
  };
}

// Endpoint to receive SMS
app.post('/sms', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const parsed = parseMoMoSMS(message);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid SMS format' });
  }

  try {
    const response = await axios.post('http://localhost:8000/api/transactions/', parsed);
    // Emit real-time event to all connected clients
    io.emit('new_transaction', response.data);
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error posting to API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3001, () => {

  console.log('SMS Bridge listening on port 3001');

});