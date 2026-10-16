/**
 * Basic test suite for wa-service
 * Run: node tests/test.js
 */
require('dotenv').config();
const http = require('http');

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;
const API_KEY = process.env.API_KEY || '';

let passed = 0;
let failed = 0;

function log(test, ok, detail = '') {
  if (ok) {
    console.log(`  ✅ ${test}`);
    passed++;
  } else {
    console.log(`  ❌ ${test}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

async function httpGet(path) {
  return new Promise((resolve, reject) => {
    http.get(BASE_URL + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

async function httpPost(path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const opts = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': API_KEY
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Test: message templates ───────────────────────────────
function testTemplates() {
  console.log('\n📝 Testing message templates...');
  const { templates } = require('../src/config/messages');

  const payment = templates.paymentConfirmation({
    customerName: 'রহিম সাহেব',
    invoiceNo: 'INV-001',
    amount: '600',
    dueDate: '01 Nov 2026',
    month: 'October 2026'
  });
  log('paymentConfirmation template', payment.includes('রহিম সাহেব') && payment.includes('INV-001'));

  const welcome = templates.welcome({
    customerName: 'করিম সাহেব',
    username: 'karim123',
    password: 'pass@123',
    customerId: 'FO-0042',
    package: '20Mbps',
    expiryDate: '31 Oct 2026'
  });
  log('welcome template', welcome.includes('করিম সাহেব') && welcome.includes('karim123'));

  const invoice = templates.invoice({
    customerName: 'জামাল সাহেব',
    invoiceNo: 'INV-002',
    amount: '700',
    dueDate: '10 Nov 2026',
    month: 'November 2026'
  });
  log('invoice template', invoice.includes('জামাল সাহেব') && invoice.includes('700'));

  const notice = templates.notice({
    title: 'টেস্ট নোটিশ',
    message: 'এটি একটি পরীক্ষামূলক নোটিশ।'
  });
  log('notice template', notice.includes('টেস্ট নোটিশ'));
}

// ─── Test: phone formatter ─────────────────────────────────
function testPhoneFormatter() {
  console.log('\n📞 Testing phone formatter...');
  const { formatPhone } = require('../src/handlers/sender');

  log('01XXXXXXXXX format', formatPhone('01712345678') === '8801712345678@c.us');
  log('8801XXXXXXXXX format', formatPhone('8801712345678') === '8801712345678@c.us');
  log('10-digit format', formatPhone('1712345678') === '8801712345678@c.us');
}

// ─── Test: API endpoints ───────────────────────────────────
async function testAPI() {
  console.log('\n🌐 Testing API endpoints...');

  try {
    const root = await httpGet('/');
    log('GET / returns service info', root.status === 200 && root.body.service === 'wa-service');

    const status = await httpGet('/status');
    log('GET /status returns ready state', status.status === 200 && typeof status.body.ready === 'boolean');

    const qr = await httpGet('/qr');
    log('GET /qr responds', qr.status === 200);

    // Test missing params
    const badPayment = await httpPost('/send-payment', {});
    log('POST /send-payment rejects missing params', badPayment.status === 400);

    const badWelcome = await httpPost('/send-welcome', { phone: '01712345678' });
    log('POST /send-welcome rejects missing params', badWelcome.status === 400);

    const badNotice = await httpPost('/send-notice', {});
    log('POST /send-notice rejects missing params', badNotice.status === 400);

  } catch (err) {
    log('API tests', false, 'Server not running? Start with: npm start');
  }
}

// ─── Run all tests ─────────────────────────────────────────
async function run() {
  console.log('🧪 wa-service Test Suite\n' + '─'.repeat(40));

  testTemplates();
  testPhoneFormatter();
  await testAPI();

  console.log('\n' + '─'.repeat(40));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed.\n');
    process.exit(1);
  }
}

run();
