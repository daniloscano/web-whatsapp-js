// 📅 Formatta un timestamp in HH:mm (es. 14:32)
export function formatTimestamp(ts) {
    const date = new Date(ts * 1000 || ts); // supporta secondi o ms
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // 🔽 Scroll automatico alla fine della conversazione
  export function scrollToBottom() {
    const el = document.getElementById('messages');
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
  