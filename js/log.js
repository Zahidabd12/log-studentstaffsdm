document.addEventListener('DOMContentLoaded', () => {

    // APLIKASI LOG HARIAN
    const logModule = (() => {
        const logForm = document.getElementById('log-form');
        const logTableBody = document.getElementById('log-body');
        const submitBtn = document.getElementById('submit-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        const STORAGE_KEY = 'internshipLogs';
        let currentEditId = null;

        const getLogs = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const saveLogs = logs => {
            logs.sort((a, b) => new Date(b.tanggal + 'T' + b.jamMasuk) - new Date(a.tanggal + 'T' + a.jamMasuk));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        };

        const calculateDuration = (startTime, endTime) => {
            const start = new Date(`1970-01-01T${startTime}`);
            const end = new Date(`1970-01-01T${endTime}`);
            if (end < start) return { totalMinutes: 0, text: "0j 0m" };
            const diff = end.getTime() - start.getTime();
            const totalMinutes = Math.floor(diff / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return { totalMinutes, text: `${hours}j ${minutes}m` };
        };

        const renderTable = () => {
            logTableBody.innerHTML = '';
            const logs = getLogs();
            if (logs.length === 0) {
                logTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Belum ada data log.</td></tr>';
            } else {
                logs.forEach(log => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${log.tanggal}</td><td>${log.jamMasuk}</td><td>${log.jamPulang}</td><td>${log.durasi.text}</td><td>${log.kegiatan}</td>
                        <td><div class="action-buttons"><button class="edit-btn" data-id="${log.id}">Edit</button><button class="delete-btn" data-id="${log.id}">Hapus</button></div></td>`;
                    logTableBody.appendChild(tr);
                });
            }
            statsModule.updateStats();
        };

        const resetFormState = () => {
            logForm.reset();
            currentEditId = null;
            submitBtn.textContent = 'Tambah Log';
            submitBtn.classList.remove('update-mode');
            cancelEditBtn.classList.add('hidden');
        };

        logForm.addEventListener('submit', e => {
            e.preventDefault();
            const logData = {
                tanggal: document.getElementById('tanggal').value,
                jamMasuk: document.getElementById('jam-masuk').value,
                jamPulang: document.getElementById('jam-pulang').value,
                kegiatan: document.getElementById('kegiatan').value,
                durasi: calculateDuration(document.getElementById('jam-masuk').value, document.getElementById('jam-pulang').value)
            };
            if (logData.jamPulang < logData.jamMasuk) { alert("Error: Jam pulang tidak boleh lebih awal dari jam masuk."); return; }
            let logs = getLogs();
            if (currentEditId) {
                logs = logs.map(log => log.id === currentEditId ? { ...log, ...logData } : log);
            } else {
                logs.push({ id: Date.now(), ...logData });
            }
            saveLogs(logs);
            resetFormState();
            renderTable();
        });

        logTableBody.addEventListener('click', e => {
            const target = e.target.closest('button');
            if (!target) return;
            const logId = Number(target.dataset.id);
            if (target.classList.contains('edit-btn')) {
                const logToEdit = getLogs().find(log => log.id === logId);
                if (logToEdit) {
                    document.getElementById('tanggal').value = logToEdit.tanggal;
                    document.getElementById('jam-masuk').value = logToEdit.jamMasuk;
                    document.getElementById('jam-pulang').value = logToEdit.jamPulang;
                    document.getElementById('kegiatan').value = logToEdit.kegiatan;
                    currentEditId = logId;
                    submitBtn.textContent = 'Update Log';
                    submitBtn.classList.add('update-mode');
                    cancelEditBtn.classList.remove('hidden');
                    logForm.scrollIntoView({ behavior: 'smooth' });
                }
            } else if (target.classList.contains('delete-btn')) {
                if (confirm('Apakah Anda yakin ingin menghapus log ini?')) {
                    saveLogs(getLogs().filter(log => log.id !== logId));
                    if (currentEditId === logId) resetFormState();
                    renderTable();
                }
            }
        });
        cancelEditBtn.addEventListener('click', resetFormState);
        return { render: renderTable, getLogs };
    })();

    // WIDGET STATISTIK
    const statsModule = (() => {
        const totalLogsEl = document.getElementById('total-logs-stat');
        const totalHoursWeekEl = document.getElementById('total-hours-week-stat');
        const totalHoursMonthEl = document.getElementById('total-hours-month-stat');
        const totalHoursAllEl = document.getElementById('total-hours-all-stat');
        const formatMinutes = (totalMinutes) => {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = Math.round(totalMinutes % 60);
            return `${hours}j ${minutes}m`;
        };
        const updateStats = () => {
            const logs = logModule.getLogs();
            totalLogsEl.textContent = logs.length;
            const now = new Date();
            const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
            firstDayOfWeek.setHours(0, 0, 0, 0);
            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
            lastDayOfWeek.setHours(23, 59, 59, 999);
            const weeklyLogs = logs.filter(log => new Date(log.tanggal) >= firstDayOfWeek && new Date(log.tanggal) <= lastDayOfWeek);
            const weeklyMinutes = weeklyLogs.reduce((sum, log) => sum + log.durasi.totalMinutes, 0);
            totalHoursWeekEl.textContent = formatMinutes(weeklyMinutes);
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyLogs = logs.filter(log => new Date(log.tanggal).getMonth() === currentMonth && new Date(log.tanggal).getFullYear() === currentYear);
            const monthlyMinutes = monthlyLogs.reduce((sum, log) => sum + log.durasi.totalMinutes, 0);
            totalHoursMonthEl.textContent = formatMinutes(monthlyMinutes);
            const allMinutes = logs.reduce((sum, log) => sum + log.durasi.totalMinutes, 0);
            totalHoursAllEl.textContent = formatMinutes(allMinutes);
        };
        return { updateStats };
    })();

    // WIDGET COUNTDOWN
    const countdownModule = (() => {
        const endDate = new Date("August 30, 2025 17:00:00").getTime();
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const update = () => {
            const now = new Date().getTime();
            const distance = endDate - now;
            if (distance < 0) {
                [daysEl, hoursEl, minutesEl].forEach(el => el.textContent = 0);
                return;
            }
            daysEl.textContent = Math.floor(distance / (1000 * 60 * 60 * 24));
            hoursEl.textContent = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            minutesEl.textContent = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        };
        setInterval(update, 60000); update();
    })();

    // WIDGET TO-DO LIST
    const todoModule = (() => {
        const form = document.getElementById('todo-form');
        const input = document.getElementById('todo-input');
        const list = document.getElementById('todo-list');
        const STORAGE_KEY = 'internshipTodos';
        const getTodos = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const saveTodos = todos => localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        const render = () => {
            list.innerHTML = '';
            getTodos().forEach(todo => {
                const li = document.createElement('li');
                li.dataset.id = todo.id;
                li.innerHTML = `<input type="checkbox" ${todo.completed ? 'checked' : ''}><label class="${todo.completed ? 'completed' : ''}">${todo.text}</label><button class="delete-todo">&times;</button>`;
                list.appendChild(li);
            });
        };
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (input.value.trim() === '') return;
            const todos = getTodos();
            todos.push({ id: Date.now(), text: input.value.trim(), completed: false });
            saveTodos(todos); render(); input.value = '';
        });
        list.addEventListener('click', e => {
            const id = Number(e.target.closest('li').dataset.id);
            let todos = getTodos();
            if (e.target.matches('.delete-todo')) {
                todos = todos.filter(t => t.id !== id);
            } else if (e.target.matches('input[type="checkbox"], label')) {
                todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
            }
            saveTodos(todos); render();
        });
        return { render };
    })();

    // INISIALISASI
    logModule.render();
    todoModule.render();
});