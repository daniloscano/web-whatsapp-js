# Web WhatsApp JS

Clone semplificato di WhatsApp Web, basato su [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js), Express, Socket.io e JavaScript vanilla + Bootstrap.

---

## ✅ Requisiti

- Node.js v16 o superiore
- npm
- Chromium (installato automaticamente con puppeteer)
- WhatsApp su smartphone per collegamento via QR code

---

## 📦 1. Estrazione del progetto

Scarica e decomprimi:

👉 `web-whatsapp-js.zip`

---

## 📁 2. Struttura del progetto

```
web-whatsapp-js/
├── backend/
│   ├── client.js
│   ├── server.js
│   ├── controllers/
│   ├── sessions/
│   ├── uploads/
│   └── downloads/
└── frontend/
    ├── index.html
    ├── chat.html
    ├── css/
    └── js/
```

---

## ⚙️ 3. Installazione dipendenze

Apri il terminale:

```bash
cd web-whatsapp-js/backend
npm init -y
npm install express socket.io whatsapp-web.js puppeteer mime multer qrcode open
```

---

## 🚀 4. Avvio del backend

```bash
node server.js
```

- Alla prima esecuzione, viene generato un QR code
- Viene aperto automaticamente il browser su `index.html`

---

## 🌐 5. Accesso all'applicazione

Apri nel browser:

```
http://localhost:3000/index.html
```

Non aprire `index.html` direttamente via doppio click — deve essere servito da Express.

---

## 🤳 6. Collegamento WhatsApp

1. Scansiona il QR code con l'app WhatsApp:
   - Menu > Dispositivi collegati > Collega un dispositivo
2. Verrai reindirizzato alla schermata delle chat

---

## 💬 7. Funzionalità

- ✅ Lista chat con badge "non letti"
- ✅ Visualizzazione messaggi e media
- ✅ Invio testi, emoji e file (immagini, PDF, audio…)
- ✅ Emoji Picker
- ✅ Ricezione in tempo reale via socket
- ✅ Stato "online / sta scrivendo"
- ✅ Spunte di lettura

---

## 📂 8. Cartelle speciali

| Cartella     | Scopo                            |
|--------------|----------------------------------|
| `sessions/`  | Salvataggio login WhatsApp       |
| `uploads/`   | File da inviare                  |
| `downloads/` | File ricevuti (se salvati)       |

---

## 🛑 9. Stop dell'app

CTRL + C nel terminale.

---

## 🧠 10. Suggerimenti futuri

- Salvataggio su DB
- Notifiche desktop
- Interfaccia mobile responsive
- Login multi-utente
- Deploy online (Render, Railway, ecc.)

---

Built with ❤️ using Node.js, WhatsApp Web JS, e tanto JavaScript vanilla.
