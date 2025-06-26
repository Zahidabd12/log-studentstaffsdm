import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
// getDoc ditambahkan untuk mengambil satu dokumen
import { collection, query, where, getDocs, orderBy, doc, addDoc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Penjaga Halaman
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

// Seluruh logika aplikasi sekarang dibungkus dalam satu fungsi utama
function runLogApp(currentUser) {
    // --- MODUL LOG UTAMA ---
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
            try {
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
            } catch (error) {
                console.error("Error fetching logs: ", error);
                logTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Gagal memuat data. Klik F12 dan cek Console untuk detail error.</td></tr>`;
            }
        };

        const calculateDuration = (startTime, endTime) => {
            const start = new Date(`1970-01-01T${startTime}`); const end = new Date(`1970-01-01T${endTime}`);
            if (end < start) return { totalMinutes: 0, text: "0j 0m" };
            const diff = end.getTime() - start.getTime(); const totalMinutes = Math.floor(diff / 60000);
            const hours = Math.floor(totalMinutes / 60); const minutes = totalMinutes % 60;
            return { totalMinutes, text: `${hours}j ${minutes}m` };
        };

        const resetFormState = () => {
            logForm.reset(); currentEditId = null;
            submitBtn.textContent = 'Tambah Log';
            submitBtn.classList.remove('update-mode');
            cancelEditBtn.classList.add('hidden');
        };

        logForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const logData = {
                tanggal: document.getElementById('tanggal').value, jamMasuk: document.getElementById('jam-masuk').value,
                jamPulang: document.getElementById('jam-pulang').value, kegiatan: document.getElementById('kegiatan').value,
                durasi: calculateDuration(document.getElementById('jam-masuk').value, document.getElementById('jam-pulang').value)
            };
            if (logData.jamPulang < logData.jamMasuk) { alert("Jam pulang tidak boleh lebih awal!"); return; }
            
            submitBtn.disabled = true;
            try {
                if (currentEditId) {
                    await updateDoc(doc(db, "logs", currentEditId), logData);
                } else {
                    await addDoc(logsCollection, { ...logData, userId: currentUser.uid });
                }
                resetFormState();
                await renderTable();
            } catch (error) {
                console.error("Error saving log: ", error);
                alert("Gagal menyimpan log!");
            } finally {
                submitBtn.disabled = false;
            }
        });

        logTableBody.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const logId = target.dataset.id;

            // --- BLOK EDIT YANG SUDAH DIPERBAIKI ---
            if (target.classList.contains('edit-btn')) {
                try {
                    const docRef = doc(db, "logs", logId);
                    const docSnap = await getDoc(docRef); // Menggunakan getDoc untuk satu dokumen

                    if (docSnap.exists()) {
                        const logToEdit = docSnap.data();
                        document.getElementById('tanggal').value = logToEdit.tanggal;
                        document.getElementById('jam-masuk').value = logToEdit.jamMasuk;
                        document.getElementById('jam-pulang').value = logToEdit.jamPulang;
                        document.getElementById('kegiatan').value = logToEdit.kegiatan;
                        currentEditId = logId;
                        submitBtn.textContent = 'Update Log';
                        submitBtn.classList.add('update-mode');
                        cancelEditBtn.classList.remove('hidden');
                        logForm.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        alert("Log tidak ditemukan!");
                    }
                } catch(error) {
                    console.error("Gagal mengambil data untuk diedit:", error);
                    alert("Gagal mengambil data untuk diedit.");
                }
            } else if (target.classList.contains('delete-btn')) {
                if (confirm('Yakin ingin menghapus log ini?')) {
                    try {
                        await deleteDoc(doc(db, "logs", logId));
                        if (currentEditId === logId) resetFormState();
                        await renderTable();
                    } catch(error) {
                        console.error("Gagal menghapus log:", error);
                        alert("Gagal menghapus log.");
                    }
                }
            }
        });
        
        cancelEditBtn.addEventListener('click', resetFormState);
        
        // --- FUNGSI IMPORT/EXPORT LENGKAP ---
        const exportToJSON = async () => {
            const logs = await getLogs();
            if (logs.length === 0) { alert('Tidak ada data untuk diekspor.'); return; }
            const dataStr = JSON.stringify(logs, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `log_magang_${currentUser.displayName}_${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            URL.revokeObjectURL(url);
            link.remove();
        };

        const exportToCSV = async () => {
            const logs = await getLogs();
            if (logs.length === 0) { alert('Tidak ada data untuk diekspor.'); return; }
            const headers = ['ID', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Durasi Kerja', 'Kegiatan'];
            const csvRows = logs.map(log => [log.id, log.tanggal, log.jamMasuk, log.jamPulang, log.durasi.text, `"${log.kegiatan.replace(/"/g, '""')}"`].join(','));
            const csvString = [headers.join(','), ...csvRows].join('\n');
            const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `log_magang_${currentUser.displayName}_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            link.remove();
        };

        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            if (!confirm("Yakin impor data? Ini akan MENAMBAHKAN log dari file ke data Anda yang sudah ada.")) { importInput.value = ""; return; }
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedLogs = JSON.parse(event.target.result);
                    if (!Array.isArray(importedLogs)) throw new Error("Format file JSON tidak valid.");
                    
                    // Tambahkan setiap log dari file ke firestore
                    for (const log of importedLogs) {
                        const { id, ...logData } = log; // Hapus id lama agar Firestore membuat yg baru
                        await addDoc(logsCollection, { ...logData, userId: currentUser.uid });
                    }
                    
                    alert(`${importedLogs.length} log berhasil diimpor!`);
                    await renderTable();
                } catch (error) { alert(`Gagal mengimpor file: ${error.message}`); }
                finally { importInput.value = ""; }
            };
            reader.readAsText(file);
        });

        exportJsonBtn.addEventListener('click', exportToJSON);
        exportCsvBtn.addEventListener('click', exportToCSV);

        return { render: renderTable };
    })();

    // --- MODUL STATISTIK ---
    const statsModule = (() => {
        const totalLogsEl = document.getElementById('total-logs-stat');
        const totalHoursWeekEl = document.getElementById('total-hours-week-stat');
        const totalHoursMonthEl = document.getElementById('total-hours-month-stat');
        const totalHoursAllEl = document.getElementById('total-hours-all-stat');
        const formatMinutes = (totalMinutes) => {
            const hours = Math.floor(totalMinutes / 60); const minutes = Math.round(totalMinutes % 60);
            return `${hours}j ${minutes}m`;
        };
        const updateStats = (logs) => {
            totalLogsEl.textContent = logs.length;
            const now = new Date();
            const firstDayOfWeek = new Date(new Date().setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
            firstDayOfWeek.setHours(0, 0, 0, 0);
            const lastDayOfWeek = new Date(firstDayOfWeek); lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
            lastDayOfWeek.setHours(23, 59, 59, 999);
            const weeklyLogs = logs.filter(log => new Date(log.tanggal) >= firstDayOfWeek && new Date(log.tanggal) <= lastDayOfWeek);
            const weeklyMinutes = weeklyLogs.reduce((sum, log) => sum + log.durasi.totalMinutes, 0);
            totalHoursWeekEl.textContent = formatMinutes(weeklyMinutes);
            const currentMonth = new Date().getMonth(); const currentYear = new Date().getFullYear();
            const monthlyLogs = logs.filter(log => new Date(log.tanggal).getMonth() === currentMonth && new Date(log.tanggal).getFullYear() === currentYear);
            const monthlyMinutes = monthlyLogs.reduce((sum, log) => sum + log.durasi.totalMinutes, 0);
            totalHoursMonthEl.textContent = formatMinutes(monthlyMinutes);
            const allMinutes = logs.reduce((sum, log) => sum + log.durasi.totalMinutes, 0);
            totalHoursAllEl.textContent = formatMinutes(allMinutes);
        };
        return { updateStats };
    })();
    
    // --- MODUL COUNTDOWN ---
    const countdownModule = (() => {
        const endDate = new Date("August 31, 2025 17:00:00").getTime();
        const daysEl = document.getElementById('days'); const hoursEl = document.getElementById('hours'); const minutesEl = document.getElementById('minutes');
        const update = () => {
            const now = new Date().getTime(); const distance = endDate - now;
            if (distance < 0) { [daysEl, hoursEl, minutesEl].forEach(el => el.textContent = 0); return; }
            daysEl.textContent = Math.floor(distance / 86400000);
            hoursEl.textContent = Math.floor((distance % 86400000) / 3600000);
            minutesEl.textContent = Math.floor((distance % 3600000) / 60000);
        };
        setInterval(update, 60000); update();
    })();

    // --- MODUL TO-DO LIST ---
    const todoModule = (() => {
        const form = document.getElementById('todo-form'); const input = document.getElementById('todo-input');
        const list = document.getElementById('todo-list'); const STORAGE_KEY = `internshipTodos_${currentUser.uid}`;
        const getTodos = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const saveTodos = todos => localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        const render = () => {
            list.innerHTML = '';
            getTodos().forEach(todo => {
                const li = document.createElement('li'); li.dataset.id = todo.id;
                li.innerHTML = `<input type="checkbox" ${todo.completed ? 'checked' : ''}><label class="${todo.completed ? 'completed' : ''}">${todo.text}</label><button class="delete-todo">&times;</button>`;
                list.appendChild(li);
            });
        };
        form.addEventListener('submit', e => {
            e.preventDefault(); if (input.value.trim() === '') return;
            const todos = getTodos(); todos.push({ id: Date.now(), text: input.value.trim(), completed: false });
            saveTodos(todos); render(); input.value = '';
        });
        list.addEventListener('click', e => {
            const id = Number(e.target.closest('li').dataset.id); let todos = getTodos();
            if (e.target.matches('.delete-todo')) { todos = todos.filter(t => t.id !== id); }
            else if (e.target.matches('input[type="checkbox"], label')) { todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t); }
            saveTodos(todos); render();
        });
        return { render };
    })();
    
    // INISIALISASI
    logModule.render();
    todoModule.render();

    // NAVIGASI & LOGOUT
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) { logoutBtn.addEventListener('click', (e) => { e.preventDefault(); if (confirm('Yakin logout?')) { signOut(auth).then(() => window.location.replace('login.html')); } }); }
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'log.html') document.getElementById('nav-log').classList.add('active');
}