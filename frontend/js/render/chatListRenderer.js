const chatListEl = document.getElementById('chat-items');
const archivedListEl = document.getElementById('archived-chat-items');

export function renderChatList(chats, onClick, searchTerm = '', container = null) {
  // ✅ Se abbiamo un contenitore specifico, puliamo solo quello
  if (container) {
    container.innerHTML = '';
  } else {
    chatListEl.innerHTML = '';
    archivedListEl.innerHTML = '';
  }

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
    item.className = 'chat-list-item list-group-item d-flex justify-content-between align-items-start cursor-pointer';
    item.dataset.chatId = chat.id;

    item.onclick = () => onClick(chat.id, chat.name);

    const nameClass = chat.unreadCount > 0 ? 'fw-bold' : 'fw-normal';
    const mainText = `<div class="chat-name ${nameClass}">${chat.name || chat.id}</div>`;
    const subText = chat.lastMessage || 'Nessun messaggio';
    const operator = chat.operator ? ` ${chat.operator}` : '';

    item.innerHTML = `
      <div class="ms-2 me-auto position-relative w-100 d-flex justify-content-between align-items-start">
        <div>
          <div class="chat-name ${nameClass}">${chat.name || chat.id}</div>
          <div class="last-message text-muted small">${subText}</div>
          ${operator ? `<small class="text-secondary">${operator}</small>` : ''}
        </div>
        <div class="d-flex flex-row align-items-center gap-1 ms-2 w-25">
          <button class="btn btn-sm btn-link text-danger delete-chat-btn d-none" data-chat-id="${chat.id}" title="Elimina chat">🗑️</button>
          <button class="btn btn-sm btn-link archive-chat-btn d-none" data-chat-id="${chat.id}" title="${chat.archived ? 'Riattiva' : 'Archivia'} chat">
            ${chat.archived ? '📤' : '📥'}
          </button>
        </div>
      </div>
      ${chat.unreadCount > 0
        ? `<span class="badge bg-primary rounded-pill">${chat.unreadCount}</span>`
        : ''}
    `;

    item.addEventListener('mouseenter', () => {
      item.querySelector('.delete-chat-btn')?.classList.remove('d-none');
      item.querySelector('.archive-chat-btn')?.classList.remove('d-none');
    });

    item.addEventListener('mouseleave', () => {
      item.querySelector('.delete-chat-btn')?.classList.add('d-none');
      item.querySelector('.archive-chat-btn')?.classList.add('d-none');
    });

    item.querySelector('.delete-chat-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const chatId = e.currentTarget.dataset.chatId;
      if (confirm('Vuoi davvero eliminare questa chat?')) {
        try {
          const res = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
          if (res.ok) {
            item.remove();
          } else {
            alert('Errore nella cancellazione della chat.');
          }
        } catch (err) {
          console.error('Errore delete:', err);
          alert('Errore nella comunicazione con il server.');
        }
      }
    });

    item.querySelector('.archive-chat-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const chatId = e.currentTarget.dataset.chatId;

      try {
        const res = await fetch(`/api/chats/${chatId}/archive`, {
          method: 'PATCH'
        });

        if (res.ok) {
          item.remove(); // 🔄 Rimuove dalla lista corrente
        } else {
          alert('Errore nell\'aggiornamento dello stato archivio.');
        }
      } catch (err) {
        console.error('Errore archiviazione:', err);
        alert('Errore nella comunicazione con il server.');
      }
    });

    // ✅ Decide dove appenderla in base al flag archived
    if (container) {
      container.appendChild(item);
    } else if (chat.archived) {
      archivedListEl.appendChild(item);
    } else {
      chatListEl.appendChild(item);
    }
  });
}