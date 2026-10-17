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
const fs = require('fs');
const path = require('path');
const { refreshBusiness } = require('../config/messages');

const ENV_PATH = path.join(__dirname, '..', '..', '.env');
const CONFIG_KEYS = ['SUPPORT_NUMBER_1', 'SUPPORT_NUMBER_2', 'BKASH_NUMBER', 'NAGAD_NUMBER', 'WEBSITE_URL', 'OFFICE_ADDRESS'];

// Middleware: API Key authentication
function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API key' });
  }
  next();
}

// Config writes are never allowed on an open (key-less) service
function strictAuthMiddleware(req, res, next) {
  if (!process.env.API_KEY) {
    return res.status(403).json({ success: false, error: 'API_KEY is not set; config updates are disabled' });
  }
  authMiddleware(req, res, next);
}

// Update-or-append KEY=value lines in .env, keeping every other line untouched
function writeEnvValues(values) {
  const lines = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/) : [];
  for (const [key, value] of Object.entries(values)) {
    const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
    const line = `${key}=${value}`;
    if (idx >= 0) lines[idx] = line; else lines.push(line);
  }
  fs.writeFileSync(ENV_PATH, lines.join('\n').replace(/\n*$/, '\n'), 'utf8');
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
  // API key (from .env) is shown on every state, but only to a direct loopback request
  const key = process.env.API_KEY;
  const addr = req.socket.remoteAddress || '';
  const isLocal = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(addr) && !req.headers['x-forwarded-for'];
  const keyBlock = !key
    ? '<p>API_KEY is not set in .env.</p>'
    : isLocal
      ? `<hr style="margin:30px auto;max-width:420px">
         <p>API Key — copy into ISP360 → Settings → WhatsApp → Connection:</p>
         <input id="k" readonly value="${key.replace(/[&<>"']/g, '')}" style="width:420px;max-width:90%;padding:8px;font-family:monospace;text-align:center" onclick="this.select()">
         <br><button style="margin-top:10px;padding:6px 16px" onclick="navigator.clipboard.writeText(document.getElementById('k').value)">Copy</button>`
      : '<p>Open this page on the server itself (http://localhost:' + (process.env.PORT || 3000) + '/qr) to see the API key.</p>';

  let main = '';
  let refresh = '<script>setTimeout(()=>location.reload(), 5000)</script>';
  if (isClientReady()) {
    main = '<h2>✅ WhatsApp is connected!</h2>';
    refresh = '';
  } else {
    const qrData = getQrData();
    if (qrData) {
      try {
        const qrImage = await qrcode.toDataURL(qrData);
        main = `<h2>📱 Scan with WhatsApp</h2>
          <p>Open WhatsApp → Settings → Linked Devices → Link a Device</p>
          <img src="${qrImage}" style="width:300px;height:300px" />`;
        refresh = '<script>setTimeout(()=>location.reload(), 30000)</script>';
      } catch (e) {
        return res.status(500).json({ error: 'QR generation failed' });
      }
    }
  }
  res.send(`<html><head><title>WA Service</title></head>
    <body style="text-align:center;font-family:sans-serif;padding:40px">${main}${keyBlock}${refresh}</body></html>`);
});

// ─── Config (Set Up tab in ISP360) ─────────────────────────
router.get('/config', strictAuthMiddleware, (req, res) => {
  const config = {};
  CONFIG_KEYS.forEach((k) => { config[k] = process.env[k] || ''; });
  config.SUPPORT_NUMBER_1 = process.env.SUPPORT_NUMBER_1 || process.env.SUPPORT_NUMBER || '';
  res.json({ success: true, config });
});

router.post('/config', strictAuthMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    const values = {};
    for (const key of CONFIG_KEYS) {
      if (body[key] === undefined) continue;
      const value = String(body[key]).replace(/[\r\n]+/g, ' ').trim();
      if (value.length > 255) {
        return res.status(400).json({ success: false, error: `${key} is too long (max 255)` });
      }
      values[key] = value;
    }
    if (Object.keys(values).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid config keys supplied' });
    }
    // Keep the legacy SUPPORT_NUMBER in step with SUPPORT_NUMBER_1
    if (values.SUPPORT_NUMBER_1 !== undefined) values.SUPPORT_NUMBER = values.SUPPORT_NUMBER_1;
    writeEnvValues(values);
    Object.assign(process.env, values);
    refreshBusiness();
    res.json({ success: true, updated: Object.keys(values) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
