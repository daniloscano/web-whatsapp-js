const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const CONTACTS_PATH = path.join(__dirname, '../data/contacts.json');

// 🔄 Carica rubrica
function loadContacts() {
  if (!fs.existsSync(CONTACTS_PATH)) {
    return {};
  }
  const data = fs.readFileSync(CONTACTS_PATH);
  return JSON.parse(data);
}

// 💾 Salva rubrica
function saveContacts(contacts) {
  fs.writeFileSync(CONTACTS_PATH, JSON.stringify(contacts, null, 2));
}

// ✅ GET - Recupera tutti i contatti
router.get('/', (req, res) => {
  const contacts = loadContacts();
  res.json(contacts);
});

// ✅ POST - Aggiungi o aggiorna un contatto
router.post('/', (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'ID e nome richiesti' });
  }

  const contacts = loadContacts();
  contacts[id] = name;
  saveContacts(contacts);

  res.json({ message: 'Contatto salvato con successo', id, name });
});

// ✅ DELETE - Rimuovi un contatto
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const contacts = loadContacts();

  if (contacts[id]) {
    delete contacts[id];
    saveContacts(contacts);
    res.json({ message: 'Contatto rimosso', id });
  } else {
    res.status(404).json({ error: 'Contatto non trovato' });
  }
});

module.exports = router;
