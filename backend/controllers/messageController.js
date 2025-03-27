const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const { MessageMedia } = require('whatsapp-web.js');
const { getClient } = require('../client');

const upload = multer({ dest: path.join(__dirname, '../uploads') });

// 📥 Recupera messaggi di una chat e marca come letti
router.get('/:chatId', async (req, res) => {
  const { chatId } = req.params;

  try {
    const client = getClient();
    const chat = await client.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit: 50 });

    await chat.sendSeen();

    const formattedMessages = messages.map(msg => ({
      id: msg.id.id,
      fromMe: msg.fromMe,
      body: msg.body,
      timestamp: msg.timestamp,
      type: msg.type
    }));

    res.json(formattedMessages);
  } catch (err) {
    console.error('Errore nel recupero dei messaggi:', err);
    res.status(500).json({ error: 'Errore nel recupero dei messaggi' });
  }
});

// 📤 Invia testo e/o media
router.post('/send-full', upload.single('file'), async (req, res) => {
  const { to, message } = req.body;
  const file = req.file;

  if (!to) {
    return res.status(400).json({ error: 'Il destinatario (to) è obbligatorio' });
  }

  try {
    const client = getClient();

    if (file) {
      let mimetype = mime.lookup(file.originalname) || file.mimetype;

      if (!mimetype) {
        return res.status(415).json({ error: 'Tipo MIME non riconosciuto' });
      }

      const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf', 'audio/mpeg', 'video/mp4',
        'application/zip'
      ];

      if (!allowedMimeTypes.includes(mimetype)) {
        fs.unlinkSync(file.path);
        return res.status(415).json({ error: `Tipo file non supportato: ${mimetype}` });
      }

      const extension = mime.extension(mimetype) || 'bin';
      const newFilename = `${file.filename}.${extension}`;
      const newPath = path.join(path.dirname(file.path), newFilename);
      fs.renameSync(file.path, newPath);

      const fileData = fs.readFileSync(newPath, { encoding: 'base64' });

      const media = new MessageMedia(mimetype, fileData, file.originalname || `file.${extension}`);
      const sentMessage = await client.sendMessage(to, media, {
        caption: message || ''
      });

      fs.unlinkSync(newPath);

      return res.json({
        message: 'Media inviato con successo',
        id: sentMessage.id.id,
        type: sentMessage.type,
        caption: message || '',
        media: {
          mimetype,
          data: fileData,
          filename: file.originalname || `file.${extension}`
        }
      });
    }

    // Invia solo testo
    const sentMessage = await client.sendMessage(to, message);
    return res.json({
      message: 'Testo inviato con successo',
      id: sentMessage.id.id,
      body: sentMessage.body
    });

  } catch (err) {
    console.error("❌ Errore nell'invio:", err.message);
    console.error(err.stack);
    return res.status(500).json({
      error: "Errore durante l'invio del messaggio",
      detail: err.message
    });
  }
});

module.exports = router;
