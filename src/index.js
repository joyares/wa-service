/**
 * wa-service — WhatsApp Automation Service for Friends Online ISP
 * Main entry point
 */
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { createClient, getClient, isClientReady } = require('./config/client');
const { handleFaqMessage } = require('./handlers/faqBot');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: 'wa-service',
    status: 'running',
    waConnected: isClientReady(),
    endpoints: [
      'GET  /status',
      'GET  /qr',
      'POST /send-payment',
      'POST /send-welcome',
      'POST /send-invoice',
      'POST /send-notice',
      'POST /send-maintenance',
      'POST /send-custom',
      'GET  /config',
      'POST /config',
    ]
  });
});

app.use('/', apiRoutes);

// ─── Start Express ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 wa-service started on http://localhost:${PORT}`);
  console.log(`📊 Status:    http://localhost:${PORT}/status`);
  console.log(`📱 QR Code:   http://localhost:${PORT}/qr\n`);
});

// ─── Initialize WhatsApp Client ────────────────────────────
console.log('🔄 Initializing WhatsApp client...');
const client = createClient();

// ─── Message Handler (FAQ Bot) ─────────────────────────────
client.on('message', async (msg) => {
  try {
    await handleFaqMessage(client, msg);
  } catch (err) {
    console.error('Message handler error:', err.message);
  }
});

client.initialize();

// ─── Graceful Shutdown ─────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n⚠️ Shutting down...');
  await client.destroy();
  process.exit(0);
});
