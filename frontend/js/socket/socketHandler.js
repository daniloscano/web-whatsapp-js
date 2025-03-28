import { renderMessage } from '../render/messageRenderer.js';
import { scrollToBottom } from '../ui/uiUtils.js';
import { updateMessageAckStatus } from '../render/messageRenderer.js';

export function setupSocketHandlers(currentChatIdRef, onStatusChange, onMessageReceived) {
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
        mediaUrl: msg.mediaUrl,
        timestamp: msg.timestamp || Date.now() / 1000,
        ack: msg.ack
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

    if (typeof onMessageReceived === 'function') {
      onMessageReceived(msg);
    }
  });

  // ✅ Nuovo: gestione ack in realtime
  socket.on('message_ack', ({ id, ack }) => {
    const event = new CustomEvent('messageAckUpdate', { detail: { id, ack } });
    window.dispatchEvent(event);
    console.log('📥 message_ack ricevuto:', id, ack);
    updateMessageAckStatus(id, ack);
  });
}
