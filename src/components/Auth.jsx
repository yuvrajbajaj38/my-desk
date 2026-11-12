import { useState } from "react";
import "./Auth.css";
import { supabase } from "../supabase/client";

export default function Auth({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (event) => {
    event.preventDefault(); setError(""); setNotice(""); setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: `${window.location.origin}/rankvault/` });
        if (resetError) throw resetError;
        setNotice("Password reset link sent. Check your email.");
      } else if (mode === "signup") {
        const { error: signupError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/rankvault/` },
        });
        if (signupError) throw signupError;
        setNotice("Account created. Verify your email, then sign in using the same account on My Study Desk and RankWorld AI.");
        setMode("login");
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (loginError) throw loginError;
        if (!data.session) throw new Error("Sign-in succeeded but no session was returned. Try again.");
        onLoginSuccess?.(data.user);
      }
    } catch (err) {
      const message = String(err.message || "Authentication failed.");
      setError(message.includes("Invalid login credentials") ? "Email or password is incorrect." : message);
    } finally { setLoading(false); }
  };

  return <div className="auth-container">
    <div className="auth-glow auth-glow-1" /><div className="auth-glow auth-glow-2" />
    <div className="auth-card cyber-unveil">
      <div className="auth-header"><h2><span className="sparkle">⚡</span> RankWorld <span className="highlight-brand">AI</span></h2>
        <p>{mode === "signup" ? "Create your student account" : mode === "reset" ? "Reset your password" : "Sign in to your RankWorld AI account"}</p></div>
      {error && <p className="error-text">{error}</p>}{notice && <p className="auth-notice">{notice}</p>}
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
      <div className="auth-footer"><p>One account for My Study Desk and RankWorld AI.</p><p>By continuing, you agree to our <span className="highlight-purple">Terms</span> &amp; <span className="highlight-purple">Privacy Policy</span></p></div>
    </div>
  </div>;
}
