// 📥 Recupera messaggi di una specifica chat
export async function fetchMessages(chatId) {
  try {
    const res = await fetch(`/api/messages/${chatId}`);
    if (!res.ok) throw new Error('Errore nel recupero dei messaggi');
    return await res.json();
  } catch (err) {
    console.error('Errore in fetchMessages:', err);
    return [];
  }
}

// 📤 Invia messaggio con testo e/o file
export async function sendMessage(to, message, file) {
  try {
    const formData = new FormData();
    formData.append('to', to);
    formData.append('message', message);
    if (file) {
      formData.append('file', file);
    }

    const res = await fetch('/api/messages/send-full', {
      method: 'POST',
      body: formData
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || 'Errore generico durante invio messaggio');
    }

    return result;
  } catch (err) {
    console.error("❌ Errore nell'invio:", err.message);
    console.error(err.stack); // stampa lo stack completo
    return res.status(500).json({
      error: "Errore durante l'invio del messaggio",
      detail: err.message
    });
  }
  
}
