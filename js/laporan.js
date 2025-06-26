import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, user => {
        if (user) {
            runLaporanApp(user);
        } else {
            window.location.replace('login.html');
        }
    });
});

function runLaporanApp(currentUser) {
    // ... (kode dari jawaban firebase sebelumnya, sudah modular) ...
    
    // Navigasi & Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) { logoutBtn.addEventListener('click', (e) => { e.preventDefault(); if (confirm('Yakin logout?')) { signOut(auth).then(() => window.location.replace('login.html')); } }); }
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'laporan.html') document.getElementById('nav-laporan').classList.add('active');
}