// lib/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Je Firebase-configuratie
const firebaseConfig = {
    apiKey: "AIzaSyDhf6BefhwOz4brZMu8jgf9rrC764cHq_c",
    authDomain: "recepten-5c9ee.firebaseapp.com",
    projectId: "recepten-5c9ee",
    storageBucket: "recepten-5c9ee.appspot.com",
    messagingSenderId: "598316647789",
    appId: "1:598316647789:web:563ab76b6a3cf34f088664",
    measurementId: "G-23MJ4GKZ08"
};

// Initialiseer Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const firestore = getFirestore(app);

export { firestore, storage, ref, uploadBytes, getDownloadURL };
