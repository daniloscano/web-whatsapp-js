const socket = io();

// ✅ Ricezione QR e visualizzazione
socket.on('qr', (qrDataUrl) => {
  console.log('✅ QR ricevuto dal backend');
  const qrBox = document.getElementById('qr');
  qrBox.innerHTML = '';

  const img = document.createElement('img');
  img.src = qrDataUrl;
  img.alt = 'QR Code';
  img.classList.add('img-fluid');

  qrBox.appendChild(img);
});

// ✅ Se il client è connesso, vai a chat.html
socket.on('state_change', (status) => {
  console.log('🔄 Stato client:', status);
  if (status === 'CONNECTED') {
    window.location.href = 'chat.html';
  }
});
