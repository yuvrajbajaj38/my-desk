import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export const getCreditBalance = async (uid) => {
  if (!uid) return { credits: 0, source: "anonymous" };

  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return { credits: 0, source: "missing-profile" };
    return {
      credits: Number(snap.data().credits || 0),
      source: "server",
    };
  } catch {
    return { credits: 0, source: "unavailable" };
  }
};
