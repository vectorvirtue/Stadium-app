import { useEffect, useState } from "react";
import { api } from "../lib/api";
import styles from "./Profile.module.css";

export default function Profile() {
  const [profile, setProfile] = useState({ first_name: "", last_name: "", phone_number: "", email: "" });
  const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { api("/profile").then(setProfile).catch((e) => setError(e.message)); }, []);
  async function saveProfile(event) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try { const updated = await api("/profile", { method: "PATCH", body: JSON.stringify(profile) }); setProfile(updated); localStorage.setItem("user", JSON.stringify(updated)); setMessage("Profile saved."); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function savePassword(event) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try { const result = await api("/profile/change-password", { method: "POST", body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }); setMessage(result.detail || "Password updated."); setCurrentPassword(""); setNewPassword(""); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const change = (key) => (event) => setProfile((p) => ({ ...p, [key]: event.target.value }));
  return <section className={styles.profile}><h1>Your Profile</h1><p>Update your account details.</p>{error && <p role="alert" className={styles.error}>{error}</p>}{message && <p role="status" className={styles.success}>{message}</p>}
    <form onSubmit={saveProfile} className={styles.form}>
      <label>First Name<input value={profile.first_name} onChange={change("first_name")} required /></label>
      <label>Last Name<input value={profile.last_name} onChange={change("last_name")} required /></label>
      <label>Phone Number<input type="tel" value={profile.phone_number} onChange={change("phone_number")} minLength={7} maxLength={15} required /></label>
      <label>Email address<input type="email" value={profile.email} onChange={change("email")} required /></label>
      <button disabled={busy}>{busy ? "Saving…" : "Save Changes"}</button>
    </form>
    <h2>Change password</h2><form onSubmit={savePassword} className={styles.form}>
      <label>Current Password<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></label>
      <label>New Password<input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></label>
      <button disabled={busy || newPassword.length < 8}>{busy ? "Saving…" : "Update Password"}</button>
    </form>
  </section>;
}
