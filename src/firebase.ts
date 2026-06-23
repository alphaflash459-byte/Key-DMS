import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-Vm_fcJxb06GQ9a0QTX5LTW2o8JJdMXQ",
  authDomain: "majestic-mission-wh7sp.firebaseapp.com",
  projectId: "majestic-mission-wh7sp",
  storageBucket: "majestic-mission-wh7sp.firebasestorage.app",
  messagingSenderId: "887435040134",
  appId: "1:887435040134:web:445823f2d21c93a1980807"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-a638c87c-4fc2-4a27-a53d-eee68a34d9f1");
