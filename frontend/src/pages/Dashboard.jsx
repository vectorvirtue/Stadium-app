import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserCircle, ShieldCheck, LogOut } from "lucide-react";
import Matches from "../components/Matches";
import Wallet from "../components/Wallet";
import Tickets from "../components/Tickets";
import Profile from "../components/Profile";
import logo from "../assets/PROTRACK LOGO 2.svg";
import matchesActive from "../assets/stadium 2.svg";
import walletActive from "../assets/Vector.svg";
import matchesInactive from "../assets/stadium 1.svg";
import walletInactive from "../assets/Vector1.svg";
import ticketIcon from "../assets/Tickets.svg";
import { api, clearSession } from "../lib/api";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("matches"); const [notice, setNotice] = useState("");
  const [searchParams, setSearchParams] = useSearchParams(); const navigate = useNavigate();
  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) return;
    api(`/payments/verify/${encodeURIComponent(reference)}`).then((order) => setNotice(`Payment ${order.status}. Reference: ${reference}`)).catch((e) => setNotice(`Payment verification failed: ${e.message}`)).finally(() => { searchParams.delete("reference"); searchParams.delete("trxref"); setSearchParams(searchParams, { replace: true }); });
  }, []);
  async function logout() { await clearSession(); navigate("/", { replace: true }); }
  return <div className={styles.page}>
    <div className={styles.header}>
      <img src={logo} alt="ProTrack" className={styles.logo} />
      <nav className={styles.tabBar}>
        <button className={`${styles.tab} ${activeTab === "matches" ? styles.active : ""}`} onClick={() => setActiveTab("matches")}><img src={activeTab === "matches" ? matchesActive : matchesInactive} alt="" className={styles.tabIcon} /><span>Matches</span></button>
        <button className={`${styles.tab} ${activeTab === "wallet" ? styles.active : ""}`} onClick={() => setActiveTab("wallet")}><img src={activeTab === "wallet" ? walletActive : walletInactive} alt="" className={styles.tabIcon} /><span>Wallet</span></button>
        <button className={`${styles.tab} ${activeTab === "tickets" ? styles.active : ""}`} onClick={() => setActiveTab("tickets")}><img src={ticketIcon} alt="" className={`${styles.tabIcon} ${activeTab === "tickets" ? "" : styles.tabIconInactive}`} /><span>Tickets</span></button>
        <button className={`${styles.tab} ${activeTab === "profile" ? styles.active : ""}`} onClick={() => setActiveTab("profile")}><UserCircle size={28} strokeWidth={1.5} className={styles.profileIcon} /><span>Profile</span></button>
      </nav>
      <div className={styles.headerActions}>
        {JSON.parse(localStorage.getItem("user") || "null")?.role === "admin" && (
          <Link to="/admin" className={styles.adminLink}>
            <ShieldCheck size={14} strokeWidth={2} />
            <span>Admin</span>
          </Link>
        )}
        <button type="button" onClick={logout} className={styles.signOutBtn}>
          <LogOut size={14} strokeWidth={2} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
    <div className={styles.content}>
      {notice && <p role="status">{notice}</p>}
      {activeTab === "matches" && <Matches />}{activeTab === "wallet" && <Wallet />}{activeTab === "tickets" && <Tickets />}{activeTab === "profile" && <Profile />}
    </div>
  </div>;
}


