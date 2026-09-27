import { useEffect, useState } from "react";
import styles from "./AdminSettings.module.css";
import { api } from "../../lib/api";

export default function AdminSettings() {
  const [profile, setProfile] = useState({ first_name: "", last_name: "", phone_number: "", email: "" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api("/profile").then(setProfile).catch((e) => setProfileErr(e.message));
  }, []);

  const change = (key) => (e) => setProfile((p) => ({ ...p, [key]: e.target.value }));

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true); setProfileMsg(""); setProfileErr("");
    try {
      const updated = await api("/profile", { method: "PATCH", body: JSON.stringify(profile) });
      setProfile(updated);
      // Keeps the topbar's admin name in sync immediately after a save,
      // same pattern the customer-facing Profile page uses.
      localStorage.setItem("user", JSON.stringify(updated));
      setProfileMsg("Profile saved.");
    } catch (e) {
      setProfileErr(e.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setSavingPassword(true); setPasswordMsg(""); setPasswordErr("");
    try {
      const result = await api("/profile/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setPasswordMsg(result.detail || "Password updated.");
      setCurrentPassword(""); setNewPassword("");
    } catch (e) {
      setPasswordErr(e.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Settings</h2>
      <p className={styles.sub}>Manage your admin account</p>

      <div className={styles.cards}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Profile</h3>
          {profileErr && <p role="alert" className={styles.error}>{profileErr}</p>}
          {profileMsg && <p role="status" className={styles.success}>{profileMsg}</p>}
          <form className={styles.form} onSubmit={saveProfile}>
            <label>First name<input value={profile.first_name} onChange={change("first_name")} required /></label>
            <label>Last name<input value={profile.last_name} onChange={change("last_name")} required /></label>
            <label>Phone number<input type="tel" value={profile.phone_number} onChange={change("phone_number")} minLength={7} maxLength={15} required /></label>
            <label>Email address<input type="email" value={profile.email} onChange={change("email")} required /></label>
            <button type="submit" className={styles.saveBtn} disabled={savingProfile}>{savingProfile ? "Saving…" : "Save changes"}</button>
          </form>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Change password</h3>
          {passwordErr && <p role="alert" className={styles.error}>{passwordErr}</p>}
          {passwordMsg && <p role="status" className={styles.success}>{passwordMsg}</p>}
          <form className={styles.form} onSubmit={savePassword}>
            <label>Current password<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></label>
            <label>New password<input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></label>
            <button type="submit" className={styles.saveBtn} disabled={savingPassword || newPassword.length < 8}>{savingPassword ? "Saving…" : "Update password"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
