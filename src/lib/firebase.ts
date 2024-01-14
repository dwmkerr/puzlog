import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";

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

export function init() {
  const app = initializeApp(firebaseConfig);

  //  Setup auth and the emulator.
  const auth = getAuth();
  // connectAuthEmulator(auth, "http://127.0.0.1:9099");

  return {
    app,
    auth,
  };
}

export async function loginWithGoogleOAuth2(token: string) {
  try {
    const { auth } = init();
    const credential = GoogleAuthProvider.credential(null, token);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}
