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

const editOperatorBtn = document.getElementById('edit-operator-btn');
const editOperatorForm = document.getElementById('edit-operator-form');
const operatorNameInput = document.getElementById('operator-name-input');
const saveOperatorBtn = document.getElementById('save-operator-btn');
const removeOperatorBtn = document.getElementById('remove-operator-btn');

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

window.refreshChatList = async () => {
  const readParam = currentChatIdRef.value ? `?read=${encodeURIComponent(currentChatIdRef.value)}` : '';
  const res = await fetch(`/api/chats${readParam}`);
  const chats = await res.json();

  fullChatList = chats;
  renderChatList(fullChatList, onChatClick, searchInput?.value || '');
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
        if (chatTitle) chatTitle.textContent = 'Impossibile connettersi';
        console.error('❌ Timeout caricamento chat');
        if (loaderOverlay) loaderOverlay.classList.add('d-none');
      }

      return;
    }

    if (!Array.isArray(chats)) {
      console.error('❌ Dati non validi da /api/chats:', chats);
      if (chatTitle) chatTitle.textContent = 'Errore caricamento chat';
      if (loaderOverlay) loaderOverlay.classList.add('hidden');
      return;
    }

    await loadContacts();
    await loadOperators();

    fullChatList = chats;
    renderChatList(fullChatList, onChatClick, searchInput?.value || '');

    if (loaderOverlay) {
      loaderOverlay.classList.add('hidden');
    }

  } catch (err) {
    console.error('❌ Errore loadChats:', err);
    if (chatTitle) chatTitle.textContent = 'Errore caricamento chat';
    if (loaderOverlay) loaderOverlay.classList.add('hidden');
  }
}

async function onChatClick(chatId, name) {
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
    renderChatList(fullChatList, onChatClick, searchInput.value);
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

loadChats();
