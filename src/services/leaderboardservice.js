import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const getPublicLeaderboard = async (max = 10) => {
  try {
    const snap = await getDocs(
      query(collection(db, "publicLeaderboard"), orderBy("xp", "desc"), limit(max))
    );
    return snap.docs.map((item, index) => {
      const data = item.data();
      // Do not expose raw UID to normal users. Use a stable public id instead.
      const safe = { ...data };
      delete safe.uid;
      return {
        id: item.id,
        rank: index + 1,
        ...safe,
      };
    });
  } catch {
    return [];
  }
};