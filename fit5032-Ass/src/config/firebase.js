// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAVZzym1GsyW7AkXt2mlS-h6Or-xzcoxY",
  authDomain: "fit5032-ass-39937.firebaseapp.com",
  projectId: "fit5032-ass-39937",
  storageBucket: "fit5032-ass-39937.firebasestorage.app",
  messagingSenderId: "939824897935",
  appId: "1:939824897935:web:8dee651e4af43c8b7435fa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firebase Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
