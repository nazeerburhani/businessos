// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGwvDem3yUANPSBfSPX6gQFuJOT3naVRc",
  authDomain: "noor-student-pro.firebaseapp.com",
  projectId: "noor-student-pro",
  storageBucket: "noor-student-pro.firebasestorage.app",
  messagingSenderId: "172535349010",
  appId: "1:172535349010:web:d5d930c81b395e2d057dcb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
