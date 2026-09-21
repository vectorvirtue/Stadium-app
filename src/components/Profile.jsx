import { useState } from "react";
import { Pencil } from "lucide-react";

import styles from './Profile.module.css';

// Each field tracks its own editing state
function ProfileField({ label, type = "text", value, onChange }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className={styles.fieldWrapper}>
      <input
        className={`${styles.input} ${editing ? styles.inputEditing : ""}`}
        type={type}
        placeholder={label}
        value={value}
        onChange={onChange}
        readOnly={!editing}
      />
      <button
        type="button"
        className={styles.editBtn}
        onClick={() => setEditing((e) => !e)}
        aria-label={editing ? `Stop editing ${label}` : `Edit ${label}`}
      >
        <Pencil size={14} strokeWidth={2} color={editing ? "#026FB6" : "#888"} />
      </button>
    </div>
  );
}

export default function Profile() {
  // These will be populated from the backend
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <>


      <h1 className={styles.heading}>Your Profile</h1>
      <p className={styles.subheading}>Tap the pencil icon to edit a field</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <ProfileField label="First Name"    value={firstName}       onChange={(e) => setFirstName(e.target.value)} />
        <ProfileField label="Last Name"     value={lastName}        onChange={(e) => setLastName(e.target.value)} />
        <ProfileField label="Phone Number"  type="number"           value={number}         onChange={(e) => setNumber(e.target.value)} />
        <ProfileField label="Email address" type="email"            value={email}          onChange={(e) => setEmail(e.target.value)} />
        <ProfileField label="Password"      type="password"         value={password}       onChange={(e) => setPassword(e.target.value)} />
        <ProfileField label="Confirm Password" type="password"      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

        <button className={styles.button} type="submit">
        Update Profile
        </button>
      </form>
    </>
  );
}
