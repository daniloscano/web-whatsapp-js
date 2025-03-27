import { formatTimestamp } from '../ui/uiUtils.js';

export function renderMessage(msg) {
  const container = document.getElementById('messages');

  if (!container) return;

  console.log('🧩 Render message:', msg); // 🔍 Log utile per debug
  if (msg.mediaUrl) {
    console.log('✅ mediaUrl disponibile:', msg.mediaUrl);
  } else {
    console.warn('⚠️ mediaUrl mancante per', msg.id);
  }
  

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
    const src = msg.mediaUrl || `data:${msg.media.mimetype};base64,${msg.media.data}`;
    const type = msg.media.mimetype || '';

    if (type.startsWith('image/')) {
      // 🖼 Mostra anteprima immagine cliccabile
      bubble.innerHTML += `
        <img 
          src="${src}" 
          alt="media" 
          class="img-fluid rounded mb-2 preview-media" 
          style="max-width: 200px; cursor: pointer;" 
          data-type="image" 
          data-src="${src}"
        >
      `;
    } else {
      const fileName = msg.media.filename || 'allegato';
      bubble.innerHTML += `
        <div class="mb-2">
          📎 <a 
            href="${src}" 
            class="text-decoration-none text-primary preview-media" 
            style="cursor: pointer;" 
            data-type="file" 
            data-src="${src}" 
            data-name="${fileName}"
          >
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
  const timeText = formatTimestamp(msg.timestamp);

  // ✅ Genera HTML tick solo per messaggi inviati
  let ackIcon = '';
  if (msg.fromMe) {
    switch (msg.ack) {
      case 1:
        ackIcon = '✔️';
        break;
      case 2:
        ackIcon = '✔️✔️';
        break;
      case 3:
        ackIcon = '✔️✔️'; // opzionalmente colorabile
        break;
      default:
        ackIcon = '🕓';
    }
  }

  bubble.innerHTML += `
    <div class="message-time d-flex justify-content-between align-items-center">
      <span>${timeText}</span>
      ${ackIcon && msg.id ? `<span class="ms-2 message-status" data-id="${msg.id}">${ackIcon}</span>` : ''}
    </div>
  `;

  container.appendChild(bubble);
}

// 🎯 Listener per modale media
document.addEventListener('click', (e) => {
  const target = e.target.closest('.preview-media');
  if (!target) return;

  e.preventDefault(); // ✅ Blocca comportamento nativo dei link

  const type = target.dataset.type;
  const src = target.dataset.src;
  const name = target.dataset.name || 'file';

  const modalContent = document.getElementById('mediaModalContent');
  if (!modalContent) return;

  modalContent.innerHTML = '';

  if (type === 'image') {
    modalContent.innerHTML = `<img src="${src}" class="img-fluid rounded w-100">`;
  } else {
    modalContent.innerHTML = `
      <div class="p-3">
        <a href="${src}" download="${name}" class="btn btn-primary">Scarica ${name}</a>
      </div>
    `;
  }

  const modal = new bootstrap.Modal(document.getElementById('mediaModal'));
  modal.show();
});

const socket = io();

socket.on('message_ack', ({ id, ack }) => {
  const statusEl = document.querySelector(`.message-status[data-id="${id}"]`);
  if (!statusEl) return;

  let icon = '';
  switch (ack) {
    case 1:
      icon = '✔️';
      break;
    case 2:
      icon = '✔️✔️';
      break;
    case 3:
      icon = '✔️✔️';
      break;
    default:
      icon = '🕓';
  }

  console.log('🔁 message_ack update:', id, '→', ack);

  statusEl.textContent = icon;
});
