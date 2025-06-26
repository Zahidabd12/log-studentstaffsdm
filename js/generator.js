// js/generator.js
document.addEventListener('DOMContentLoaded', () => {
    const todayString = new Date().toISOString().slice(0, 10);
    const textMasuk = `PRESENSI_MASUK_${todayString}`;
    const textPulang = `PRESENSI_PULANG_${todayString}`;

    document.getElementById('current-date').textContent = new Date().toLocaleDateString('id-ID', { dateStyle: 'full' });

    const generateQR = (elementId, text) => {
        const typeNumber = 4;
        const errorCorrectionLevel = 'L';
        const qr = qrcode(typeNumber, errorCorrectionLevel);
        qr.addData(text);
        qr.make();
        document.getElementById(elementId).innerHTML = qr.createImgTag(6);
    };

    generateQR('qr-masuk', textMasuk);
    generateQR('qr-pulang', textPulang);
});