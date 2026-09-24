import { useState } from "react";
import { LayoutDashboard, CalendarDays, Ticket, DoorOpen, Settings, LogOut, Search, ChevronDown, Menu, X } from "lucide-react";
import logo from "../assets/PROTRACK LOGO 2.svg";
import styles from "./AdminDashboard.module.css";
import admin from "../assets/a-l-l-e-f-v-i-n-i-c-i-u-s-343875-unsplash.png";
import flag from "../assets/UK Flag.svg";
import AdminHome from "../components/admin/AdminHome";
import EventManagement from "../components/admin/EventManagement";
import TicketSales from "../components/admin/TicketSales";
import AttendanceGate from "../components/admin/AttendanceGate";

const NAV_ITEMS = [
  { id: "dashboard",   label: "Dashboard",        icon: LayoutDashboard },
  { id: "events",      label: "Event Management", icon: CalendarDays },
  { id: "tickets",     label: "Ticket Sales",     icon: Ticket },
  { id: "attendance",  label: "Attendance/Gate",  icon: DoorOpen },
];

function Sidebar({ active, onNav, open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        {/* Logo + close button on mobile */}
        <div className={styles.sidebarLogo}>
          <img src={logo} alt="ProTrack" />
          <button className={styles.sidebarCloseBtn} onClick={onClose} aria-label="Close menu">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`${styles.navItem} ${active === id ? styles.navActive : ""}`}
              onClick={() => { onNav(id); onClose(); }}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button className={styles.navItem}>
            <Settings size={16} strokeWidth={2} />
            <span>Settings</span>
          </button>
          <button className={styles.navItem}>
            <LogOut size={16} strokeWidth={2} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar
        active={activeNav}
        onNav={setActiveNav}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          {/* Hamburger — mobile only */}
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={2} />
          </button>

          <div className={styles.searchBox}>
            <Search size={17} strokeWidth={1.5} className={styles.searchIcon} color="#333333b6" />
            <input type="text" placeholder="Search" className={styles.searchInput} />
          </div>

          <div className={styles.topBarRight}>
            <div className={styles.langSelector}>
              <span><img src={flag} alt="lang" /></span>
              <span>English</span>
              <ChevronDown size={13} strokeWidth={2} color="#555" />
            </div>
            <div className={styles.avatar}>
              <div className={styles.avatarCircle}>
                <img className={styles.image} src={admin} alt="" />
              </div>
              <div className={styles.avatarInfo}>
                <span className={styles.avatarName}>Tosin Okafor</span>
                <span className={styles.avatarRole}>Admin</span>
              </div>
              <div className={styles.chevronCircle}>
                <ChevronDown size={13} strokeWidth={2} color="#5C5C5C" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          {activeNav === "dashboard"  && <AdminHome />}
          {activeNav === "events"     && <EventManagement />}
          {activeNav === "tickets"    && <TicketSales />}
          {activeNav === "attendance" && <AttendanceGate />}
        </main>
      </div>
    </div>
  );
}