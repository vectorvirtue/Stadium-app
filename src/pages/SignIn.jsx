import { useState } from "react";
import logo from '../assets/PROTRACK LOGO 2.svg'
import styles from './Signup.module.css'

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.subheading}>Login to get your matchday tickets</p>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
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
          <button className={styles.button} type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
        </form>

        {/* Footer */}
        <p className={styles.footer}>
          Don't have an account?{" "}
          <a href="/signup" className={styles.link}>
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
