// js/laporan.js
document.addEventListener('DOMContentLoaded', () => {
    const startDateEl = document.getElementById('start-date');
    const endDateEl = document.getElementById('end-date');
    const generateBtn = document.getElementById('generate-report-btn');
    const printBtn = document.getElementById('print-btn');
    const reportContentEl = document.getElementById('report-content');

    const getLogs = () => JSON.parse(localStorage.getItem('internshipLogs')) || [];

    generateBtn.addEventListener('click', () => {
        const startDate = startDateEl.value;
        const endDate = endDateEl.value;
        if (!startDate || !endDate) {
            alert("Silakan pilih rentang tanggal terlebih dahulu.");
            return;
        }
        const filteredLogs = getLogs().filter(log => log.tanggal >= startDate && log.tanggal <= endDate);
        if (filteredLogs.length === 0) {
            reportContentEl.innerHTML = `<p class="placeholder">Tidak ada data log pada rentang tanggal yang dipilih.</p>`;
            printBtn.classList.add('hidden');
            return;
        }
        renderReport(filteredLogs, startDate, endDate);
        printBtn.classList.remove('hidden');
    });
    
    printBtn.addEventListener('click', () => {
        window.print();
    });

    const renderReport = (logs, startDate, endDate) => {
        const totalMinutes = logs.reduce((sum, log) => sum + log.durasi.totalMinutes, 0);
        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        
        reportContentEl.innerHTML = `
            <div class="report-title">
                <h2>Laporan Aktivitas Magang</h2>
                <p>Periode: ${new Date(startDate).toLocaleDateString('id-ID', {dateStyle: 'long'})} s/d ${new Date(endDate).toLocaleDateString('id-ID', {dateStyle: 'long'})}</p>
            </div>
            <h3>Ringkasan</h3>
            <table class="summary-table">
                <tr><td>Total Hari Kerja Tercatat</td><td>${logs.length} hari</td></tr>
                <tr><td>Total Jam Kerja</td><td>${totalHours} jam ${remainingMinutes} menit</td></tr>
            </table>
            <h3>Detail Aktivitas</h3>
            <table class="detail-table">
                <thead><tr><th>Tanggal</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Durasi</th><th>Kegiatan</th></tr></thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>${new Date(log.tanggal).toLocaleDateString('id-ID', {dateStyle: 'medium'})}</td>
                            <td>${log.jamMasuk}</td>
                            <td>${log.jamPulang}</td>
                            <td>${log.durasi.text}</td>
                            <td>${log.kegiatan}</td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
    };
});