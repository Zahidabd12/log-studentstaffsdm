// Import fungsi yang diperlukan dari SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Konfigurasi Firebase dari proyek Anda
const firebaseConfig = {
  apiKey: "AIzaSyAx4LzXuuoWlXZyHANk53OQsPaJTIgA87I",
  authDomain: "internship-logbook-eadfa.firebaseapp.com",
  projectId: "internship-logbook-eadfa",
  storageBucket: "internship-logbook-eadfa.appspot.com",
  messagingSenderId: "129663315307",
  appId: "1:129663315307:web:c698a46cd86f7ca6aff02e"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor layanan Firebase yang akan digunakan di file lain
export const auth = getAuth(app);
export const db = getFirestore(app);