import { db } from './firebase-config.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    const todayString = new Date().toISOString().slice(0, 10);
    const textMasuk = `PRESENSI_MASUK_${todayString}`;
    const textPulang = `PRESENSI_PULANG_${todayString}`;

    // ... (kode generateQR dan updateTime tetap sama) ...
    const generateQR = (elementId, text) => { /* ... kode sama ... */ };
    const updateTime = () => { /* ... kode sama ... */ };
    generateQR('qr-masuk', textMasuk);
    generateQR('qr-pulang', textPulang);
    setInterval(updateTime, 1000);
    updateTime();

    // LISTENER REAL-TIME UNTUK NOTIFIKASI
    const todayQuery = query(collection(db, "presence_status"), where("tanggal", "==", todayString));

    onSnapshot(todayQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            // Hanya tampilkan notifikasi jika dokumen baru ditambahkan (clock-in)
            // atau dimodifikasi (clock-out)
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
    notifBox.className = `notification ${type}`; // Tipe: 'clock-in' atau 'clock-out'
    notifBox.classList.add('show');
    
    setTimeout(() => {
        notifBox.classList.remove('show');
    }, 5000);
}