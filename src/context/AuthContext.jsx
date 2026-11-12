import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, getIdTokenResult } from "firebase/auth";
import { auth } from "../firebase/config";
import { getUserProfile, initializeMissingFields, createUserIfNotExists } from "../services/userservice";
import { getDeviceFingerprint } from "../services/deviceservice";
import { AuthContext } from "./auth-context";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      if (!currentUser) {
        setUser(null);
        setUserProfile(null);
        setProfileLoading(false);
        setProfileError(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setProfileLoading(true);
      setProfileError(null);
      try {
        if (!currentUser.emailVerified) {
          await firebaseSignOut(auth);
          if (active) setProfileError("Verify your email before using your account.");
          return;
        }
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
          setUserProfile({
            name: currentUser.displayName || "Student",
            email: currentUser.email || "",
            photoURL: currentUser.photoURL || "",
            credits: 0,
            totalXP: 0,
            streak: 0,
            plan: "Free Trial",
            trialActive: true,
            role: "student",
          });
        }
      } finally {
        if (active) {
          setProfileLoading(false);
          setLoading(false);
        }
      }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const refreshProfile = useCallback(async () => {
    if (!user?.uid) return;
    const profile = await getUserProfile(user.uid);
    if (!profile) return;
    setUserProfile({
      ...profile,
      name: profile.name?.trim() ? profile.name : (user.displayName || "Student"),
      email: profile.email || user.email || "",
      photoURL: profile.photoURL || user.photoURL || "",
      totalXP: profile.totalXP ?? 0,
      streak: profile.streak ?? 0,
      credits: profile.credits ?? 0,
      globalRank: profile.globalRank ?? 0,
    });
  }, [user]);

  const value = useMemo(() => ({
    user, userProfile, loading, profileLoading, profileError, logout, refreshProfile,
  }), [user, userProfile, loading, profileLoading, profileError, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
