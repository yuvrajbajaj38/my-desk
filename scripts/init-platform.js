import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });

try {
  const ref = getFirestore().collection("creditConfig").doc("default");
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      freeSignupCredits: 50,
      proPriceInr: 159,
      proMonthlyCredits: 1000,
      boosterPriceInr: 49,
      boosterCredits: 300,
      aiProvider: "gemini",
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log("Platform settings initialized (existing values preserved).");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
