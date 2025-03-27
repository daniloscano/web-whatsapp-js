const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

let clientInstance = null;
let isClientReady = false;
let ioRef = null;

const SESSION_DIR = path.join(__dirname, '../.wwebjs_auth/main');

function getClient() {
  return clientInstance;
}

function isReady() {
  return isClientReady;
}

function setupClient(io) {
  ioRef = io;

  clientInstance = new Client({
    authStrategy: new LocalAuth({ clientId: 'main' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  clientInstance.on('qr', async (qr) => {
    const qrDataUrl = await qrcode.toDataURL(qr);
    console.log('📲 QR code generato');
    io.emit('qr', qrDataUrl);
  });

  clientInstance.on('authenticated', () => {
    console.log('🔐 Autenticato');
  });

  clientInstance.on('ready', () => {
    console.log('✅ Client WhatsApp pronto');
    isClientReady = true;
    io.emit('state_change', 'CONNECTED');
  });

  clientInstance.on('auth_failure', (msg) => {
    console.error('❌ Autenticazione fallita:', msg);
  });

  clientInstance.on('disconnected', (reason) => {
    console.warn('⚠️ Disconnesso:', reason);
    isClientReady = false;
    io.emit('state_change', 'DISCONNECTED');
  });

  // ✅ Invio messaggio in tempo reale
  clientInstance.on('message', async (message) => {
    try {
      const media = message.hasMedia ? await message.downloadMedia() : null;

      io.emit('message', {
        id: message.id._serialized,
        from: message.from,
        to: message.to,
        chatId: message.fromMe ? message.to : message.from,
        body: message.body,
        caption: message.caption,
        timestamp: message.timestamp,
        fromMe: message.fromMe,
        media
      });
    } catch (err) {
      console.error('❌ Errore gestione message:', err);
    }
  });

  // ✅ Check di prontezza post-inizializzazione (se già autenticato)
  const waitForReady = setInterval(() => {
    if (!isClientReady && clientInstance?.info) {
      isClientReady = true;
      console.log('⏱️ Client info disponibile: pronto (via polling)');
      io.emit('state_change', 'CONNECTED');
      clearInterval(waitForReady);
    }
  }, 1000);

  clientInstance.initialize();
  console.log('🚀 clientInstance.initialize() chiamato');
}

module.exports = setupClient;
module.exports.getClient = getClient;
module.exports.isReady = isReady;
