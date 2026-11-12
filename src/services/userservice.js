import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";

const getLocalProfileCacheKey = (uid) => `rankvault_profile_${uid}`;

const readLocalProfile = (uid) => {
  try {
    const raw = localStorage.getItem(getLocalProfileCacheKey(uid));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeLocalProfile = (uid, profile) => {
  try {
    localStorage.setItem(getLocalProfileCacheKey(uid), JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
};

export const createUserIfNotExists = async (user, deviceFingerprint) => {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    const profile = snapshot.data();
    writeLocalProfile(user.uid, profile);
    return profile;
  }

  // New profiles and free credits are provisioned only by a trusted callable
  // function. Never grant credits from browser code or a localStorage fallback.
  const { httpsCallable } = await import("firebase/functions");
  const { functions } = await import("../firebase/config");
  const register = httpsCallable(functions, "registerStudentAccount");
  await register({ deviceFingerprint });
  const created = await getDoc(userRef);
  if (!created.exists()) throw new Error("Account setup did not complete. Please try signing in again.");
  const profile = created.data();
  writeLocalProfile(user.uid, profile);
  return profile;
};

export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const profile = userSnap.data();
      writeLocalProfile(uid, profile);
      return profile;
    }

    return readLocalProfile(uid);
  } catch (error) {
    if (error?.code === "permission-denied" || error?.message?.includes("permission")) {
      return readLocalProfile(uid);
    }

    console.error("Error fetching user profile:", error);
    throw error;
  }
};

const PROTECTED_PROFILE_FIELDS = [
  "credits",
  "role",
  "plan",
  "accountStatus",
  "trialActive",
  "streak",
  "totalXP",
  "globalRank",
  "predictedRank",
  "lastActivityDate",
  "paymentStatus",
  "subscriptionStatus",
  "subscriptionId",
];

export const initializeMissingFields = async (uid, fieldsToAdd) => {
  const safeFields = Object.fromEntries(
    Object.entries(fieldsToAdd || {}).filter(([key]) => !PROTECTED_PROFILE_FIELDS.includes(key))
  );

  if (Object.keys(safeFields).length === 0) {
    return true;
  }

  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, safeFields, { merge: true });

    const currentProfile = readLocalProfile(uid) || {};
    writeLocalProfile(uid, { ...currentProfile, ...safeFields });
    return true;
  } catch (error) {
    if (error?.code === "permission-denied" || error?.message?.includes("permission")) {
      const currentProfile = readLocalProfile(uid) || {};
      writeLocalProfile(uid, { ...currentProfile, ...safeFields });
      return true;
    }

    console.error("Error initializing missing fields:", error);
    throw error;
  }
};