import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
// import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  Firestore,
} from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAy-ANZoEBRhB43WXaQ7FCjYX4-Vo3T5s8",
  authDomain: "puzlog.firebaseapp.com",
  projectId: "puzlog",
  storageBucket: "puzlog.appspot.com",
  messagingSenderId: "1076573815185",
  appId: "1:1076573815185:web:36e623b00cc43fb71d5a30",
  measurementId: "G-BZYWGBHV98",
};

// export async function loginWithGoogleOAuth2(token: string) {
//   try {
//     const { auth } = init();
//     const credential = GoogleAuthProvider.credential(null, token);
//     const result = await signInWithCredential(auth, credential);
//     return result.user;
//   } catch (error) {
//     console.error("Login error:", error);
//     return null;
//   }
// }

export class PuzlogFirebase {
  private static instance: PuzlogFirebase;
  public app: FirebaseApp;
  public auth: Auth;
  public db: Firestore;

  private constructor(app: FirebaseApp, auth: Auth, db: Firestore) {
    this.app = app;
    this.auth = auth;
    this.db = db;
  }

  public static get(): PuzlogFirebase {
    if (!PuzlogFirebase.instance) {
      const app = initializeApp(firebaseConfig);

      //  Setup auth and the emulator.
      const auth = getAuth();
      const db = getFirestore();
      connectFirestoreEmulator(db, "127.0.0.1", 8080);

      PuzlogFirebase.instance = new PuzlogFirebase(app, auth, db);
    }

    return PuzlogFirebase.instance;
  }
}
