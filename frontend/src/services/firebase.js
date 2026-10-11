import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBRutF46Ic-4IkuvpEBTOOy4KNGexZ2NIA",
  authDomain: "dit-campus-swap.firebaseapp.com",
  projectId: "dit-campus-swap",
  storageBucket: "dit-campus-swap.firebasestorage.app",
  messagingSenderId: "229390009752",
  appId: "1:229390009752:web:fef97ff90447cd25d557ed",
  measurementId: "G-1GTGEX023G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
