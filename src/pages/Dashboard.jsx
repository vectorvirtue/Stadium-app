import { useState } from "react";
import { UserCircle } from "lucide-react";
import Matches from "../components/Matches";
import Wallet from "../components/Wallet";
import Profile from "../components/Profile";
import logo from '../assets/PROTRACK LOGO 2.svg'

// Active SVGs (blue)
import matchesActive from "../assets/stadium 2.svg";
import walletActive from "../assets/Vector.svg";
import profileActive from "../assets/Profile.svg";

// Inactive SVGs (grey/black)
import matchesInactive from "../assets/stadium 1.svg";
import walletInactive from "../assets/Vector1.svg";

import styles from "./Dashboard.module.css";

const TABS = ["matches", "wallet", "profile"];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("matches");

  return (
    <div className={styles.page}>
      {/* Top tab bar */}
      <nav className={styles.tabBar}>
        {/* Matches tab */}
        <button
          className={`${styles.tab} ${activeTab === "matches" ? styles.active : ""}`}
          onClick={() => setActiveTab("matches")}
        >
          <img
            src={activeTab === "matches" ? matchesActive : matchesInactive}
            alt="Matches"
            className={styles.tabIcon}
          />
          <span>Matches</span>
        </button>

        {/* Wallet tab */}
        <button
          className={`${styles.tab} ${activeTab === "wallet" ? styles.active : ""}`}
          onClick={() => setActiveTab("wallet")}
        >
          <img
            src={activeTab === "wallet" ? walletActive : walletInactive}
            alt="Wallet"
            className={styles.tabIcon}
          />
          <span>Wallet</span>
        </button>

        {/* Profile tab */}
        <button
          className={`${styles.tab} ${activeTab === "profile" ? styles.active : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          {activeTab === "profile" ? (
            <img src={profileActive} alt="Profile" className={styles.tabIcon} />
          ) : (
            <UserCircle size={28} strokeWidth={1.5} color="#888" />
          )}
          <span>Profile</span>
        </button>
      </nav>
      
      <div className={styles.content}>
      
        <div className={styles.logoWrapper}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>
        
        {activeTab === "matches" && <Matches />}
        {activeTab === "wallet" && <Wallet />}
        {activeTab === "profile" && <Profile />}
      </div>
    </div>
  );
}
