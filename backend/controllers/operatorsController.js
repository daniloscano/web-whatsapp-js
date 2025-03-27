const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const OPERATORS_PATH = path.join(__dirname, '../data/operators.json');

// ✅ Carica il file operatori o ritorna oggetto vuoto
function loadOperators() {
  try {
    if (!fs.existsSync(OPERATORS_PATH)) return {};
    const data = fs.readFileSync(OPERATORS_PATH);
    return JSON.parse(data);
  } catch (err) {
    console.error('❌ Errore lettura operators.json:', err);
    return {};
  }
}

// ✅ Salva il file operatori
function saveOperators(data) {
  try {
    fs.writeFileSync(OPERATORS_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Errore salvataggio operators.json:', err);
  }
}

// 🔍 GET /api/operators
router.get('/', (req, res) => {
  const operators = loadOperators();
  res.json(operators);
});

// 💾 POST /api/operators
router.post('/', (req, res) => {
  const { id, operator } = req.body;

  if (!id || typeof operator !== 'string') {
    return res.status(400).json({ error: 'ID e nome operatore richiesti' });
  }

  const operators = loadOperators();
  operators[id] = operator.trim();
  saveOperators(operators);

  res.json({ success: true });
});

// ❌ DELETE /api/operators/:id
router.delete('/:id', (req, res) => {
  const operators = loadOperators();
  const id = req.params.id;

  if (operators[id]) {
    delete operators[id];
    saveOperators(operators);
  }

  res.json({ success: true });
});

module.exports = router;
