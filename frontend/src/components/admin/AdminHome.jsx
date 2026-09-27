import { useEffect, useState } from "react";
import styles from "./AdminHome.module.css";
import { TrendingUp } from "lucide-react";
import { TrendingDown } from "lucide-react";
import ticket from "../../assets/Tickets.svg";
import revenue from "../../assets/Frame.svg";
import checked from "../../assets/icon.svg";
import denied from "../../assets/icon (1).svg";
import SalesByCategory from "./SalesByCategory";
import { api, money } from "../../lib/api";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function AdminHome() {
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [error, setError] = useState("");

  // The full list of matches feeds the "focus this dashboard on..."
  // selector — it's the same list Event Management uses, so any match an
  // admin has created shows up here too, no separate endpoint needed.
  useEffect(() => {
    api("/admin/matches").then(setMatches).catch(() => {});
  }, []);

  function loadFor(matchId) {
    const query = matchId ? `?match_id=${encodeURIComponent(matchId)}` : "";
    api(`/admin/dashboard/summary${query}`)
      .then((data) => {
        setSummary(data);
        setSelectedMatchId(data.up_next?.id || null);
        if (data.up_next) {
          api(`/admin/matches/${data.up_next.id}/sales-by-category`)
            .then((rows) => setCategoryData(rows.map((r) => ({ name: r.name, sold: r.sold, capacity: r.capacity, soldColor: "#026FB6", bgColor: "#D6EAF8" }))))
            .catch(() => {});
        } else {
          setCategoryData(null);
        }
      })
      .catch((e) => setError(e.message));
  }

  useEffect(() => { loadFor(null); }, []);

  if (error) return <p role="alert" style={{ color: "#b42318" }}>{error}</p>;
  if (!summary) return <p>Loading dashboard…</p>;

  const pctOfCapacity = summary.total_capacity ? Math.round((summary.total_sold_tickets / summary.total_capacity) * 100) : 0;
  const pctCheckedIn = summary.total_sold_tickets ? Math.round((summary.checked_in / summary.total_sold_tickets) * 100) : 0;

  return (
    <>
      <div className={styles.wrapper}>
        {summary.up_next ? (
          <>
            <strong>Up Next: {summary.up_next.title}</strong>
            <span>{formatDateTime(summary.up_next.kickoff_at)} | {summary.up_next.venue}</span>
          </>
        ) : (
          <strong>No matches scheduled yet</strong>
        )}
      </div>

      <div className={styles.statContainer}>
        <div className={styles.stats}>
          <div className={styles.headerContainer}>
            <div className={styles.header}>Total Sold Tickets</div>
            <div className={styles.icon}>
              <img src={ticket} alt="icon" />
            </div>
          </div>
          <div className={styles.counter}>{summary.total_sold_tickets.toLocaleString()}</div>
          <div className={styles.stat}>
            <TrendingUp size={20} />
            <span>Of {summary.total_capacity.toLocaleString()} Capacity ({pctOfCapacity}%)</span>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.headerContainer}>
            <div className={styles.header}>Revenue</div>
            <div className={styles.iconTwo} style={{ backgroundColor: "#fec43d43" }}>
              <img src={revenue} alt="icon" />
            </div>
          </div>
          <div className={styles.counter}>{money(summary.revenue)}</div>
          <div className={styles.stat}>
            <TrendingUp size={20} />
            <span style={{ color: "#606060" }}>For the featured event</span>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.headerContainer}>
            <div className={styles.header}>Checked In</div>
            <div className={styles.icon} style={{ backgroundColor: "#4ad99242" }}>
              <img src={checked} alt="icon" />
            </div>
          </div>
          <div className={styles.counter}>{summary.checked_in.toLocaleString()}</div>
          <div className={styles.stat}>
            <TrendingUp size={20} />
            <span>{pctCheckedIn}%</span> <span style={{ color: "#606060" }}>Of Sold Tickets</span>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.headerContainer}>
            <div className={styles.header}>Denied Entries</div>
            <div className={styles.icon} style={{ backgroundColor: "#ff8f6637" }}>
              <img src={denied} alt="icon" />
            </div>
          </div>
          <div className={styles.counter}>{summary.denied_entries.toLocaleString()}</div>
          <div className={styles.stat}>
            <TrendingDown size={20} color="#F93C65" />
            <span style={{ color: "#F93C65" }}>invalid / denied scans</span>
          </div>
        </div>
      </div>

      {categoryData && categoryData.length > 0 && (
        <SalesByCategory
          data={categoryData}
          matches={matches}
          selectedMatchId={selectedMatchId}
          onSelectMatch={(id) => loadFor(id)}
        />
      )}
    </>
  );
}
