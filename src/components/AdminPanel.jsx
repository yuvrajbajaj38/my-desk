import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";
import "./AdminPanel.css";

const readSettings = httpsCallable(functions, "adminGetSettings");
const saveSettings = httpsCallable(functions, "adminUpdateSettings");
const listUsers = httpsCallable(functions, "adminListUsers");
const changeUser = httpsCallable(functions, "adminUpdateUser");
const saveAiKey = httpsCallable(functions, "adminSetAiKey");
const grantCredits = httpsCallable(functions, "adminGrantCredits");

export default function AdminPanel({ onBack }) {
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [creditAmounts, setCreditAmounts] = useState({});
  const [grantingUid, setGrantingUid] = useState("");
  const refresh = async () => {
    setBusy(true); setError("");
    try {
      const [s, u] = await Promise.all([readSettings(), listUsers({ pageSize: 50 })]);
      setSettings(s.data); setUsers(u.data.users || []);
    } catch (e) { setError(e.message || "Admin access denied."); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    let active = true;
    Promise.all([readSettings(), listUsers({ pageSize: 50 })])
      .then(([s, u]) => {
        if (!active) return;
        setSettings(s.data);
        setUsers(u.data.users || []);
      })
      .catch((e) => {
        if (active) setError(e.message || "Admin access denied.");
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => { active = false; };
  }, []);
  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  const save = async (e) => {
    e.preventDefault(); setMessage(""); setError("");
    try { await saveSettings({ freeSignupCredits: Number(settings.freeSignupCredits), proPriceInr: Number(settings.proPriceInr), proMonthlyCredits: Number(settings.proMonthlyCredits), boosterPriceInr: Number(settings.boosterPriceInr), boosterCredits: Number(settings.boosterCredits), aiProvider: settings.aiProvider, aiModel: settings.aiModel || "", aiBaseUrl: settings.aiBaseUrl || "" }); setMessage("Settings saved."); }
    catch (err) { setError(err.message || "Could not save settings."); }
  };
  const saveKey = async (e) => {
    e.preventDefault(); setError(""); setMessage(""); setSavingKey(true);
    try { await saveAiKey({ apiKey }); setApiKey(""); setMessage("AI key encrypted and saved on the server."); }
    catch (err) { setError(err.message || "Could not save AI key."); }
    finally { setSavingKey(false); }
  };
  const userAction = async (uid, action) => {
    try { await changeUser({ uid, action }); setMessage(`Student ${action} applied.`); await refresh(); }
    catch (e) { setError(e.message || "Student update failed."); }
  };
  const sendCredits = async (uid) => {
    const amount = Number(creditAmounts[uid]);
    if (!Number.isSafeInteger(amount) || amount < 1) {
      setError("Enter a valid credit amount (minimum 1).");
      return;
    }
    setGrantingUid(uid); setError(""); setMessage("");
    try {
      await grantCredits({ uid, amount });
      setMessage(`${amount.toLocaleString()} credits successfully added to student.`);
      setCreditAmounts((prev) => ({ ...prev, [uid]: "" }));
      await refresh();
    } catch (e) {
      setError(e.message || "Credit transfer failed.");
    } finally {
      setGrantingUid("");
    }
  };
  if (busy && !settings) return <section className="rv-admin"><p>Loading secure admin settings…</p></section>;
  return <section className="rv-admin">
    <div className="rv-admin-head"><div><p className="rv-kicker">RANKVAULT CONTROL CENTER</p><h1>Admin Panel</h1><p>Server-verified administrator access</p></div><button onClick={onBack}>← Back</button></div>
    {error && <p className="rv-error">{error}</p>}{message && <p className="rv-success">{message}</p>}
    {settings && <form className="rv-admin-card" onSubmit={save}><h2>Platform & Pricing</h2><div className="rv-admin-grid">
      <label>Free credits for new users<input type="number" min="0" max="100000" value={settings.freeSignupCredits} onChange={e=>update("freeSignupCredits",e.target.value)} /></label>
      <label>Pro price (₹ / month)<input type="number" min="0" value={settings.proPriceInr} onChange={e=>update("proPriceInr",e.target.value)} /></label>
      <label>Pro monthly credits<input type="number" min="0" value={settings.proMonthlyCredits} onChange={e=>update("proMonthlyCredits",e.target.value)} /></label>
      <label>Credit Booster price (₹)<input type="number" min="0" value={settings.boosterPriceInr} onChange={e=>update("boosterPriceInr",e.target.value)} /></label>
      <label>Booster credits<input type="number" min="0" value={settings.boosterCredits} onChange={e=>update("boosterCredits",e.target.value)} /></label>
      <label>AI provider<select value={settings.aiProvider} onChange={e=>update("aiProvider",e.target.value)}><option value="gemini">Google Gemini</option><option value="openai">OpenAI-compatible</option><option value="custom">Custom provider</option></select></label>
      <label>AI model<input type="text" value={settings.aiModel || ""} onChange={e=>update("aiModel",e.target.value)} placeholder="gemini-3.1-flash-lite" /></label>
      <label>AI API base URL<input type="url" value={settings.aiBaseUrl || ""} onChange={e=>update("aiBaseUrl",e.target.value)} placeholder="Provider endpoint (optional)" /></label>
    </div><p className="rv-admin-note">API keys are encrypted on the server using AI_CONFIG_ENCRYPTION_KEY. The raw key is not stored in browser storage or readable Firestore.</p><button className="rv-admin-save" type="submit">Save platform settings</button></form>}
    <form className="rv-admin-card" onSubmit={saveKey}><h2>AI Provider API Key</h2><label>New API key<input type="password" autoComplete="new-password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="Paste new provider API key" minLength={12} required /></label><p className="rv-admin-note">First configure AI_CONFIG_ENCRYPTION_KEY in Firebase Functions Secret Manager (64-character hex value), then deploy Functions. The key is sent to a protected callable and encrypted before storage.</p><button className="rv-admin-save" type="submit" disabled={savingKey || !apiKey}>{savingKey ? "Saving securely…" : "Save encrypted API key"}</button></form>
    <div className="rv-admin-card"><div className="rv-users-title"><h2>Student accounts & credit transfer</h2><button type="button" onClick={refresh}>Refresh</button></div><div className="rv-users-list">{users.map(user=><div className="rv-user-row" key={user.uid}><div><strong>{user.displayName || user.email || "Student"}</strong><small>{user.email} · {user.disabled ? "Disabled" : "Active"} · {Number(user.credits || 0).toLocaleString()} credits</small><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:8}}><input aria-label={"Credits to grant to "+(user.email || user.uid)} type="number" min="1" max="10000000" step="1" placeholder="Credits to add" value={creditAmounts[user.uid] || ""} onChange={e=>setCreditAmounts(prev=>({...prev,[user.uid]:e.target.value}))} style={{width:130}} /><button type="button" disabled={grantingUid===user.uid || !creditAmounts[user.uid]} onClick={()=>sendCredits(user.uid)}>{grantingUid===user.uid ? "Sending…" : "Grant credits"}</button></div></div><button type="button" onClick={()=>userAction(user.uid,user.disabled ? "enable" : "disable")}>{user.disabled ? "Enable" : "Disable"}</button></div>)}</div></div>
  </section>;
}
