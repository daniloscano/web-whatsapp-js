export async function fetchChats() {
  try {
    const res = await fetch('/api/chats');
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Errore durante il recupero delle chat');
    }
    return await res.json();
  } catch (err) {
    console.error('Errore in fetchChats:', err);
    throw err;
  }
}
