document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('presence-status');
    const infoEl = document.getElementById('presence-info');
    const scanBtn = document.getElementById('scan-button');
    const resetBtn = document.getElementById('reset-button');
    const cameraContainer = document.getElementById('camera-container');
    const video = document.getElementById('camera-feed');
    const cancelScanBtn = document.getElementById('cancel-scan-btn');
    let stream = null;

    const getTodayKey = () => `presensi_${new Date().toISOString().slice(0, 10)}`;
    const getLogs = () => JSON.parse(localStorage.getItem('internshipLogs')) || [];
    const saveLogs = (logs) => {
        logs.sort((a, b) => new Date(b.tanggal + 'T' + b.jamMasuk) - new Date(a.tanggal + 'T' + a.jamMasuk));
        localStorage.setItem('internshipLogs', JSON.stringify(logs));
    };

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

    const startScanner = (mode) => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(s => {
                stream = s;
                video.srcObject = stream;
                video.play();
                cameraContainer.classList.remove('hidden');
                document.getElementById('status-display').classList.add('hidden');
                scanBtn.classList.add('hidden');
                requestAnimationFrame(() => tick(mode));
            }).catch(err => alert("Tidak dapat mengakses kamera. Pastikan Anda memberikan izin."));
    };
    
    const stopScanner = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        cameraContainer.classList.add('hidden');
        document.getElementById('status-display').classList.remove('hidden');
        scanBtn.classList.remove('hidden');
    };

    const tick = (mode) => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
            if (code) { handleQRCode(code.data, mode); return; }
        }
        if (stream) { requestAnimationFrame(() => tick(mode)); }
    };

    const handleQRCode = (data, mode) => {
        stopScanner();
        const todayString = new Date().toISOString().slice(0, 10);
        const expectedClockIn = `PRESENSI_MASUK_${todayString}`;
        const expectedClockOut = `PRESENSI_PULANG_${todayString}`;
        const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        if (mode === 'clock-in' && data === expectedClockIn) {
            localStorage.setItem(getTodayKey(), JSON.stringify({ jamMasuk: currentTime, jamPulang: null, logId: null }));
            alert(`Berhasil Clock In pada jam ${currentTime}`);
        } else if (mode === 'clock-out' && data === expectedClockOut) {
            const todayPresence = JSON.parse(localStorage.getItem(getTodayKey()));
            const newLogId = Date.now();
            todayPresence.jamPulang = currentTime;
            todayPresence.logId = newLogId;
            localStorage.setItem(getTodayKey(), JSON.stringify(todayPresence));
            const logs = getLogs();
            logs.push({
                id: newLogId,
                tanggal: todayString,
                jamMasuk: todayPresence.jamMasuk,
                jamPulang: todayPresence.jamPulang,
                durasi: calculateDuration(todayPresence.jamMasuk, todayPresence.jamPulang),
                kegiatan: "Aktivitas harian tercatat melalui presensi QR."
            });
            saveLogs(logs);
            alert(`Berhasil Clock Out pada jam ${currentTime}.`);
        } else {
            alert("QR Code tidak valid atau tidak sesuai.");
        }
        checkStatus();
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
                saveLogs(getLogs().filter(log => log.id !== todayPresence.logId));
            }
            localStorage.removeItem(getTodayKey());
            alert("Presensi hari ini telah direset.");
            checkStatus();
        }
    };

    scanBtn.addEventListener('click', () => {
        const todayPresence = JSON.parse(localStorage.getItem(getTodayKey()));
        if (!todayPresence) { startScanner('clock-in'); } 
        else if (!todayPresence.jamPulang) { startScanner('clock-out'); }
    });
    
    resetBtn.addEventListener('click', resetPresence);
    cancelScanBtn.addEventListener('click', stopScanner);

    checkStatus();
});