const chatListEl = document.getElementById('chat-items');

export function renderChatList(chats, onClick, searchTerm = '') {
  chatListEl.innerHTML = '';

  const filtered = chats.filter(chat => {
    const lower = searchTerm.toLowerCase();
    return (
      chat.name?.toLowerCase().includes(lower) ||
      chat.id?.toLowerCase().includes(lower) ||
      chat.operator?.toLowerCase().includes(lower)
    );
  });

  filtered.forEach(chat => {
    const item = document.createElement('li');
    item.className = 'list-group-item d-flex justify-content-between align-items-start cursor-pointer';
    item.onclick = () => onClick(chat.id, chat.name);

    const nameClass = chat.unreadCount > 0 ? 'fw-bold' : '';
    const mainText = `<div class="${nameClass}">${chat.name || chat.id}</div>`;
    const subText = chat.lastMessage || 'Nessun messaggio';
    const operator = chat.operator ? `👤 ${chat.operator}` : '';

    item.innerHTML = `
      <div class="ms-2 me-auto">
        ${mainText}
        <small class="text-muted">${subText}</small><br />
        ${operator ? `<small class="text-secondary">${operator}</small>` : ''}
      </div>
      ${chat.unreadCount > 0
        ? `<span class="badge bg-primary rounded-pill">${chat.unreadCount}</span>`
        : ''}
    `;

    chatListEl.appendChild(item);
  });
}
