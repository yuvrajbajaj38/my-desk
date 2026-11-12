#!/usr/bin/env node
/**
 * One-time, owner-operated Firebase admin provisioning.
 * Run locally with Application Default Credentials for the correct Firebase project.
 * Never run this from the browser, expose service-account JSON, or commit credentials.
 *
 * Usage:
 *   GOOGLE_CLOUD_PROJECT=your-firebase-project-id \
 *     node scripts/grant-admin.js <firebase-uid> <expected-email>
 */
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

async function main() {
  const [uid, expectedEmail] = process.argv.slice(2);
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!projectId || !uid || !expectedEmail) {
    throw new Error('Set GOOGLE_CLOUD_PROJECT and provide <firebase-uid> <expected-email>.');
  }
  initializeApp({ credential: applicationDefault(), projectId });
  const auth = getAuth();
  const user = await auth.getUser(uid);
  if (user.disabled) throw new Error('Refusing to grant admin to a disabled user.');
  if ((user.email || '').toLowerCase() !== expectedEmail.trim().toLowerCase()) {
    throw new Error('UID/email mismatch. No changes made.');
  }
  if (user.customClaims?.admin === true) {
    console.log('Admin claim already set for verified UID/email.');
    return;
  }
  await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), admin: true });
  console.log('Admin claim granted. Sign out and sign in again to refresh the Firebase ID token.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
