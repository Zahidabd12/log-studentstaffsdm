import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { collection, query, where, getDocs, orderBy, doc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

onAuthStateChanged(auth, user => {
    const loader = document.getElementById('loader');
    const pageContent = document.getElementById('page-content');
    if (user) {
        loader.style.display = 'none';
        pageContent.style.display = 'block';
        runLogApp(user);
    } else {
        window.location.replace('login.html');
    }
});

function runLogApp(currentUser) {
    const logModule = (() => {
        const logForm = document.getElementById('log-form');
        const logTableBody = document.getElementById('log-body');
        const submitBtn = document.getElementById('submit-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        const importBtn = document.getElementById('import-btn');
        const importInput = document.getElementById('import-input');
        const exportJsonBtn = document.getElementById('export-json-btn');
        const exportCsvBtn = document.getElementById('export-csv-btn');
        const logsCollection = collection(db, 'logs');
        let currentEditId = null;

        const getLogs = async () => {
            const q = query(logsCollection, where('userId', '==', currentUser.uid), orderBy('tanggal', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        };
        
        const renderTable = async () => {
            logTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Memuat data...</td></tr>';
            const logs = await getLogs();
            logTableBody.innerHTML = '';
            if (logs.length === 0) {
                logTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada data log.</td></tr>';
            } else {
                logs.forEach(log => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${log.tanggal}</td><td>${log.jamMasuk}</td><td>${log.jamPulang}</td><td>${log.durasi.text}</td><td>${log.kegiatan}</td>
                        <td><div class="action-buttons"><button class="edit-btn" data-id="${log.id}">Edit</button><button class="delete-btn" data-id="${log.id}">Hapus</button></div></td>`;
                    logTableBody.appendChild(tr);
                });
            }
            statsModule.updateStats(logs);
        };
        const resetFormState = () => { /* ... */ };
        logForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const logData = {
                tanggal: document.getElementById('tanggal').value, jamMasuk: document.getElementById('jam-masuk').value,
                jamPulang: document.getElementById('jam-pulang').value, kegiatan: document.getElementById('kegiatan').value,
                durasi: calculateDuration(document.getElementById('jam-masuk').value, document.getElementById('jam-pulang').value)
            };
            if (logData.jamPulang < logData.jamMasuk) { alert("Jam pulang tidak boleh lebih awal!"); return; }
            try {
                if (currentEditId) {
                    await updateDoc(doc(db, "logs", currentEditId), logData);
                } else {
                    await addDoc(logsCollection, { ...logData, userId: currentUser.uid });
                }
                resetFormState(); renderTable();
            } catch (error) { console.error("Error saving log: ", error); }
        });
        logTableBody.addEventListener('click', async (e) => { /* ... */ });
        cancelEditBtn.addEventListener('click', resetFormState);
        const exportToJSON = async () => { /* ... */ };
        const exportToCSV = async () => { /* ... */ };
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', async (e) => { /* ... */ });
        exportJsonBtn.addEventListener('click', exportToJSON);
        exportCsvBtn.addEventListener('click', exportToCSV);
        return { render: renderTable };
    })();
    const statsModule = (() => { /* ... */ })();
    const countdownModule = (() => { /* ... */ })();
    const todoModule = (() => { /* ... */ })();
    logModule.render();
    todoModule.render();
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) { logoutBtn.addEventListener('click', (e) => { e.preventDefault(); if (confirm('Yakin logout?')) { signOut(auth).then(() => window.location.replace('login.html')); } }); }
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'log.html') document.getElementById('nav-log').classList.add('active');
}