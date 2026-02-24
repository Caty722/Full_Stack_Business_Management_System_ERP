import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyADsc1znw6YMhViJ7jnX5CaeHmWRPjINWg",
    authDomain: "ferwa-one.firebaseapp.com",
    projectId: "ferwa-one",
    storageBucket: "ferwa-one.firebasestorage.app",
    messagingSenderId: "306029222212",
    appId: "1:306029222212:web:781fe9c35977f2c4691f11",
    measurementId: "G-QKE5NXZH9L"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
