import { renderMessage } from '../render/messageRenderer.js';
import { scrollToBottom } from '../ui/uiUtils.js';

export function setupSocketHandlers(currentChatIdRef, onStatusChange) {
  const socket = io();

  socket.on('state_change', (state) => {
    if (typeof onStatusChange === 'function') {
      onStatusChange(state);
    }
  });

  socket.on('message', (msg) => {
    const currentChatId = currentChatIdRef.value;

    if (!msg || !msg.chatId) return;

    const isCurrent = currentChatId && msg.chatId === currentChatId;

    if (isCurrent) {
      renderMessage({
        id: msg.id,
        fromMe: msg.fromMe || false,
        body: msg.body || msg.caption || '',
        media: msg.media || null,
        timestamp: msg.timestamp || Date.now() / 1000
      });
      scrollToBottom();

      if (typeof window.updateChatPreview === 'function') {
        const previewText = msg.body || msg.caption || '[media]';
        window.updateChatPreview(msg.chatId, previewText);
      }
    } else {
      if (typeof window.refreshChatList === 'function') {
        window.refreshChatList();
      }
    }
  });

  socket.on('message_read', (chatId) => {
    const item = document.querySelector(`.chat-list-item[data-chat-id="${chatId}"]`);
    if (item) {
      const badge = item.querySelector('.badge');
      if (badge) badge.remove();

      const nameEl = item.querySelector('.chat-name');
      if (nameEl) {
        nameEl.classList.remove('fw-bold');
        nameEl.classList.add('fw-normal');
      }
    }
  });
}
