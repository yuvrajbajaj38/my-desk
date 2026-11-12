import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp({ credential: applicationDefault() });

try {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: node scripts/set-admin.js <verified-admin-email>");
  const user = await getAuth().getUserByEmail(email);
  if (!user.emailVerified) throw new Error("The admin email must be verified before granting admin access.");
  await getAuth().setCustomUserClaims(user.uid, {
    ...(user.customClaims || {}),
    admin: true,
  });
  console.log(`Admin claim granted to ${email}. Sign out and sign in again to refresh the token.`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
