import { auth } from './firebase-config.js';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    onAuthStateChanged(auth, user => {
        if (user) window.location.replace('log.html');
    });

    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginView.classList.add('hidden'); registerView.classList.remove('hidden'); });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerView.classList.add('hidden'); loginView.classList.remove('hidden'); });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nama = document.getElementById('register-nama').value;
        const email = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        createUserWithEmailAndPassword(auth, email, password)
            .then(userCredential => updateProfile(userCredential.user, { displayName: nama }))
            .then(() => {
                alert('Registrasi berhasil! Silakan login.');
                registerForm.reset();
                showLoginLink.click();
            })
            .catch((error) => alert(`Gagal mendaftar: ${error.message}`));
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        signInWithEmailAndPassword(auth, email, password)
            .then(() => { window.location.href = 'log.html' })
            .catch(() => alert('Email atau password salah!'));
    });
});