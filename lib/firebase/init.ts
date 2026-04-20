import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAyLOhLGzNeBABgQkj2gXNjFRy0-2vIKPM",
  authDomain: "veterans-archive.firebaseapp.com",
  projectId: "veterans-archive",
  storageBucket: "veterans-archive.firebasestorage.app",
  messagingSenderId: "405651944619",
  appId: "1:405651944619:web:30d5de85c90f34f5ae33ee",
  measurementId: "G-WC5WN8FS61"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, provider, db, storage };