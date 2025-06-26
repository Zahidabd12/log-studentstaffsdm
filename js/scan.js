import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

onAuthStateChanged(auth, user => {
    const loader = document.getElementById('loader');
    const pageContent = document.getElementById('page-content');
    if (user) {
        loader.style.display = 'none';
        pageContent.style.display = 'block';
        runScanApp(user);
    } else {
        window.location.replace('login.html');
    }
});

function runScanApp(currentUser) {
    const welcomeMsgEl = document.getElementById('welcome-message');
    const statusEl = document.getElementById('presence-status');
    const infoEl = document.getElementById('presence-info');
    const scanBtn = document.getElementById('scan-button');
    const resetBtn = document.getElementById('reset-button');
    const cameraContainer = document.getElementById('camera-container');
    const video = document.getElementById('camera-feed');
    const cancelScanBtn = document.getElementById('cancel-scan-btn');
    const logoutBtn = document.getElementById('logout-btn');
    let stream = null;

    welcomeMsgEl.textContent = `Selamat Datang, ${currentUser.displayName}!`;

    const getTodayDocId = () => `${currentUser.uid}_${new Date().toISOString().slice(0, 10)}`;

    const checkStatus = async () => {
        statusEl.textContent = "Memeriksa status...";
        infoEl.textContent = "";
        actionBtn.disabled = true;

        try {
            const docId = getTodayDocId();
            const presenceRef = doc(db, "presence_status", docId);
            const presenceSnap = await getDoc(presenceRef);
            const todayPresence = presenceSnap.exists() ? presenceSnap.data() : null;

            resetBtn.classList.add('hidden');
            scanBtn.className = "action-button";
            scanBtn.textContent = "Pindai QR Presensi";
            scanBtn.disabled = false;

            if (!todayPresence) {
                statusEl.textContent = "Anda Belum Melakukan Presensi";
                infoEl.textContent = "Arahkan kamera ke QR Code 'CLOCK IN'.";
            } else if (todayPresence && !todayPresence.jamPulang) {
                statusEl.textContent = "Anda Sudah Clock In";
                infoEl.textContent = `Waktu masuk: ${todayPresence.jamMasuk}. Arahkan kamera ke QR 'CLOCK OUT'.`;
            } else {
                statusEl.textContent = "Presensi Hari Ini Selesai";
                infoEl.textContent = `Masuk: ${todayPresence.jamMasuk} | Pulang: ${todayPresence.jamPulang}`;
                scanBtn.textContent = "Selesai";
                scanBtn.disabled = true;
                resetBtn.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Gagal memeriksa status:", error);
            statusEl.textContent = "Gagal Memuat Status";
            infoEl.textContent = "Terjadi kesalahan. Coba muat ulang.";
        }
    };
    
    const startScanner = () => { /* ... kode startScanner sama seperti sebelumnya ... */ };
    const stopScanner = () => { /* ... kode stopScanner sama seperti sebelumnya ... */ };
    const tick = () => { /* ... kode tick sama seperti sebelumnya ... */ };
    
    const handleQRCode = async (data) => {
        stopScanner();
        const todayString = new Date().toISOString().slice(0, 10);
        const expectedClockIn = `PRESENSI_MASUK_${todayString}`;
        const expectedClockOut = `PRESENSI_PULANG_${todayString}`;
        const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        const docId = getTodayDocId();
        const presenceRef = doc(db, "presence_status", docId);
        
        try {
            if (data === expectedClockIn) {
                await setDoc(presenceRef, {
                    jamMasuk: currentTime, jamPulang: null, logId: null,
                    displayName: currentUser.displayName, tanggal: todayString,
                });
                alert(`Berhasil Clock In pada jam ${currentTime}`);
            } else if (data === expectedClockOut) {
                const presenceSnap = await getDoc(presenceRef);
                if (!presenceSnap.exists() || presenceSnap.data().jamPulang) {
                    alert("Status tidak valid untuk Clock Out. Silakan Clock In terlebih dahulu.");
                    checkStatus(); return;
                }
                const newLogId = Date.now().toString();
                await updateDoc(presenceRef, { jamPulang: currentTime, logId: newLogId });
                const newLog = {
                    tanggal: todayString, jamMasuk: presenceSnap.data().jamMasuk, jamPulang: currentTime,
                    durasi: calculateDuration(presenceSnap.data().jamMasuk, currentTime),
                    kegiatan: "Aktivitas harian tercatat melalui presensi QR.",
                    userId: currentUser.uid
                };
                await setDoc(doc(db, "logs", newLogId), newLog);
                alert(`Berhasil Clock Out pada jam ${currentTime}.`);
            } else {
                alert("QR Code tidak valid atau tidak sesuai.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan.");
        } finally {
            checkStatus();
        }
    };
    
    // --- FUNGSI RESET DENGAN PERBAIKAN ---
    const resetPresence = async () => {
        if (confirm("Yakin ingin mereset presensi hari ini? Log terkait juga akan dihapus.")) {
            const docId = getTodayDocId();
            const presenceRef = doc(db, "presence_status", docId);
            const presenceSnap = await getDoc(presenceRef);
            
            if (presenceSnap.exists()) {
                // Gunakan nama variabel yang benar: presenceData
                const presenceData = presenceSnap.data();
                try {
                    // Cek jika ada logId untuk dihapus
                    if (presenceData.logId) {
                        await deleteDoc(doc(db, "logs", presenceData.logId));
                    }
                    // Hapus dokumen status presensi
                    await deleteDoc(presenceRef);
                    alert("Presensi hari ini telah direset.");
                } catch (err) {
                    console.error("Gagal mereset:", err);
                    alert("Gagal mereset data.");
                } finally {
                    checkStatus();
                }
            }
        }
    };
    
    const calculateDuration = (startTime, endTime) => { /* ... kode sama ... */ };
    
    scanBtn.addEventListener('click', startScanner);
    resetBtn.addEventListener('click', resetPresence);
    cancelScanBtn.addEventListener('click', stopScanner);
    logoutBtn.addEventListener('click', (e) => { e.preventDefault(); if (confirm('Yakin logout?')) { signOut(auth).then(() => window.location.replace('login.html')); } });
    
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'scan.html') document.getElementById('nav-scan').classList.add('active');
    
    checkStatus();
}