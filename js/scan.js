import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

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
    const statusEl = document.getElementById('presence-status');
    const infoEl = document.getElementById('presence-info');
    const scanBtn = document.getElementById('scan-button');
    const resetBtn = document.getElementById('reset-button');
    const cameraContainer = document.getElementById('camera-container');
    const video = document.getElementById('camera-feed');
    const cancelScanBtn = document.getElementById('cancel-scan-btn');
    const logoutBtn = document.getElementById('logout-btn');
    let stream = null;

    const getTodayKey = () => `presensi_${currentUser.uid}_${new Date().toISOString().slice(0, 10)}`;

    const checkStatus = () => {
        const todayKey = getTodayKey();
        const todayPresence = JSON.parse(localStorage.getItem(todayKey));
        resetBtn.classList.add('hidden');
        if (!todayPresence) {
            statusEl.textContent = "Anda Belum Clock In";
            infoEl.textContent = "Silakan pindai QR Code 'CLOCK IN' untuk memulai.";
            scanBtn.textContent = "Pindai untuk Clock In";
            scanBtn.className = "action-button clock-in";
            scanBtn.disabled = false;
        } else if (todayPresence && !todayPresence.jamPulang) {
            statusEl.textContent = "Anda Sudah Clock In";
            infoEl.textContent = `Waktu masuk: ${todayPresence.jamMasuk}`;
            scanBtn.textContent = "Pindai untuk Clock Out";
            scanBtn.className = "action-button clock-out";
            scanBtn.disabled = false;
        } else {
            statusEl.textContent = "Presensi Hari Ini Selesai";
            infoEl.textContent = `Masuk: ${todayPresence.jamMasuk} | Pulang: ${todayPresence.jamPulang}`;
            scanBtn.textContent = "Selesai";
            scanBtn.className = "action-button";
            scanBtn.disabled = true;
            resetBtn.classList.remove('hidden');
        }
    };

    const startScanner = () => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(s => {
                stream = s;
                video.srcObject = stream;
                video.play();
                cameraContainer.classList.remove('hidden');
                document.getElementById('status-display').classList.add('hidden');
                scanBtn.classList.add('hidden');
                requestAnimationFrame(tick);
            }).catch(() => alert("Tidak dapat mengakses kamera. Pastikan Anda memberikan izin."));
    };
    
    const stopScanner = () => {
        if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
        cameraContainer.classList.add('hidden');
        document.getElementById('status-display').classList.remove('hidden');
        scanBtn.classList.remove('hidden');
    };

    const tick = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
            if (code) { handleQRCode(code.data); return; }
        }
        if (stream) { requestAnimationFrame(tick); }
    };

    const handleQRCode = async (data) => {
        stopScanner();
        const todayString = new Date().toISOString().slice(0, 10);
        const expectedClockIn = `PRESENSI_MASUK_${todayString}`;
        const expectedClockOut = `PRESENSI_PULANG_${todayString}`;
        const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        const todayKey = getTodayKey();
        const todayPresence = JSON.parse(localStorage.getItem(todayKey));
        let notificationData = null;

        try {
            if (data === expectedClockIn && !todayPresence) {
                localStorage.setItem(todayKey, JSON.stringify({ jamMasuk: currentTime, jamPulang: null, logId: null }));
                notificationData = { type: 'clock-in', nama: currentUser.displayName };
                alert(`Berhasil Clock In pada jam ${currentTime}`);
            } else if (data === expectedClockOut && todayPresence && !todayPresence.jamPulang) {
                const newLogId = Date.now().toString();
                const updatedPresence = { ...todayPresence, jamPulang: currentTime, logId: newLogId };
                localStorage.setItem(todayKey, JSON.stringify(updatedPresence));
                const newLog = {
                    tanggal: todayString, jamMasuk: updatedPresence.jamMasuk, jamPulang: updatedPresence.jamPulang,
                    durasi: calculateDuration(updatedPresence.jamMasuk, updatedPresence.jamPulang),
                    kegiatan: "Aktivitas harian tercatat melalui presensi QR.",
                    userId: currentUser.uid
                };
                await setDoc(doc(db, "logs", newLogId), newLog);
                notificationData = { type: 'clock-out', nama: currentUser.displayName };
                alert(`Berhasil Clock Out pada jam ${currentTime}.`);
            } else {
                alert("QR Code tidak valid atau status presensi tidak sesuai.");
            }
        } catch (error) {
            console.error("Error handling QR Code: ", error);
            alert("Terjadi kesalahan saat memproses data.");
        } finally {
            if (notificationData) { 
                localStorage.setItem('lastPresenceActivity', JSON.stringify(notificationData)); 
                setTimeout(() => localStorage.removeItem('lastPresenceActivity'), 1000); 
            }
            checkStatus();
        }
    };
    
    const calculateDuration = (startTime, endTime) => {
        const start = new Date(`1970-01-01T${startTime}`); const end = new Date(`1970-01-01T${endTime}`);
        if (end < start) return { totalMinutes: 0, text: "0j 0m" };
        const diff = end.getTime() - start.getTime(); const totalMinutes = Math.floor(diff / 60000);
        const hours = Math.floor(totalMinutes / 60); const minutes = totalMinutes % 60;
        return { totalMinutes, text: `${hours}j ${minutes}m` };
    };
    
    const resetPresence = () => {
        if (confirm("Yakin ingin mereset presensi hari ini? Log terkait juga akan dihapus.")) {
            const todayPresence = JSON.parse(localStorage.getItem(getTodayKey()));
            if (todayPresence && todayPresence.logId) {
                deleteDoc(doc(db, "logs", todayPresence.logId)).catch(err => console.error("Gagal hapus log:", err));
            }
            localStorage.removeItem(getTodayKey());
            alert("Presensi hari ini telah direset.");
            checkStatus();
        }
    };

    scanBtn.addEventListener('click', startScanner);
    resetBtn.addEventListener('click', resetPresence);
    cancelScanBtn.addEventListener('click', stopScanner);
    logoutBtn.addEventListener('click', (e) => { e.preventDefault(); if (confirm('Yakin logout?')) { signOut(auth).then(() => window.location.replace('login.html')).catch(err => console.error(err)); } });
    
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'scan.html') document.getElementById('nav-scan').classList.add('active');
    
    checkStatus();
}