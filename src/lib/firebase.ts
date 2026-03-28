// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBkZmkGy9JFUhNCmTIdR72_kEChUh-65n0",
  authDomain: "ecogrid-d908a.firebaseapp.com",
  databaseURL: "https://ecogrid-d908a-default-rtdb.firebaseio.com",
  projectId: "ecogrid-d908a",
  storageBucket: "ecogrid-d908a.firebasestorage.app",
  messagingSenderId: "525605556641",
  appId: "1:525605556641:web:74158eb936ee11d09ffbe0",
  measurementId: "G-6MD3R5E0YC",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

export { app };
