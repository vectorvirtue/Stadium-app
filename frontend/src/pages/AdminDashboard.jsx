import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Ticket, DoorOpen, Settings, LogOut, Search, ChevronDown, Menu, X, Check, ArrowLeftRight } from "lucide-react";
import logo from "../assets/PROTRACK LOGO 2.svg";
import styles from "./AdminDashboard.module.css";
import adminPhoto from "../assets/a-l-l-e-f-v-i-n-i-c-i-u-s-343875-unsplash.png";
import flag from "../assets/UK Flag.svg";
import AdminHome from "../components/admin/AdminHome";
import EventManagement from "../components/admin/EventManagement";
import TicketSales from "../components/admin/TicketSales";
import AttendanceGate from "../components/admin/AttendanceGate";
import AdminSettings from "../components/admin/AdminSettings";
import { clearSession } from "../lib/api";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "events", label: "Event Management", icon: CalendarDays },
  { id: "tickets", label: "Ticket Sales", icon: Ticket },
  { id: "attendance", label: "Attendance/Gate", icon: DoorOpen },
];

const SEARCH_PLACEHOLDER = {
  events: "Search events…",
  tickets: "Search tickets…",
  attendance: "Search attendance…",
};

function Sidebar({ active, onNav, open, onClose, onLogout }) {
  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
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
          <button
            className={`${styles.navItem} ${active === "settings" ? styles.navActive : ""}`}
            onClick={() => { onNav("settings"); onClose(); }}
          >
            <Settings size={16} strokeWidth={2} />
            <span>Settings</span>
          </button>
          <button className={styles.navItem} onClick={onLogout}>
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
  const [search, setSearch] = useState("");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const adminName = user ? `${user.first_name} ${user.last_name}`.trim() : "Admin";

  async function handleLogout() {
    await clearSession();
    navigate("/", { replace: true });
  }

  // Search only applies to the list-style views (events / tickets /
  // attendance) — the dashboard summary and settings screens have no
  // table to filter, so the box is present but has nothing to act on
  // there, same as it would for any admin console.
  function goTo(id) {
    setActiveNav(id);
    setSearch("");
  }

  return (
    <div className={styles.layout}>
      <Sidebar active={activeNav} onNav={goTo} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

      <div className={styles.main}>
        <header className={styles.topBar}>
          <button className={styles.hamburger} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} strokeWidth={2} />
          </button>

          <div className={styles.searchBox}>
            <Search size={17} strokeWidth={1.5} className={styles.searchIcon} color="#333333b6" />
            <input
              type="text"
              placeholder={SEARCH_PLACEHOLDER[activeNav] || "Search"}
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={!SEARCH_PLACEHOLDER[activeNav]}
            />
          </div>

          <div className={styles.topBarRight}>
            <div className={styles.langWrapper}>
              <button
                type="button"
                className={styles.langSelector}
                onClick={() => { setLangMenuOpen((v) => !v); setAvatarMenuOpen(false); }}
                aria-haspopup="true"
                aria-expanded={langMenuOpen}
              >
                <span><img src={flag} alt="lang" /></span>
                <span>English</span>
                <ChevronDown size={13} strokeWidth={2} color="#555" />
              </button>
              {langMenuOpen && (
                <>
                  <div className={styles.menuOverlay} onClick={() => setLangMenuOpen(false)} />
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownItem}>
                      <span>English</span>
                      <Check size={14} strokeWidth={2} color="var(--text)" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={styles.avatarWrapper}>
              <button
                type="button"
                className={styles.avatar}
                onClick={() => { setAvatarMenuOpen((v) => !v); setLangMenuOpen(false); }}
                aria-haspopup="true"
                aria-expanded={avatarMenuOpen}
              >
                <div className={styles.avatarCircle}>
                  <img className={styles.image} src={adminPhoto} alt="" />
                </div>
                <div className={styles.avatarInfo}>
                  <span className={styles.avatarName}>{adminName}</span>
                  <span className={styles.avatarRole}>Admin</span>
                </div>
                <div className={styles.chevronCircle}>
                  <ChevronDown size={13} strokeWidth={2} color="#5C5C5C" />
                </div>
              </button>
              {avatarMenuOpen && (
                <>
                  <div className={styles.menuOverlay} onClick={() => setAvatarMenuOpen(false)} />
                  <div className={styles.dropdownMenu}>
                    <button
                      className={styles.dropdownButton}
                      onClick={() => { setAvatarMenuOpen(false); navigate("/dashboard"); }}
                    >
                      <ArrowLeftRight size={14} strokeWidth={2} />
                      <span>Switch to User Dashboard</span>
                    </button>
                    <button className={styles.dropdownButton} onClick={() => { goTo("settings"); setAvatarMenuOpen(false); }}>
                      <Settings size={14} strokeWidth={2} />
                      <span>Settings</span>
                    </button>
                    <button className={styles.dropdownButton} onClick={handleLogout}>
                      <LogOut size={14} strokeWidth={2} />
                      <span>Log out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className={styles.content}>
          {activeNav === "dashboard" && <AdminHome />}
          {activeNav === "events" && <EventManagement search={search} />}
          {activeNav === "tickets" && <TicketSales search={search} onCreateEvent={() => goTo("events")} />}
          {activeNav === "attendance" && <AttendanceGate search={search} onCreateEvent={() => goTo("events")} />}
          {activeNav === "settings" && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}
