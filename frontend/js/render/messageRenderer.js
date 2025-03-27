import { formatTimestamp } from '../ui/uiUtils.js';

export function renderMessage(msg) {
  const container = document.getElementById('messages');

  if (!container) return;

  console.log('🧩 Render message:', msg); // 🔍 Log utile per debug

  const bubble = document.createElement('div');

  // ✅ Classi per stile e allineamento
  bubble.classList.add('message');
  bubble.classList.add(msg.fromMe ? 'me' : 'them');

  // ✅ Classi aggiuntive (esistenti nel tuo progetto)
  bubble.classList.add('message-bubble');
  bubble.classList.add(msg.fromMe ? 'message-out' : 'message-in');

  bubble.dataset.id = msg.id;

  // 📎 Gestione media (immagini o altri file)
  if (msg.media) {
    const src = `data:${msg.media.mimetype};base64,${msg.media.data}`;
    const type = msg.media.mimetype || '';

    if (type.startsWith('image/')) {
      // 🖼 Mostra anteprima immagine
      bubble.innerHTML += `
        <img src="${src}" alt="media" class="img-fluid rounded mb-2" style="max-width: 200px;">
      `;
    } else {
      // 📄 Mostra link per altri file (PDF, audio, ecc.)
      const fileName = msg.media.filename || 'allegato';
      bubble.innerHTML += `
        <div class="mb-2">
          📎 <a href="${src}" download="${fileName}" class="text-decoration-none text-primary">
            ${fileName}
          </a>
        </div>
      `;
    }
  }

  // 🗨 Mostra testo/caption se esiste
  if (msg.body) {
    bubble.innerHTML += `<div>${msg.body}</div>`;
  } else if (msg.caption) {
    bubble.innerHTML += `<div>${msg.caption}</div>`;
  } else if (!msg.media) {
    // 🔁 Se non c'è nulla, mostra placeholder
    bubble.innerHTML += `<div class="fst-italic text-muted">[media]</div>`;
  }

  // 🕒 Timestamp
  bubble.innerHTML += `<div class="message-time">${formatTimestamp(msg.timestamp)}</div>`;

  container.appendChild(bubble);
}
