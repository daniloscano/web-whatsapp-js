export function setupEmojiPicker(inputEl) {
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');
  
    if (!emojiBtn || !emojiPicker || !inputEl) return;
  
    // Mostra/nasconde il picker al click sull’icona
    emojiBtn.addEventListener('click', () => {
      emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
    });
  
    // Inserisce l’emoji selezionata nel campo input
    emojiPicker.addEventListener('emoji-click', event => {
      inputEl.value += event.detail.unicode;
      emojiPicker.style.display = 'none';
    });
  
    // (Facoltativo) Chiudi picker cliccando fuori
    document.addEventListener('click', (e) => {
      if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.style.display = 'none';
      }
    });
  }
  