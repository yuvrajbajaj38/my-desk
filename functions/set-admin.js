const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const projectId = process.env.GOOGLE_CLOUD_PROJECT || "rankvault-ai";
const [uid, expectedEmail] = process.argv.slice(2);

async function main() {
  if (!uid || !expectedEmail) {
    throw new Error("Usage: node set-admin.js <firebase-uid> <verified-email>");
  }

  initializeApp({ credential: applicationDefault(), projectId });
  const auth = getAuth();
  const user = await auth.getUser(uid);

  if ((user.email || "").toLowerCase() !== expectedEmail.trim().toLowerCase()) {
    throw new Error("UID/email mismatch. No changes made.");
  }
  if (!user.emailVerified) {
    throw new Error("Email is not verified. Verify it before granting admin access.");
  }
  if (user.disabled) {
    throw new Error("Account is disabled. No changes made.");
  }

  await auth.setCustomUserClaims(uid, {
    ...(user.customClaims || {}),
    admin: true,
  });

  console.log(`Admin claim granted in project ${projectId} to verified user ${expectedEmail} (${uid}). Sign out and sign in again to refresh the token.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
