/**
 * Message Sender Functions
 */
const { getClient, isClientReady } = require('../config/client');
const { templates } = require('../config/messages');

/**
 * Format Bangladesh phone number to WhatsApp chat ID
 * Input: 01XXXXXXXXX or 8801XXXXXXXXX
 * Output: 8801XXXXXXXXX@c.us
 */
function formatPhone(phone) {
  let clean = phone.toString().replace(/\D/g, '');
  if (clean.startsWith('880')) {
    // already has country code
  } else if (clean.startsWith('0')) {
    clean = '880' + clean.substring(1);
  } else if (clean.length === 10) {
    clean = '880' + clean;
  }
  return clean + '@c.us';
}

/**
 * Send a single message
 */
async function sendMessage(phone, message) {
  const client = getClient();
  if (!client || !isClientReady()) {
    throw new Error('WhatsApp client not ready');
  }
  const chatId = formatPhone(phone);
  await client.sendMessage(chatId, message);
  console.log(`✅ Sent to ${phone}`);
  return { success: true, phone, chatId };
}

/**
 * Send bulk messages with delay
 */
async function sendBulk(phones, message, delayMs = 2000) {
  const results = [];
  for (const phone of phones) {
    try {
      await sendMessage(phone, message);
      results.push({ phone, status: 'sent' });
    } catch (err) {
      console.error(`❌ Failed to send to ${phone}:`, err.message);
      results.push({ phone, status: 'failed', error: err.message });
    }
    // Delay between messages to avoid spam detection
    if (phones.indexOf(phone) < phones.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return results;
}

// Specific senders using templates
async function sendPaymentConfirmation(data) {
  return sendMessage(data.phone, templates.paymentConfirmation(data));
}

async function sendWelcome(data) {
  return sendMessage(data.phone, templates.welcome(data));
}

async function sendInvoice(data) {
  return sendMessage(data.phone, templates.invoice(data));
}

async function sendNotice(phones, data) {
  const message = templates.notice(data);
  if (Array.isArray(phones)) {
    return sendBulk(phones, message);
  }
  return sendMessage(phones, message);
}

async function sendMaintenance(phones, data) {
  const message = templates.maintenance(data);
  return sendBulk(Array.isArray(phones) ? phones : [phones], message);
}

module.exports = {
  formatPhone,
  sendMessage,
  sendBulk,
  sendPaymentConfirmation,
  sendWelcome,
  sendInvoice,
  sendNotice,
  sendMaintenance,
};
