import { fetchChats } from './api/chatApi.js';
import { fetchMessages, sendMessage } from './api/messageApi.js';
import { renderChatList } from './render/chatListRenderer.js';
import { renderMessage } from './render/messageRenderer.js';
import { scrollToBottom } from './ui/uiUtils.js';
import { setupEmojiPicker } from './ui/emojiPicker.js';
import { setupSocketHandlers } from './socket/socketHandler.js';

const chatTitle = document.getElementById('chat-title');
const chatStatus = document.getElementById('chat-status');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const messageForm = document.getElementById('message-form');
const loaderOverlay = document.getElementById('loader-overlay');
const chatIdentifier = document.getElementById('chat-identifier');
const searchInput = document.getElementById('search-input');
const activeChatListEl = document.getElementById('chat-items');
const archivedChatListEl = document.getElementById('archived-chat-items');

const editContactBtn = document.getElementById('edit-contact-btn');
const editContactForm = document.getElementById('edit-contact-form');
const contactNameInput = document.getElementById('contact-name-input');
const saveContactBtn = document.getElementById('save-contact-btn');
const cancelContactBtn = document.getElementById('cancel-contact-btn');
const deleteContactBtn = document.getElementById('delete-contact-btn');

const editOperatorBtn = document.getElementById('edit-operator-btn');
const editOperatorForm = document.getElementById('edit-operator-form');
const operatorNameInput = document.getElementById('operator-name-input');
const saveOperatorBtn = document.getElementById('save-operator-btn');
const removeOperatorBtn = document.getElementById('remove-operator-btn');

const newChatBtn = document.getElementById('new-chat-btn');
const newChatForm = document.getElementById('new-chat-form');
const newChatNumberInput = document.getElementById('new-chat-number');
const newChatNameInput = document.getElementById('new-chat-name');


let currentChatId = null;
const currentChatIdRef = { value: null };
let contacts = {};
let operators = {};
let fullChatList = [];

if (messageInput) setupEmojiPicker(messageInput);

setupSocketHandlers(currentChatIdRef, (status) => {
  if (chatStatus) chatStatus.textContent = status;
}, (message) => {
  if (typeof window.updateChatPreview === 'function') {
    const previewText = message.body || message.caption || '[media]';
    window.updateChatPreview(message.chatId, previewText);
  }
});

async function loadContacts() {
  try {
    const res = await fetch('/api/contacts');
    contacts = await res.json();
  } catch (err) {
    console.error('Errore rubrica:', err);
  }
}

async function loadOperators() {
  try {
    const res = await fetch('/api/operators');
    operators = await res.json();
  } catch (err) {
    console.error('Errore operatori:', err);
  }
}

async function loadChatList(archived = false) {
  try {
    const readParam = currentChatIdRef.value ? `&read=${encodeURIComponent(currentChatIdRef.value)}` : '';
    const res = await fetch(`/api/chats?archived=${archived}${readParam}`);
    const chats = await res.json();

    const targetEl = archived ? archivedChatListEl : activeChatListEl;

    renderChatList(chats, onChatClick, searchInput?.value || '', targetEl);

    if (!archived) {
      fullChatList = chats;
    }
  } catch (err) {
    console.error(`❌ Errore caricamento chat ${archived ? '(archiviate)' : '(attive)'}:`, err);
  }
}

window.refreshChatList = async () => {
  await loadChatList(false); // chat attive
  await loadChatList(true);  // archiviate
};

async function loadChats(retryCount = 0) {
  try {
    const chats = await fetchChats();
    console.log('📦 fetchChats() ha restituito:', chats);

    if (chats.error === 'Client non ancora pronto') {
      if (chatTitle) chatTitle.textContent = 'Connessione a WhatsApp...';
      if (chatStatus) chatStatus.textContent = '';

      if (retryCount < 30) {
        console.log(`🔁 Retry ${retryCount + 1}`);
        setTimeout(() => loadChats(retryCount + 1), 1000);
      } else {
        chatTitle.textContent = 'Impossibile connettersi';
        if (loaderOverlay) loaderOverlay.classList.add('d-none');
      }

      return;
    }

    if (!Array.isArray(chats)) {
      console.error('❌ Dati non validi da /api/chats:', chats);
      chatTitle.textContent = 'Errore caricamento chat';
      loaderOverlay?.classList.add('hidden');
      return;
    }

    await loadContacts();
    await loadOperators();

    await loadChatList(false); // attive
    await loadChatList(true);  // archiviate

    loaderOverlay?.classList.add('d-none');
  } catch (err) {
    console.error('❌ Errore loadChats:', err);
    chatTitle.textContent = 'Errore caricamento chat';
    loaderOverlay?.classList.add('hidden');
  }
}


async function onChatClick(chatId, name) {
  contactNameInput.value = contacts[chatId] || '';
  editContactForm?.classList.add('d-none');

  currentChatId = chatId;
  currentChatIdRef.value = chatId;

  try {
    const res = await fetch(`/api/chats/${chatId}/read`, { method: 'PATCH' });
    if (res.ok) {
      await refreshChatList(); // aspetta l'aggiornamento lato server
    }
  } catch (err) {
    console.warn('Errore nel reset unreadCount:', err);
  }

  chatTitle.textContent = name;
  chatIdentifier.textContent = chatId;

  operatorNameInput.value = operators[chatId] || '';
  editOperatorForm?.classList.add('d-none');

  const messages = await fetchMessages(chatId);
  document.getElementById('messages').innerHTML = '';
  messages.forEach(renderMessage);
  scrollToBottom();
}

if (messageForm) {
  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentChatId) return;

    const file = fileInput?.files[0];
    const text = messageInput?.value || '';
    const result = await sendMessage(currentChatId, text, file);

    if (result.id) {
      renderMessage({
        id: result.id,
        fromMe: true,
        timestamp: Date.now() / 1000,
        body: result.body || result.caption || '',
        media: result.media || null
      });
      scrollToBottom();
    }

    if (messageInput) messageInput.value = '';
    if (fileInput) fileInput.value = '';

    if (typeof window.updateChatPreview === 'function') {
      const previewText = result.body || result.caption || '[media]';
      window.updateChatPreview(currentChatId, previewText);
    }
  });
}

if (editOperatorBtn) {
  editOperatorBtn.addEventListener('click', () => {
    editOperatorForm?.classList.toggle('d-none');
  });
}

if (saveOperatorBtn) {
  saveOperatorBtn.addEventListener('click', async () => {
    const name = operatorNameInput?.value.trim();
    if (!name) return;

    const res = await fetch('/api/operators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentChatId, operator: name })
    });

    if (res.ok) {
      operators[currentChatId] = name;
      editOperatorForm?.classList.add('d-none');
      refreshChatList();
    }
  });
}

if (removeOperatorBtn) {
  removeOperatorBtn.addEventListener('click', async () => {
    const res = await fetch(`/api/operators/${currentChatId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      delete operators[currentChatId];
      if (operatorNameInput) operatorNameInput.value = '';
      editOperatorForm?.classList.add('d-none');
      refreshChatList();
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    renderChatList(fullChatList.filter(c => !c.archived), onChatClick, searchInput?.value || '', activeChatListEl);
    renderChatList(fullChatList.filter(c => c.archived), onChatClick, searchInput?.value || '', archivedChatListEl);
  });
}

window.updateChatPreview = (chatId, lastMessage) => {
  const itemList = document.querySelectorAll('#chat-items li');

  itemList.forEach((item) => {
    const idAttr = item.getAttribute('data-chat-id');
    if (idAttr === chatId) {
      const preview = item.querySelector('.last-message');
      if (preview) {
        preview.textContent = lastMessage || '...';
      }

      // Sposta in cima
      const chatList = document.getElementById('chat-items');
      if (chatList) {
        chatList.prepend(item);
      }
    }
  });
};

if (editContactBtn) {
  editContactBtn.addEventListener('click', () => {
    editContactForm?.classList.toggle('d-none');
  });
}

if (saveContactBtn) {
  saveContactBtn.addEventListener('click', async () => {
    const name = contactNameInput?.value.trim();
    if (!name || !currentChatId) return;

    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentChatId, name })
    });

    if (res.ok) {
      contacts[currentChatId] = name;
      chatTitle.textContent = name; // 🔄 aggiorna titolo in tempo reale
      editContactForm?.classList.add('d-none');
      await refreshChatList();
    }
  });
}

if (cancelContactBtn) {
  cancelContactBtn.addEventListener('click', () => {
    contactNameInput.value = contacts[currentChatId] || '';
    editContactForm?.classList.add('d-none');
  });
}

if (deleteContactBtn) {
  deleteContactBtn.addEventListener('click', async () => {
    if (!currentChatId) return;

    const confirmed = confirm('Vuoi davvero rimuovere questo contatto dalla rubrica?');
    if (!confirmed) return;

    const res = await fetch(`/api/contacts/${currentChatId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      delete contacts[currentChatId];

      // Ripristina il nome di fallback (es. numero o nome chat originario)
      const fallbackName = currentChatId.split('@')[0];
      chatTitle.textContent = fallbackName;

      editContactForm?.classList.add('d-none');
      contactNameInput.value = '';

      await refreshChatList();
    }
  });
}

if (newChatBtn) {
  newChatBtn.addEventListener('click', () => {
    newChatNumberInput.value = '';
    newChatNameInput.value = '';
    const modal = new bootstrap.Modal(document.getElementById('newChatModal'));
    modal.show();
  });
}

if (newChatForm) {
  newChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawNumber = newChatNumberInput.value.trim();
    const name = newChatNameInput.value.trim();
    const modalEl = document.getElementById('newChatModal');
    const modal = bootstrap.Modal.getInstance(modalEl);

    if (!rawNumber.match(/^\d{8,15}$/)) {
      alert('Inserisci un numero valido con prefisso nazionale.');
      return;
    }

    const chatId = `${rawNumber}@c.us`;

    if (name) {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chatId, name })
      });
    }

    modal.hide();

    // Carica e apri la chat
    await refreshChatList();
    onChatClick(chatId, name || rawNumber);
  });
}

loadChats();
