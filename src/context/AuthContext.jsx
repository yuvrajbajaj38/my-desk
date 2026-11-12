import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithCustomToken, signOut as firebaseSignOut, getIdTokenResult } from "firebase/auth";
import { auth, firebaseWebConfig } from "../firebase/config";
import { supabase } from "../supabase/client";
import { getUserProfile, initializeMissingFields, createUserIfNotExists } from "../services/userservice";
import { getDeviceFingerprint } from "../services/deviceservice";
import { AuthContext } from "./auth-context";

async function bridgeSupabaseSession(session) {
  if (!session?.access_token) { await firebaseSignOut(auth); return null; }
  const projectId = firebaseWebConfig.projectId;
  if (!projectId) throw new Error("VITE_FIREBASE_PROJECT_ID is missing.");
  const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1";
  const response = await fetch(`https://${region}-${projectId}.cloudfunctions.net/exchangeSupabaseToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: "{}",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.customToken) throw new Error(result.error || "Could not connect your Supabase account to RankWorld services.");
  const credential = await signInWithCustomToken(auth, result.customToken);
  return credential.user;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    let active = true;
    let bridgeQueue = Promise.resolve();
    const syncSupabase = (session) => {
      // Serialize sign-in/sign-out exchanges so a slow token request cannot
      // resurrect a Firebase session after the user has signed out.
      bridgeQueue = bridgeQueue.then(async () => {
        if (!active) return;
        try {
          if (!session) {
            await firebaseSignOut(auth);
            if (active) { setUser(null); setUserProfile(null); setLoading(false); }
            return;
          }
          const { data } = await supabase.auth.getSession();
          if (!data.session || data.session.user.id !== session.user.id) return;
          await bridgeSupabaseSession(session);
          const latest = await supabase.auth.getSession();
          if (!latest.data.session || latest.data.session.user.id !== session.user.id) {
            await firebaseSignOut(auth);
          }
        } catch (error) {
          console.error("Single-login session bridge failed:", error);
          if (active) { setProfileError(error.message); setLoading(false); }
        }
      });
      return bridgeQueue;
    };
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      return syncSupabase(data.session);
    }).catch((error) => { if (active) { setProfileError(error.message); setLoading(false); } });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer work outside Supabase's auth callback to avoid locking its client.
      Promise.resolve().then(() => syncSupabase(session));
    });
    const unsubscribeFirebase = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      if (!currentUser) {
        setUser(null); setUserProfile(null);
        const { data } = await supabase.auth.getSession();
        if (!data.session) setLoading(false);
        return;
      }
      setUser(currentUser); setProfileLoading(true); setProfileError(null);
      try {
        const tokenResult = await getIdTokenResult(currentUser, true);
        const isAdmin = tokenResult.claims.admin === true;
        let profile = await getUserProfile(currentUser.uid);
        if (!profile) {
          const deviceFingerprint = await getDeviceFingerprint();
          profile = await createUserIfNotExists(currentUser, deviceFingerprint);
        }
        const enrichedProfile = {
          ...profile,
          role: isAdmin ? "admin" : "student",
          name: profile.name?.trim() ? profile.name : (currentUser.displayName || "Student"),
          email: profile.email || currentUser.email || "",
          photoURL: profile.photoURL || currentUser.photoURL || "",
          totalXP: profile.totalXP ?? 0,
          streak: profile.streak ?? 0,
          credits: profile.credits ?? 0,
        };
        if (active) setUserProfile(enrichedProfile);
        const fieldsToAdd = {};
        if (!profile.name?.trim() && currentUser.displayName) fieldsToAdd.name = currentUser.displayName;
        if (!profile.email) fieldsToAdd.email = currentUser.email || "";
        if (!profile.photoURL && currentUser.photoURL) fieldsToAdd.photoURL = currentUser.photoURL;
        if (Object.keys(fieldsToAdd).length) await initializeMissingFields(currentUser.uid, fieldsToAdd);
      } catch (error) {
        if (active) {
          setProfileError(error.message);
          setUserProfile({ name: currentUser.displayName || "Student", email: currentUser.email || "", photoURL: currentUser.photoURL || "", credits: 0, totalXP: 0, streak: 0, plan: "Free Trial", trialActive: true, role: "student" });
        }
      } finally { if (active) { setProfileLoading(false); setLoading(false); } }
    });
    return () => { active = false; authListener.subscription.unsubscribe(); unsubscribeFirebase(); };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    await firebaseSignOut(auth);
    setUser(null); setUserProfile(null);
  };

  const refreshProfile = useCallback(async () => {
    if (!user?.uid) return;
    const profile = await getUserProfile(user.uid);
    if (!profile) return;
    setUserProfile({ ...profile, name: profile.name?.trim() ? profile.name : (user.displayName || "Student"), email: profile.email || user.email || "", photoURL: profile.photoURL || user.photoURL || "", totalXP: profile.totalXP ?? 0, streak: profile.streak ?? 0, credits: profile.credits ?? 0, globalRank: profile.globalRank ?? 0 });
  }, [user]);

  const value = useMemo(() => ({ user, userProfile, loading, profileLoading, profileError, logout, refreshProfile }), [user, userProfile, loading, profileLoading, profileError, refreshProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
