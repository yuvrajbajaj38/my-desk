import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase/config";
import "./Auth.css";

export default function Auth({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, cleanEmail, { url: window.location.origin });
        setNotice("Password reset link sent. Check your email inbox and spam folder.");
      } else if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
        await sendEmailVerification(credential.user, { url: window.location.origin });
        await signOut(auth);
        setNotice("Account created. Verify your email, then sign in.");
        setMode("login");
      } else {
        const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        if (!credential.user.emailVerified) {
          await sendEmailVerification(credential.user, { url: window.location.origin });
          await signOut(auth);
          setError("Your email is not verified yet. We sent a fresh verification link. Open it, then sign in again.");
          return;
        }
        onLoginSuccess?.(credential.user);
      }
    } catch (err) {
      const code = err?.code || "";
      const messages = {
        "auth/invalid-credential": "Email or password is incorrect. If this is an older account, use Forgot password to set its Firebase password.",
        "auth/user-not-found": "No Firebase account found with this email. Create an account first.",
        "auth/wrong-password": "Email or password is incorrect. If this is an older account, use Forgot password to set its Firebase password.",
        "auth/email-already-in-use": "This email already has a Firebase account. Use Forgot password to set or reset its password.",
        "auth/weak-password": "Use a password with at least 8 characters.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Wait a while and try again.",
      };
      setError(messages[code] || err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="auth-container">
    <div className="auth-glow auth-glow-1" /><div className="auth-glow auth-glow-2" />
    <div className="auth-card cyber-unveil">
      <div className="auth-header"><h2><span className="sparkle">⚡</span> RankWorld <span className="highlight-brand">AI</span></h2>
        <p>{mode === "signup" ? "Create your student account" : mode === "reset" ? "Reset your password" : "Sign in to your RankWorld AI account"}</p></div>
      {error && <p className="error-text" role="alert">{error}</p>}{notice && <p className="auth-notice" role="status">{notice}</p>}
      <form className="auth-form" onSubmit={submit}>
        {mode === "signup" && <input className="modern-input auth-email-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" autoComplete="name" required />}
        <input className="modern-input auth-email-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" autoComplete="email" required />
        {mode !== "reset" && <input className="modern-input auth-email-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (minimum 8 characters)" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required />}
        <button type="submit" className="btn-primary auth-btn glow-button" disabled={loading}>{loading ? "Please wait…" : mode === "signup" ? "Create Account" : mode === "reset" ? "Send Reset Link" : "Sign In"}</button>
      </form>
      <div className="auth-switches">
        {mode === "login" && <button type="button" onClick={()=>{setMode("reset");setError("");setNotice("");}}>Forgot password?</button>}
        {mode !== "login" && <button type="button" onClick={()=>{setMode("login");setError("");setNotice("");}}>Back to sign in</button>}
        {mode !== "reset" && <button type="button" onClick={()=>{setMode(mode === "signup" ? "login" : "signup");setError("");setNotice("");}}>{mode === "signup" ? "Already have an account? Sign in" : "New here? Create account"}</button>}
      </div>
      <div className="auth-footer"><p>One Firebase account for RankWorld AI and My Study Desk.</p><p>By continuing, you agree to our <span className="highlight-purple">Terms</span> &amp; <span className="highlight-purple">Privacy Policy</span></p></div>
    </div>
  </div>;
}
