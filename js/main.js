import { db } from './firebase-config.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date'); // Asumsikan Anda punya elemen ini
    
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
        if(dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', { dateStyle: 'full' });
        if(timeEl) timeEl.textContent = now.toLocaleTimeString('id-ID');
    };
    setInterval(updateTime, 1000);
    updateTime();

    const q = query(collection(db, "presence_status"), where("tanggal", "==", todayString));
    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            if ((change.type === "added" || change.type === "modified")) {
                if (data.jamPulang) {
                    showNotification(`Terima Kasih, ${data.displayName}!`, 'clock-out');
                } else if (data.jamMasuk) {
                    showNotification(`Selamat Datang, ${data.displayName}!`, 'clock-in');
                }
            }
        });
    });
});

function showNotification(message, type) {
    const notifText = document.getElementById('notification-text');
    const notifBox = document.getElementById('notification');
    notifText.textContent = message;
    notifBox.className = `notification ${type} show`;
    setTimeout(() => { notifBox.classList.remove('show'); }, 5000);
}