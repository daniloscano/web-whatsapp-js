const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const clientSetup = require('./client');
const chatsController = require('./controllers/chatsController');
const messageController = require('./controllers/messageController');
const contactsController = require('./controllers/contactsController');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' }
});

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ API
app.use('/api/chats', chatsController);
app.use('/api/messages', messageController);
app.use('/api/contacts', contactsController);

// ✅ Serve chat.html per tutte le richieste non API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/chat.html'));
});

// ✅ Inizializza il client WhatsApp
clientSetup(io);

// ✅ Avvia server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});
