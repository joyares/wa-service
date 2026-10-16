/**
 * Express API Routes
 */
const express = require('express');
const router = express.Router();
const {
  sendPaymentConfirmation,
  sendWelcome,
  sendInvoice,
  sendNotice,
  sendMaintenance,
  sendMessage,
} = require('../handlers/sender');
const { isClientReady, getQrData } = require('../config/client');
const qrcode = require('qrcode');

// Middleware: API Key authentication
function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API key' });
  }
  next();
}

// ─── Status ───────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.json({
    success: true,
    ready: isClientReady(),
    service: 'wa-service',
    business: process.env.BUSINESS_NAME || 'Friends Online',
    timestamp: new Date().toISOString()
  });
});

// ─── QR Code ──────────────────────────────────────────────
router.get('/qr', async (req, res) => {
  const qrData = getQrData();
  if (!qrData) {
    if (isClientReady()) {
      return res.send('<h2>✅ WhatsApp is connected!</h2>');
    }
    return res.send('<h2>⏳ QR not ready yet. Refresh in a few seconds...</h2>');
  }
  try {
    const qrImage = await qrcode.toDataURL(qrData);
    res.send(`
      <html>
        <head><title>WA QR Code</title></head>
        <body style="text-align:center;font-family:sans-serif;padding:40px">
          <h2>📱 Scan with WhatsApp</h2>
          <p>Open WhatsApp → Settings → Linked Devices → Link a Device</p>
          <img src="${qrImage}" style="width:300px;height:300px" />
          <p><small>Auto-refresh in 30s...</small></p>
          <script>setTimeout(()=>location.reload(), 30000)</script>
        </body>
      </html>
    `);
  } catch (e) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

// ─── Payment Confirmation ──────────────────────────────────
router.post('/send-payment', authMiddleware, async (req, res) => {
  try {
    const { phone, customerName, amount, invoiceNo, dueDate, month, paymentDate } = req.body;
    if (!phone || !customerName || !amount) {
      return res.status(400).json({ success: false, error: 'phone, customerName, amount are required' });
    }
    const result = await sendPaymentConfirmation({ phone, customerName, amount, invoiceNo, dueDate, month, paymentDate });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Welcome Message ──────────────────────────────────────
router.post('/send-welcome', authMiddleware, async (req, res) => {
  try {
    const { phone, customerName, username, password, customerId, package: pkg, expiryDate } = req.body;
    if (!phone || !customerName || !username || !password) {
      return res.status(400).json({ success: false, error: 'phone, customerName, username, password are required' });
    }
    const result = await sendWelcome({ phone, customerName, username, password, customerId, package: pkg, expiryDate });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Invoice ──────────────────────────────────────────────
router.post('/send-invoice', authMiddleware, async (req, res) => {
  try {
    const { phone, customerName, invoiceNo, amount, dueDate, month } = req.body;
    if (!phone || !customerName || !amount || !dueDate) {
      return res.status(400).json({ success: false, error: 'phone, customerName, amount, dueDate are required' });
    }
    const result = await sendInvoice({ phone, customerName, invoiceNo, amount, dueDate, month });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Notice (single or bulk) ───────────────────────────────
router.post('/send-notice', authMiddleware, async (req, res) => {
  try {
    const { phone, phones, title, message, date } = req.body;
    const targets = phones || (phone ? [phone] : null);
    if (!targets || targets.length === 0) {
      return res.status(400).json({ success: false, error: 'phone or phones[] is required' });
    }
    if (!message) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }
    const results = await sendNotice(targets, { title, message, date });
    res.json({ success: true, sent: results.filter(r => r.status === 'sent').length, total: targets.length, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Maintenance Notice ────────────────────────────────────
router.post('/send-maintenance', authMiddleware, async (req, res) => {
  try {
    const { phones, startTime, endTime, reason, area } = req.body;
    if (!phones || phones.length === 0) {
      return res.status(400).json({ success: false, error: 'phones[] is required' });
    }
    const results = await sendMaintenance(phones, { startTime, endTime, reason, area });
    res.json({ success: true, sent: results.filter(r => r.status === 'sent').length, total: phones.length, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Custom Message ────────────────────────────────────────
router.post('/send-custom', authMiddleware, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'phone and message are required' });
    }
    const result = await sendMessage(phone, message);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
