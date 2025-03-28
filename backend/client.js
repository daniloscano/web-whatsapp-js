const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const open = require('open').default;

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

    // 🔓 Apri automaticamente la pagina per scansionare il QR
    setTimeout(() => {
      open('http://localhost:3000');
    }, 1000);
  });

  clientInstance.on('authenticated', () => {
    console.log('🔐 Autenticato');
  });

  clientInstance.on('ready', () => {
    console.log('✅ Client WhatsApp pronto');
    isClientReady = true;
    io.emit('state_change', 'CONNECTED');

     // ✅ Se siamo qui, il client è pronto e già autenticato → apri direttamente la chat
    setTimeout(() => {
      open('http://localhost:3000/chat.html');
    }, 1000);
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
      let media = null;
      let mediaUrl = null;

      if (message.hasMedia) {
        const downloaded = await message.downloadMedia();
      
        if (downloaded) {
          const ext = downloaded.mimetype.split('/')[1] || 'bin';
          const filename = `media-${message.timestamp}.${ext}`;
          const uploadPath = path.join(__dirname, 'uploads', filename);
      
          if (!fs.existsSync(uploadPath)) {
            fs.writeFileSync(uploadPath, downloaded.data, 'base64');
            console.log(`💾 Media salvato: ${filename}`);
          } else {
            console.log(`✅ Media già esistente: ${filename}`);
          }
      
          mediaUrl = `/media/${filename}`;
      
          media = {
            mimetype: downloaded.mimetype,
            filename: downloaded.filename || filename
          };
        }
      }
      
  
      const chatId = message.fromMe ? message.to : message.from;
  
      // ✅ Ottieni la chat associata al messaggio
      const chat = await message.getChat();
  
      // ✅ Se il messaggio non è nostro, segniamo la chat come letta
      if (!message.fromMe) {
        await chat.sendSeen(); // Segna come letti i messaggi
        io.emit('message_read', chatId); // 🔁 Invia feedback realtime al frontend
      }
  
      // ✅ Invia comunque il messaggio al frontend per essere mostrato
      io.emit('message', {
        id: message.id._serialized,
        from: message.from,
        to: message.to,
        chatId,
        body: message.body,
        caption: message.caption,
        timestamp: message.timestamp,
        fromMe: message.fromMe,
        media,
        mediaUrl,
        ack: message.ack
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

   // 🔄 Notifica cambio stato messaggio (acknowledgment)
   clientInstance.on('message_ack', (msg, ack) => {
    if (msg.fromMe && msg.id) {
      const cleanId = msg.id.id; // ✅ Solo la parte finale compatibile con data-id del DOM
      console.log('📬 message_ack:', cleanId, '→', ack);
      ioRef?.emit('message_ack', { id: cleanId, ack });
    }
  });
  
  

  clientInstance.initialize();
  console.log('🚀 clientInstance.initialize() chiamato');
}

module.exports = setupClient;
module.exports.getClient = getClient;
module.exports.isReady = isReady;
