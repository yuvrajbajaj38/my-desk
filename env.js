const readEnv = (key, fallback = "") => {
  const value = import.meta.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

export const firebaseWebConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY", "AIzaSyCEYwRVLcjKIhuIR9L8FYm6Q3M63luqAeg"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN", "rankvault-ai.firebaseapp.com"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID", "rankvault-ai"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET", "rankvault-ai.firebasestorage.app"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "965581142213"),
  appId: readEnv("VITE_FIREBASE_APP_ID", "1:965581142213:web:a8693093b4b548ebfc18ac"),
  measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID", "G-93QTMX3ESZ"),
};

export const functionsRegion = readEnv("VITE_FIREBASE_FUNCTIONS_REGION", "us-central1");
export const razorpayKeyId = readEnv("VITE_RAZORPAY_KEY_ID");
export const isFirebaseConfigured = Boolean(
  firebaseWebConfig.apiKey && firebaseWebConfig.projectId && firebaseWebConfig.appId
);
export const isPaymentConfigured = Boolean(razorpayKeyId);
