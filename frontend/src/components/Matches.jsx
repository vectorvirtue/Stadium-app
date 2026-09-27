import { useEffect, useState } from "react";
import { api, money } from "../lib/api";
import pin from "../assets/Pin.svg";
import matchBanner from "../assets/Frame 1000004712.svg";
import styles from "./Matches.module.css";

const formatDate = (value) => new Date(value).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function Matches() {
  const [matches, setMatches] = useState([]); const [match, setMatch] = useState(null); const [seats, setSeats] = useState([]);
  const [quantities, setQuantities] = useState({}); const [view, setView] = useState("list"); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { api("/matches").then(setMatches).catch((e) => setError(e.message)); }, []);

  async function selectMatch(item) {
    setError(""); setBusy(true);
    try { const detail = await api(`/matches/${item.id}`); setMatch(detail); setSeats(detail.seat_types || []); setQuantities({}); setView("seats"); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const selected = seats.filter((seat) => Number(quantities[seat.id] || 0) > 0);
  const ticketsTotal = selected.reduce((sum, seat) => sum + Number(seat.price) * Number(quantities[seat.id]), 0);
  async function checkout() {
    setBusy(true); setError("");
    try {
      const result = await api("/tickets/checkout", { method: "POST", body: JSON.stringify({ match_id: match.id, items: selected.map((seat) => ({ seat_type_id: seat.id, quantity: Number(quantities[seat.id]) })) }) });
      window.location.assign(result.authorization_url);
    } catch (e) { setError(e.message); setBusy(false); }
  }
  return <>
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    {view === "list" && <>
      <h1 className={styles.heading}>Upcoming Games</h1><div className={styles.centre}><img className={styles.pin} src={pin} alt="" /><h5>Upcoming matches</h5></div>
      {busy && <p>Loading match…</p>}
      <div className={styles.matches}>{matches.map((item) => <article key={item.id} className={`${styles.match} ${item.is_sold_out ? styles.soldOutMatch : ""}`}>
        <div className={styles.matchBanner}><img src={item.banner_image_url || matchBanner} alt={item.title} />{item.is_sold_out && <span className={styles.soldOut}>SOLD OUT</span>}</div>
        <div className={styles.matchInfo}><strong>{item.title}</strong><span>{formatDate(item.kickoff_at)} · {item.venue}</span>{!item.is_sold_out && <div className={styles.matchFooter}><strong>Tickets available</strong><button type="button" onClick={() => selectMatch(item)}>Select</button></div>}</div>
      </article>)}</div>
      {!busy && !matches.length && !error && <p>No matches are published yet.</p>}
    </>}
    {view === "seats" && match && <>
      <button className={styles.back} onClick={() => setView("list")}>← <span>View all matches</span></button><h1 className={styles.matchTitle}>{match.title}</h1><p className={styles.matchMeta}>{formatDate(match.kickoff_at)} · {match.venue}</p>
      <div className={styles.seats}>{seats.map((seat) => <div key={seat.id} className={`${styles.seatCard} ${quantities[seat.id] ? styles.seatSelected : ""}`}>
        <p className={styles.seatLabel}>{seat.label}</p><p className={styles.seatDesc}>{seat.description || "Ticket"} · {seat.quantity_left} left</p>
        <div className={styles.seatFooter}><span className={styles.seatPrice}>{money(seat.price)}</span><div className={styles.counter}><button className={styles.counterBtn} disabled={!quantities[seat.id]} onClick={() => setQuantities((q) => ({ ...q, [seat.id]: Math.max(0, (q[seat.id] || 0) - 1) }))}>−</button><span className={styles.counterVal}>{quantities[seat.id] || 0}</span><button className={styles.counterBtn} disabled={(quantities[seat.id] || 0) >= seat.quantity_left} onClick={() => setQuantities((q) => ({ ...q, [seat.id]: (q[seat.id] || 0) + 1 }))}>+</button></div></div>
      </div>)}</div>
      <div className={styles.totalBar}><div><p className={styles.totalLabel}>Tickets subtotal</p><p className={styles.totalAmount}>{money(ticketsTotal)}</p></div><button className={styles.checkoutBtn} disabled={!selected.length || busy} onClick={checkout}>{busy ? "Starting checkout…" : "Pay securely"}</button></div>
    </>}
  </>;
}
