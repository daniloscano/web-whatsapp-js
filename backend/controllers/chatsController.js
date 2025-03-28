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
    const client = getClient();

    if (!client || !client.info) {
      return res.status(503).json({ error: 'Client non ancora pronto' });
    }

    const chats = await client.getChats();
    const contacts = loadJSON(CONTACTS_PATH);
    const operators = loadJSON(OPERATORS_PATH);

    const activeOnly = req.query.archived === 'false';
    const archivedOnly = req.query.archived === 'true';

    const chatList = await Promise.all(
      chats.map(async (chat) => {
        const fullChat = await client.getChatById(chat.id._serialized);
        const lastMessage = fullChat.lastMessage;
        const chatId = fullChat.id._serialized;

        const name =
          contacts[chatId] ||
          fullChat.name ||
          fullChat.contact?.pushname ||
          fullChat.contact?.name ||
          fullChat.id.user;

        const isArchived = fullChat.archive || false;

        return {
          id: chatId,
          name,
          operator: operators[chatId] || null,
          lastMessage: lastMessage?.body || null,
          timestamp: lastMessage?.timestamp
            ? new Date(lastMessage.timestamp * 1000)
            : null,
          unreadCount:
            req.query.read === chatId ? 0 : (fullChat.unreadCount || 0),
          archived: typeof chat.archived === 'boolean' ? chat.archived : false
        };
      })
    );

    // 🔍 Filtro dopo aver costruito l'elenco
    const filteredChats = chatList.filter((chat) => {
      if (archivedOnly) return chat.archived === true;
      if (activeOnly) return chat.archived === false;
      return true; // nessun filtro
    });

    filteredChats.sort((a, b) => b.timestamp - a.timestamp);
    res.json(filteredChats);
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

    if (chat) {
      await chat.sendSeen(); // ✅ metodo corretto di whatsapp-web.js
      return res.json({ success: true });
    } else {
      return res.status(404).json({ error: 'Chat non trovata' });
    }
  } catch (err) {
    console.error('Errore reset unread:', err);
    res.status(500).json({ error: 'Errore interno' });
  }
});

// ✅ DELETE chat
router.delete('/:id', async (req, res) => {
  try {
    const client = getClient();
    const chat = await client.getChatById(req.params.id);

    if (chat?.delete) {
      await chat.delete();
      return res.json({ success: true, message: 'Chat eliminata' });
    } else {
      return res.status(404).json({ error: 'Chat non trovata' });
    }
  } catch (err) {
    console.error('❌ Errore eliminazione chat:', err);
    res.status(500).json({ error: 'Errore durante l\'eliminazione della chat' });
  }
});

// ✅ PATCH - Archivia o Riattiva una chat
router.patch('/:id/archive', async (req, res) => {
  try {
    const client = getClient();
    const chat = await client.getChatById(req.params.id);

    if (!chat) {
      return res.status(404).json({ error: 'Chat non trovata' });
    }

    const newState = !chat.isArchived;
    await chat.archive(newState);

    res.json({ success: true, archived: newState });
  } catch (err) {
    console.error('❌ Errore archiviazione chat:', err);
    res.status(500).json({ error: 'Errore durante archiviazione/riattivazione' });
  }
});

module.exports = router;
