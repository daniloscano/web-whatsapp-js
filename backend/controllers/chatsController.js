const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getClient, isReady } = require('../client');

const CONTACTS_PATH = path.join(__dirname, '../data/contacts.json');
const OPERATORS_PATH = path.join(__dirname, '../data/operators.json');

function loadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (err) {
    console.error(`❌ Errore parsing ${filePath}:`, err);
    return {};
  }
}

router.get('/', async (req, res) => {
  try {
    const ready = isReady();
    const client = getClient()

    console.log('✅ isReady:', ready);
    console.log('🧠 clientInstance:', !!client);

    if (!client || !client.info) {
      console.log('⏳ client.info non disponibile, client non pronto');
      return res.status(503).json({ error: 'Client non ancora pronto' });
    }

    const chats = await client.getChats();

    if (!Array.isArray(chats)) {
      console.error('⚠️ client.getChats() non ha restituito un array');
      return res.status(500).json({ error: 'Errore interno: chat non disponibili' });
    }

    const contacts = loadJSON(CONTACTS_PATH);
    const operators = loadJSON(OPERATORS_PATH);

    const chatList = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = chat.lastMessage;
        const chatId = chat.id._serialized;

        const savedName = contacts[chatId];
        const name =
          savedName ||
          chat.name ||
          chat.contact?.pushname ||
          chat.contact?.name ||
          chat.id.user;

        return {
          id: chatId,
          name,
          operator: operators[chatId] || null,
          lastMessage: lastMessage?.body || null,
          timestamp: lastMessage?.timestamp
            ? new Date(lastMessage.timestamp * 1000)
            : null,
          unreadCount: chat.unreadCount || 0
        };
      })
    );

    chatList.sort((a, b) => b.timestamp - a.timestamp);
    res.json(chatList);
  } catch (err) {
    console.error('❌ Errore nel recupero delle chat:', err);
    res.status(500).json({ error: 'Errore durante il recupero delle chat' });
  }
});

// ✅ Aggiunto: reset unreadCount
router.patch('/:id/read', async (req, res) => {
  try {
    const client = getClient();
    if (!client || !isReady()) {
      return res.status(503).json({ error: 'Client non pronto' });
    }

    const chat = await client.getChatById(req.params.id);
    if (chat?.markSeen) {
      await chat.markSeen();
      return res.json({ success: true });
    } else {
      return res.status(404).json({ error: 'Chat non trovata' });
    }
  } catch (err) {
    console.error('Errore reset unread:', err);
    res.status(500).json({ error: 'Errore interno' });
  }
});

module.exports = router;
