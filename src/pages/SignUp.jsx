import { useState } from "react";
import logo from '../assets/PROTRACK LOGO 2.svg'
import styles from './Signup.module.css'

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [number, setNumber] = useState("")
 const [confirmPassword, setConfirmPassword] = useState("");

const passwordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const passwordsMatch = password === confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    // handle sign in logic here
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoWrapper}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>

        {/* Heading */}
        <h1 className={styles.heading}>Create Your Account</h1>
        <p className={styles.subheading}>Buy tickets and get gate access in one place</p>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
             <input
            className={styles.input}
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
           <input
            className={styles.input}
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />

        <input
            className={styles.input}
            type="number"
            placeholder="Phone Number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}   maxLength="11"
            required
          />

          <input
            className={styles.input}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

           <input
            className={styles.input}
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button className={styles.button} type="submit">
          Create Account
          </button>
        </form>

        {/* Footer */}
        <p className={styles.footer}>
          Already have an account?{" "}
          <a href="/" className={styles.link}>
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
