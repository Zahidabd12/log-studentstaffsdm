import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

onAuthStateChanged(auth, user => {
    const loader = document.getElementById('loader');
    const pageContent = document.getElementById('page-content');
    if (user) {
        loader.style.display = 'none';
        pageContent.style.display = 'block';
        runLaporanApp(user);
    } else {
        window.location.replace('login.html');
    }
});

function runLaporanApp(currentUser) {
    const startDateEl = document.getElementById('start-date');
    const endDateEl = document.getElementById('end-date');
    const generateBtn = document.getElementById('generate-report-btn');
    const printBtn = document.getElementById('print-btn');
    const reportContentEl = document.getElementById('report-content');

    generateBtn.addEventListener('click', async () => {
        const startDate = startDateEl.value;
        const endDate = endDateEl.value;
        if (!startDate || !endDate) { alert("Pilih rentang tanggal."); return; }
        reportContentEl.innerHTML = `<p class="placeholder">Membuat laporan...</p>`;
        
        try {
            const q = query(collection(db, "logs"), where('userId', '==', currentUser.uid), where('tanggal', '>=', startDate), where('tanggal', '<=', endDate), orderBy('tanggal', 'asc'));
            const querySnapshot = await getDocs(q);
            const filteredLogs = querySnapshot.docs.map(doc => doc.data());

            if (filteredLogs.length === 0) {
                reportContentEl.innerHTML = `<p class="placeholder">Tidak ada data log pada rentang tanggal yang dipilih.</p>`;
                printBtn.classList.add('hidden');
                return;
            }
            renderReport(filteredLogs, startDate, endDate);
            printBtn.classList.remove('hidden');
        } catch (error) {
            console.error("Error generating report: ", error);
            reportContentEl.innerHTML = `<p class="placeholder" style="color: red;">Gagal membuat laporan. Pastikan Anda sudah membuat index di Firestore.</p>`;
        }
    });
    
    printBtn.addEventListener('click', () => window.print());

    const renderReport = (logs, startDate, endDate) => {
        const totalMinutes = logs.reduce((sum, log) => sum + (log.durasi.totalMinutes || 0), 0);
        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        reportContentEl.innerHTML = `
            <div class="report-title"><h2>Laporan Aktivitas Magang</h2><p>Periode: ${new Date(startDate).toLocaleDateString('id-ID', {dateStyle: 'long'})} s/d ${new Date(endDate).toLocaleDateString('id-ID', {dateStyle: 'long'})}</p></div>
            <h3>Ringkasan</h3><table class="summary-table"><tr><td>Total Hari Kerja</td><td>${logs.length} hari</td></tr><tr><td>Total Jam Kerja</td><td>${totalHours} jam ${remainingMinutes} menit</td></tr></table>
            <h3>Detail Aktivitas</h3><table class="detail-table"><thead><tr><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Durasi</th><th>Kegiatan</th></tr></thead>
            <tbody>${logs.map(log => `<tr><td>${new Date(log.tanggal).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long'})}</td><td>${log.jamMasuk}</td><td>${log.jamPulang}</td><td>${log.durasi.text}</td><td>${log.kegiatan}</td></tr>`).join('')}</tbody></table>`;
    };
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) { logoutBtn.addEventListener('click', (e) => { e.preventDefault(); if (confirm('Yakin logout?')) { signOut(auth).then(() => window.location.replace('login.html')); } }); }
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'laporan.html') document.getElementById('nav-laporan').classList.add('active');
}