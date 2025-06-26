document.addEventListener('DOMContentLoaded', () => {
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');

    // Tampilkan QR Codes
    const todayString = new Date().toISOString().slice(0, 10);
    const textMasuk = `PRESENSI_MASUK_${todayString}`;
    const textPulang = `PRESENSI_PULANG_${todayString}`;

    const generateQR = (elementId, text) => {
        const typeNumber = 4;
        const errorCorrectionLevel = 'L';
        const qr = qrcode(typeNumber, errorCorrectionLevel);
        qr.addData(text);
        qr.make();
        document.getElementById(elementId).innerHTML = qr.createImgTag(8, 8); // Perbesar QR
    };

    generateQR('qr-masuk', textMasuk);
    generateQR('qr-pulang', textPulang);

    // Tampilkan jam dan tanggal live
    const updateTime = () => {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('id-ID', { dateStyle: 'full' });
        timeEl.textContent = now.toLocaleTimeString('id-ID');
    };
    
    setInterval(updateTime, 1000);
    updateTime();
});