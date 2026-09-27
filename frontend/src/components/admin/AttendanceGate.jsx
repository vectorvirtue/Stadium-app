import { useEffect, useState } from "react";
import styles from "./AttendanceGate.module.css";
import NotFound from "../../pages/NotFound";
import ticket from "../../assets/Tickets.svg";
import { api } from "../../lib/api";

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });

export default function AttendanceGate({ search = "", onCreateEvent }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [gate, setGate] = useState("Gate 1");
  const [checking, setChecking] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  function load() {
    api("/admin/attendance")
      .then(setData)
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleCheckIn(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
    setScanResult(null);
    try {
      const res = await api("/admin/gate/check-in", {
        method: "POST",
        body: JSON.stringify({ ticket_code: code.trim().toUpperCase(), gate }),
      });
      setScanResult(res);
      setCode("");
      load();
    } catch (e) {
      setScanResult({ result: "denied", reason: e.message });
    } finally {
      setChecking(false);
    }
  }

  if (error) return <p role="alert" style={{ color: "#b42318" }}>{error}</p>;
  if (!data) return <p>Loading attendance…</p>;

  const query = search.trim().toLowerCase();
  const filteredLogs = query
    ? data.logs.filter((row) => `${row.holder_name || ""} ${row.ticket_code} ${row.category || ""}`.toLowerCase().includes(query))
    : data.logs;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Attendance / Gate</h2>
      <p className={styles.sub}>Gate access and attendance tracking</p>

      <form onSubmit={handleCheckIn} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Scan or enter ticket code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #CCE2F0", minWidth: 220 }}
        />
        <select value={gate} onChange={(e) => setGate(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #CCE2F0" }}>
          <option>Gate 1</option>
          <option>Gate 2</option>
          <option>Gate 3</option>
          <option>Gate 4</option>
        </select>
        <button type="submit" disabled={checking} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#026FB6", color: "#fff", fontWeight: 600 }}>
          {checking ? "Checking…" : "Check in"}
        </button>
        {scanResult && (
          <span style={{ color: scanResult.result === "granted" ? "#1a7f37" : "#b42318", fontWeight: 600 }}>
            {scanResult.result === "granted" ? `Granted — ${scanResult.ticket?.holder_name}` : `Denied — ${scanResult.reason}`}
          </span>
        )}
      </form>

      {data.gates.length === 0 && data.logs.length === 0 ? (
        <NotFound message="No event, No attendance" onCreateEvent={onCreateEvent} />
      ) : (
        <>
          <div className={styles.gateCards}>
            {data.gates.map((g) => (
              <div key={g.gate} className={styles.gateCard}>
                <div className={styles.gateCardTop}>
                  <span className={styles.gateLabel}>{g.gate} Entries</span>
                  <div className={styles.gateIcon}>
                    <img src={ticket} alt="" />
                  </div>
                </div>
                <p className={styles.gateCount}>{g.granted.toLocaleString()}</p>
                <p className={styles.deniedNonZero}>{g.denied} Denied</p>
              </div>
            ))}
          </div>

          {query && filteredLogs.length === 0 ? (
            <p className={styles.sub}>No attendance records match "{search}".</p>
          ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Holder</th>
                  <th>Category</th>
                  <th>Time</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.ticketId}>{row.ticket_code}</td>
                    <td>{row.holder_name || "—"}</td>
                    <td>{row.category || "—"}</td>
                    <td>{formatTime(row.created_at)}</td>
                    <td>
                      <span className={`${styles.badge} ${row.result === "granted" ? styles.badgeGranted : styles.badgeDenied}`}>
                        {row.result === "granted" ? "Granted" : "Denied"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </>
      )}
    </div>
  );
}
