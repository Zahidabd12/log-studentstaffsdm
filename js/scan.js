import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { collection, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, user => {
        if (user) {
            runInternMode(user);
        } else {
            window.location.replace('login.html');
        }
    });
});

function runInternMode(currentUser) {
    const statusEl = document.getElementById('presence-status');
    const infoEl = document.getElementById('presence-info');
    const scanBtn = document.getElementById('scan-button');
    const resetBtn = document.getElementById('reset-button');
    const cameraContainer = document.getElementById('camera-container');
    const video = document.getElementById('camera-feed');
    const cancelScanBtn = document.getElementById('cancel-scan-btn');
    let stream = null;

    const getTodayKey = () => `presensi_${currentUser.uid}_${new Date().toISOString().slice(0, 10)}`;
    
    const checkStatus = () => { /* ... (kode sama) ... */ };
    const startScanner = (mode) => { /* ... (kode sama) ... */ };
    const stopScanner = () => { /* ... (kode sama) ... */ };
    const tick = (mode) => { /* ... (kode sama) ... */ };
    const calculateDuration = (startTime, endTime) => { /* ... (kode sama) ... */ };
    
    const handleQRCode = (data, mode) => {
        stopScanner();
        const todayString = new Date().toISOString().slice(0, 10);
        const expectedClockIn = `PRESENSI_MASUK_${todayString}`;
        const expectedClockOut = `PRESENSI_PULANG_${todayString}`;
        const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        let notificationData = null;

        if (mode === 'clock-in' && data === expectedClockIn) {
            localStorage.setItem(getTodayKey(), JSON.stringify({ jamMasuk: currentTime, jamPulang: null, logId: null }));
            notificationData = { type: 'clock-in', nama: currentUser.displayName };
            alert(`Berhasil Clock In pada jam ${currentTime}`);
        } else if (mode === 'clock-out' && data === expectedClockOut) {
            const todayPresence = JSON.parse(localStorage.getItem(getTodayKey()));
            if (!todayPresence || todayPresence.jamPulang) { alert("Status presensi tidak valid."); checkStatus(); return; }
            const newLogId = Date.now().toString();
            todayPresence.jamPulang = currentTime;
            todayPresence.logId = newLogId;
            localStorage.setItem(getTodayKey(), JSON.stringify(todayPresence));
            const newLog = {
                tanggal: todayString, jamMasuk: todayPresence.jamMasuk, jamPulang: todayPresence.jamPulang,
                durasi: calculateDuration(todayPresence.jamMasuk, todayPresence.jamPulang),
                kegiatan: "Aktivitas harian tercatat melalui presensi QR.",
                userId: currentUser.uid
            };
            setDoc(doc(db, "logs", newLogId), newLog)
                .then(() => {
                    notificationData = { type: 'clock-out', nama: currentUser.displayName };
                    alert(`Berhasil Clock Out pada jam ${currentTime}.`);
                    if (notificationData) { localStorage.setItem('lastPresenceActivity', JSON.stringify(notificationData)); setTimeout(() => localStorage.removeItem('lastPresenceActivity'), 500); }
                    checkStatus();
                });
            return;
        } else {
            alert("QR Code tidak valid.");
        }
        if (notificationData) { localStorage.setItem('lastPresenceActivity', JSON.stringify(notificationData)); setTimeout(() => localStorage.removeItem('lastPresenceActivity'), 500); }
        checkStatus();
    };
    
    const resetPresence = () => { /* ... (kode sama) ... */ };
    scanBtn.addEventListener('click', () => { /* ... (kode sama) ... */ });
    resetBtn.addEventListener('click', resetPresence);
    cancelScanBtn.addEventListener('click', stopScanner);
    checkStatus();
}

// Navigasi & Logout
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) { logoutBtn.addEventListener('click', (e) => { e.preventDefault(); if (confirm('Yakin logout?')) { signOut(auth).then(() => window.location.replace('login.html')); } }); }
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'scan.html') document.getElementById('nav-scan').classList.add('active');
});