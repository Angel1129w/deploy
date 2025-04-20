import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAHwWUO6kpLBhZaD6sIYDaQWfNmd518w_c",
  authDomain: "qrtixpro-c5aef.firebaseapp.com",
  projectId: "qrtixpro-c5aef",
  storageBucket: "qrtixpro-c5aef.firebasestorage.app",
  messagingSenderId: "1088925158060",
  appId: "1:1088925158060:web:ef41aed3a190cf4f966d09",
  measurementId: "G-XY3B5M4H8T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
