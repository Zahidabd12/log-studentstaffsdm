import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { collection, query, where, getDocs, orderBy, doc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, user => {
        if (user) {
            runLogApp(user);
        } else {
            window.location.replace('login.html');
        }
    });
});

function runLogApp(currentUser) {
    const logModule = (() => { /* ... (kode dari jawaban firebase sebelumnya, sudah modular) ... */ })();
    const statsModule = (() => { /* ... (kode dari jawaban firebase sebelumnya, sudah modular) ... */ })();
    const countdownModule = (() => { /* ... (kode dari jawaban firebase sebelumnya, sudah modular) ... */ })();
    const todoModule = (() => { /* ... (kode dari jawaban firebase sebelumnya, sudah modular) ... */ })();
    logModule.render();
    todoModule.render();

    // Navigasi & Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) { logoutBtn.addEventListener('click', (e) => { e.preventDefault(); if (confirm('Yakin logout?')) { signOut(auth).then(() => window.location.replace('login.html')); } }); }
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'log.html') document.getElementById('nav-log').classList.add('active');
}