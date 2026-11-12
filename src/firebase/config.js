import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { firebaseWebConfig, functionsRegion, isFirebaseConfigured } from "../config/env";

if (!isFirebaseConfigured) {
  console.warn(
    "Firebase web config is missing. Set VITE_FIREBASE_* variables in .env.local."
  );
}

const app = initializeApp(firebaseWebConfig);
export { firebaseWebConfig };

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
if (appCheckSiteKey && typeof window !== "undefined") {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, functionsRegion);
export const storage = getStorage(app);

export default app;
