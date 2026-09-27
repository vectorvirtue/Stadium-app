import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logo from "../assets/PROTRACK LOGO 2.svg";
import styles from "./Signup.module.css";
import { api, saveSession } from "../lib/api";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export default function SignUp() {
  const [form, setForm] = useState({ firstName: "", lastName: "", phoneNumber: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault(); setError("");
    if (!passwordPattern.test(form.password)) { setError("Use at least 8 characters, including uppercase, lowercase, a number, and a symbol."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const result = await api("/auth/signup", { method: "POST", body: JSON.stringify({ first_name: form.firstName.trim(), last_name: form.lastName.trim(), phone_number: form.phoneNumber, email: form.email.trim(), password: form.password, confirm_password: form.confirmPassword }) });
      saveSession(result); navigate("/dashboard", { replace: true });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  return <div className={styles.page}><div className={styles.card}>
    <div className={styles.logoWrapper}><img src={logo} alt="ProTrack" className={styles.logo} /></div>
    <h1 className={styles.heading}>Create Your Account</h1><p className={styles.subheading}>Buy tickets and get gate access in one place</p>
    <form className={styles.form} onSubmit={handleSubmit}>
      <input className={styles.input} placeholder="First Name" autoComplete="given-name" value={form.firstName} onChange={update("firstName")} required />
      <input className={styles.input} placeholder="Last Name" autoComplete="family-name" value={form.lastName} onChange={update("lastName")} required />
      <input className={styles.input} type="tel" placeholder="Phone Number" autoComplete="tel" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value.replace(/[^\d+]/g, "").slice(0, 15) }))} minLength={7} maxLength={15} required />
      <input className={styles.input} type="email" placeholder="Email address" autoComplete="email" value={form.email} onChange={update("email")} required />
      <div className={styles.passwordField}>
        <input className={styles.input} type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="new-password" value={form.password} onChange={update("password")} minLength={8} required />
        <button type="button" className={styles.togglePassword} onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} tabIndex={-1}>
          {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
        </button>
      </div>
      <div className={styles.passwordField}>
        <input className={styles.input} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" autoComplete="new-password" value={form.confirmPassword} onChange={update("confirmPassword")} required />
        <button type="button" className={styles.togglePassword} onClick={() => setShowConfirmPassword((v) => !v)} aria-label={showConfirmPassword ? "Hide password" : "Show password"} aria-pressed={showConfirmPassword} tabIndex={-1}>
          {showConfirmPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
        </button>
      </div>
      {error && <p role="alert" style={{ color: "#b42318", margin: 0 }}>{error}</p>}
      <button className={styles.button} type="submit" disabled={busy}>{busy ? "Creating account…" : "Create Account"}</button>
    </form>
    <p className={styles.footer}>Already have an account? <Link to="/" className={styles.link}>Sign In</Link></p>
  </div></div>;
}
