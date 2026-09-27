import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";
import styles from "./Wallet.module.css";
import { api } from "../lib/api";

const formatMeta = (kickoff_at, venue) =>
  `${new Date(kickoff_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short" })} | ${new Date(kickoff_at).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })} | ${venue}`;

const qrUrl = (code) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}`;

export default function Wallet() {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    api("/tickets/wallet")
      .then(setTickets)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const cardWidth = el.firstChild?.offsetWidth + 14;
      const index = Math.round(el.scrollLeft / cardWidth);
      setActiveIndex(index);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [tickets]);

  if (error) return <p role="alert" style={{ color: "#b42318" }}>{error}</p>;
  if (!tickets) return <p>Loading wallet…</p>;

  if (tickets.length === 0) {
    return (
      <>
        <h1 className={styles.heading}>My wallet</h1>
        <p className={styles.sub}>0 upcoming tickets</p>
        <div className={styles.empty}>
          <p className={styles.emptyText}>No tickets here to view</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className={styles.heading}>My wallet</h1>
      <p className={styles.sub}>{tickets.length} upcoming ticket{tickets.length !== 1 ? "s" : ""}</p>

      <div className={styles.ticketGrid} ref={scrollRef}>
        {tickets.map((ticket) => (
          <div key={ticket.id} className={styles.ticketCard}>
            <div className={styles.cardTop}>
              <div>
                <p className={styles.matchName}>{ticket.match_title}</p>
                <p className={styles.matchMeta}>{formatMeta(ticket.kickoff_at, ticket.match_venue)}</p>
              </div>
              <a href={qrUrl(ticket.ticket_code)} download={`${ticket.ticket_code}.png`} className={styles.downloadBtn} aria-label="Download ticket">
                <Download size={14} strokeWidth={2} />
              </a>
            </div>

            <div className={styles.qr}>
              <img src={qrUrl(ticket.ticket_code)} alt="QR code" className={styles.qrImg} />
            </div>

            <p className={styles.ticketId}>{ticket.ticket_code}</p>

            <div className={styles.dividerRow}>
              <div className={styles.dashes} />
            </div>

            <p className={styles.detailsLink}>{ticket.seat_label}</p>

            <div className={styles.infoGrid}>
              <span className={styles.infoLabel}>Holder</span>
              <span className={styles.infoValue}>{ticket.holder_name}</span>
              <span className={styles.infoLabel}>Reference</span>
              <span className={styles.infoValue}>{ticket.reference}</span>
              <span className={styles.infoLabel}>Status</span>
              <span className={styles.infoValue}>{ticket.status === "checked_in" ? "Checked in" : "Valid — not yet scanned"}</span>
            </div>
          </div>
        ))}
      </div>

      {tickets.length > 1 && (
        <div className={styles.dots}>
          {tickets.map((_, i) => (
            <span
              key={i}
              className={styles.dot}
              style={{ opacity: i === activeIndex ? 1 : 0.4 }}
            />
          ))}
        </div>
      )}
    </>
  );
}
