document.addEventListener('DOMContentLoaded', () => {
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    const todayString = new Date().toISOString().slice(0, 10);
    const textMasuk = `PRESENSI_MASUK_${todayString}`;
    const textPulang = `PRESENSI_PULANG_${todayString}`;
    const generateQR = (elementId, text) => {
        const qr = qrcode(4, 'L');
        qr.addData(text);
        qr.make();
        document.getElementById(elementId).innerHTML = qr.createImgTag(8, 8);
    };
    generateQR('qr-masuk', textMasuk);
    generateQR('qr-pulang', textPulang);
    const updateTime = () => {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('id-ID', { dateStyle: 'full' });
        timeEl.textContent = now.toLocaleTimeString('id-ID');
    };
    setInterval(updateTime, 1000);
    updateTime();
    window.addEventListener('storage', (e) => {
        if (e.key === 'lastPresenceActivity') {
            const data = JSON.parse(e.newValue);
            const notifText = document.getElementById('notification-text');
            const notifBox = document.getElementById('notification');
            if (data.type === 'clock-in') {
                notifText.textContent = `Selamat Datang, ${data.nama}!`;
                notifBox.className = 'notification clock-in';
            } else if (data.type === 'clock-out') {
                notifText.textContent = `Terima Kasih, ${data.nama}!`;
                notifBox.className = 'notification clock-out';
            }
            notifBox.classList.add('show');
            setTimeout(() => { notifBox.classList.remove('show'); }, 5000);
        }
    });
});