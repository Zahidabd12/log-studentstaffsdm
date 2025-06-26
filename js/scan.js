import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Penjaga Halaman
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
    const actionBtn = document.getElementById('action-button');
    const resetBtn = document.getElementById('reset-button');
    const logoutBtn = document.getElementById('logout-btn');
    const clockEl = document.getElementById('live-clock-intern');

    welcomeMsgEl.textContent = `Selamat Datang, ${currentUser.displayName}!`;
    setInterval(() => { clockEl.textContent = new Date().toLocaleTimeString('id-ID', {timeStyle: 'medium'}); }, 1000);

    const getTodayDocId = () => `${currentUser.uid}_${new Date().toISOString().slice(0, 10)}`;

    const checkStatus = async () => {
        actionBtn.disabled = true;
        statusEl.textContent = "Memeriksa status...";
        infoEl.textContent = "";

        // DIBUNGKUS DENGAN TRY...CATCH
        try {
            const docId = getTodayDocId();
            const presenceRef = doc(db, "presence_status", docId);
            const presenceSnap = await getDoc(presenceRef);
            const todayPresence = presenceSnap.exists() ? presenceSnap.data() : null;

            resetBtn.classList.add('hidden');
            if (!todayPresence) {
                statusEl.textContent = "Siap untuk Bekerja?";
                infoEl.textContent = "Klik tombol di bawah untuk mencatat jam masuk Anda.";
                actionBtn.textContent = "Clock In";
                actionBtn.className = "action-button clock-in";
                actionBtn.disabled = false;
            } else if (todayPresence && !todayPresence.jamPulang) {
                statusEl.textContent = "Anda Sedang Bekerja";
                infoEl.textContent = `Waktu masuk tercatat pukul: ${todayPresence.jamMasuk}`;
                actionBtn.textContent = "Clock Out";
                actionBtn.className = "action-button clock-out";
                actionBtn.disabled = false;
            } else {
                statusEl.textContent = "Presensi Hari Ini Selesai";
                infoEl.textContent = `Masuk: ${todayPresence.jamMasuk} | Pulang: ${todayPresence.jamPulang}`;
                actionBtn.textContent = "Selesai";
                actionBtn.className = "action-button";
                actionBtn.disabled = true;
                resetBtn.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Gagal memeriksa status presensi:", error);
            statusEl.textContent = "Gagal Memuat Status";
            infoEl.textContent = "Terjadi kesalahan jaringan. Coba muat ulang halaman.";
            actionBtn.disabled = true;
        }
    };

    const handlePresenceAction = async () => {
        actionBtn.disabled = true;
        const todayString = new Date().toISOString().slice(0, 10);
        const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const docId = getTodayDocId();
        const presenceRef = doc(db, "presence_status", docId);

        try {
            const presenceSnap = await getDoc(presenceRef);
            const todayPresence = presenceSnap.exists() ? presenceSnap.data() : null;

            if (!todayPresence) { // Aksi untuk Clock In
                await setDoc(presenceRef, {
                    jamMasuk: currentTime, jamPulang: null, logId: null,
                    displayName: currentUser.displayName, tanggal: todayString,
                });
                alert(`Berhasil Clock In pada jam ${currentTime}`);
            } else if (todayPresence && !todayPresence.jamPulang) { // Aksi untuk Clock Out
                const newLogId = Date.now().toString();
                await updateDoc(presenceRef, { jamPulang: currentTime, logId: newLogId });
                const newLog = {
                    tanggal: todayString, jamMasuk: todayPresence.jamMasuk, jamPulang: currentTime,
                    durasi: calculateDuration(todayPresence.jamMasuk, currentTime),
                    kegiatan: "Aktivitas harian tercatat melalui presensi.",
                    userId: currentUser.uid
                };
                await setDoc(doc(db, "logs", newLogId), newLog);
                alert(`Berhasil Clock Out pada jam ${currentTime}.`);
            }
        } catch (error) {
            console.error("Error saat presensi:", error);
            alert("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            checkStatus();
        }
    };
    
    const resetPresence = async () => {
        if (confirm("Yakin ingin mereset presensi hari ini? Log terkait juga akan dihapus.")) {
            const docId = getTodayDocId();
            const presenceRef = doc(db, "presence_status", docId);
            const presenceSnap = await getDoc(presenceRef);
            if (presenceSnap.exists()) {
                const presenceData = presenceSnap.data();
                try {
                    if (presensiData.logId) await deleteDoc(doc(db, "logs", presensiData.logId));
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

    const calculateDuration = (startTime, endTime) => {
        const start = new Date(`1970-01-01T${startTime}`); const end = new Date(`1970-01-01T${endTime}`);
        if (end < start) return { totalMinutes: 0, text: "0j 0m" };
        const diff = end.getTime() - start.getTime(); const totalMinutes = Math.floor(diff / 60000);
        const hours = Math.floor(totalMinutes / 60); const minutes = totalMinutes % 60;
        return { totalMinutes, text: `${hours}j ${minutes}m` };
    };
    
    actionBtn.addEventListener('click', handlePresenceAction);
    resetBtn.addEventListener('click', resetPresence);
    logoutBtn.addEventListener('click', (e) => { e.preventDefault(); if (confirm('Yakin logout?')) { signOut(auth).then(() => window.location.replace('login.html')); } });
    
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'scan.html') document.getElementById('nav-scan').classList.add('active');
    
    checkStatus();
}