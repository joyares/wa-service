/**
 * WhatsApp Web.js Client Configuration
 */
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

let client = null;
let isReady = false;
let qrData = null;

function createClient() {
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, '../../.wwebjs_auth')
    }),
    puppeteer: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      headless: true
    }
  });

  client.on('qr', (qr) => {
    qrData = qr;
    console.log('\n📱 QR Code ready — scan from WhatsApp:');
    qrcode.generate(qr, { small: true });
    console.log('\n🌐 Or visit http://localhost:' + (process.env.PORT || 3000) + '/qr to see QR as image\n');
  });

  client.on('ready', () => {
    isReady = true;
    qrData = null;
    const info = client.info;
    console.log(`\n✅ WhatsApp Connected!`);
    console.log(`📱 Number: ${info.wid.user}`);
    console.log(`👤 Name: ${info.pushname}\n`);
  });

  client.on('auth_failure', (msg) => {
    isReady = false;
    console.error('❌ Auth failed:', msg);
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    console.log('⚠️ WhatsApp disconnected:', reason);
    // Auto-reconnect after 5 seconds
    setTimeout(() => {
      console.log('🔄 Reconnecting...');
      client.initialize();
    }, 5000);
  });

  return client;
}

function getClient() { return client; }
function isClientReady() { return isReady; }
function getQrData() { return qrData; }

module.exports = { createClient, getClient, isClientReady, getQrData };
