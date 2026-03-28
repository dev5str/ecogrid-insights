import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/** Web client config (from Firebase console). Lock down with App Check / domain rules in production. */
const firebaseConfig = {
  apiKey: "AIzaSyBkZmkGy9JFUhNCmTIdR72_kEChUh-65n0",
  authDomain: "ecogrid-d908a.firebaseapp.com",
  databaseURL: "https://ecogrid-d908a-default-rtdb.firebaseio.com",
  projectId: "ecogrid-d908a",
  storageBucket: "ecogrid-d908a.firebasestorage.app",
  messagingSenderId: "525605556641",
  appId: "1:525605556641:web:74158eb936ee11d09ffbe0",
  measurementId: "G-6MD3R5E0YC", // for future Analytics; not initialized until used
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export { app };
