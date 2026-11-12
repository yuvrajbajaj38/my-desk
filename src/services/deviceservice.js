import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const getDeviceFingerprint = async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();

  return result.visitorId;
};

export const registerTrustedDevice = async (uid) => {
  const deviceId = await getDeviceFingerprint();

  const browser = navigator.userAgent;

  const deviceRef = doc(
    db,
    "users",
    uid,
    "devices",
    deviceId
  );

  await setDoc(
    deviceRef,
    {
      deviceId,
      browser,
      trusted: true,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    },
    { merge: true }
  );

  return deviceId;
};