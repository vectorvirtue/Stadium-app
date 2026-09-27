import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logo from "../assets/PROTRACK LOGO 2.svg";
import styles from "./Signup.module.css";
import { api, saveSession } from "../lib/api";

export default function SignIn() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const navigate = useNavigate();
  async function handleSubmit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try { const result = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: email.trim(), password }) }); saveSession(result); navigate("/dashboard", { replace: true }); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className={styles.page}><div className={styles.card}>
    <div className={styles.logoWrapper}><img src={logo} alt="ProTrack" className={styles.logo} /></div>
    <h1 className={styles.heading}>Welcome back</h1><p className={styles.subheading}>Login to get your matchday tickets</p>
    <form className={styles.form} onSubmit={handleSubmit}>
      <input className={styles.input} type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <div className={styles.passwordField}>
        <input className={styles.input} type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="button" className={styles.togglePassword} onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} tabIndex={-1}>
          {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
        </button>
      </div>
      {error && <p role="alert" style={{ color: "#b42318", margin: 0 }}>{error}</p>}
      <button className={styles.button} type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign In"}</button>
    </form>
    <p className={styles.footer}>Don't have an account? <Link to="/signup" className={styles.link}>Sign Up</Link></p>
  </div></div>;
}
