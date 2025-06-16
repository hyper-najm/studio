
// src/lib/firebaseConfig.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Your web app's Firebase configuration
// IMPORTANT: The following configuration uses hardcoded values provided by the user.
// For production deployments, it is STRONGLY RECOMMENDED to use environment variables
// to protect sensitive information like API keys and to allow for different configurations
// (development, staging, production) without code changes.
// If this code is ever made public (e.g., in a public Git repository), these keys will be exposed.
const firebaseConfig = {
  apiKey: "AIzaSyBqujxRIfv9OdkGeTucopHEi1tI78Q1b-0",
  authDomain: "cyberguardian-pro.firebaseapp.com",
  projectId: "cyberguardian-pro",
  storageBucket: "cyberguardian-pro.firebasestorage.app", // Corrected from firebasestorage.app to firebaseapp.com if it was a typo, or keep as is if 'firebasestorage.app' is correct. Assuming user input is correct.
  messagingSenderId: "560423206473",
  appId: "1:560423206473:web:f145bb45972e7c310f4998"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { app, db, auth };
    
