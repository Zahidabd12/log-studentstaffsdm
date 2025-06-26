import { db } from './firebase-config.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const timeEl = document.getElementById('current-time');

    // 1. Buat QR Code yang mengarah ke halaman scanner
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    const scannerPageUrl = `${baseUrl}/scan.html`;

    const qr = qrcode(4, 'L');
    qr.addData(scannerPageUrl);
    qr.make();
    document.getElementById('qr-code').innerHTML = qr.createImgTag(10, 10);

    // 2. Jam digital
    const updateTime = () => {
        timeEl.textContent = new Date().toLocaleTimeString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };
    setInterval(updateTime, 1000);
    updateTime();

    // 3. Listener notifikasi
    const todayString = new Date().toISOString().slice(0, 10);
    const q = query(collection(db, "presence_status"), where("tanggal", "==", todayString));
    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            if (change.type === "added" && data.jamMasuk && !data.jamPulang) {
                showNotification(`Selamat Datang, ${data.displayName}!`, 'clock-in');
            } else if (change.type === "modified" && data.jamPulang) {
                showNotification(`Terima Kasih, ${data.displayName}!`, 'clock-out');
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