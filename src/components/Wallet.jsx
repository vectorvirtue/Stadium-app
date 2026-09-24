import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";
import qrCode from "../assets/qr-code (24) 1.svg";
import styles from "./Wallet.module.css";

// Placeholder tickets — will come from backend
const TICKETS = [
  {
    id: 1,
    match: "Kano Pillars vs Warri Wolves",
    meta: "14 Nov | 2:00pm | Abuja National Stadium",
    ticketId: "TCKT-8841-VIP-Q42",
    holder: "Japheth Adams",
    reference: "PSK-2231-93",
    valid: "Gate opens 3:00 PM",
  },
  {
    id: 2,
    match: "Kano Pillars vs Warri Wolves",
    meta: "14 Nov | 2:00pm | Abuja National Stadium",
    ticketId: "TCKT-8841-VIP-Q47",
    holder: "Japheth Adams",
    reference: "PSK-2231-93",
    valid: "Gate opens 3:00 PM",
  },
];

export default function Wallet() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  // Watch scroll position and update active dot
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const cardWidth = el.firstChild?.offsetWidth + 14; // card + gap
      const index = Math.round(el.scrollLeft / cardWidth);
      setActiveIndex(index);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Empty state
  if (TICKETS.length === 0) {
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
      <p className={styles.sub}>{TICKETS.length} upcoming ticket{TICKETS.length !== 1 ? "s" : ""}</p>

      <div className={styles.ticketGrid} ref={scrollRef}>
        {TICKETS.map((ticket) => (
          <div key={ticket.id} className={styles.ticketCard}>
            {/* Card top */}
            <div className={styles.cardTop}>
              <div>
                <p className={styles.matchName}>{ticket.match}</p>
                <p className={styles.matchMeta}>{ticket.meta}</p>
              </div>
              <button className={styles.downloadBtn} aria-label="Download ticket">
                <Download size={14} strokeWidth={2} />
              </button>
            </div>

            {/* QR code */}
            <div className={styles.qr}>
              <img src={qrCode} alt="QR code" className={styles.qrImg} />
            </div>

            {/* Ticket ID */}
            <p className={styles.ticketId}>{ticket.ticketId}</p>

            {/* Divider */}
            <div className={styles.dividerRow}>
              <div className={styles.dashes} />
            </div>

            {/* Ticket details link */}
            <p className={styles.detailsLink}>Ticket Details</p>

            {/* Info rows */}
            <div className={styles.infoGrid}>
              <span className={styles.infoLabel}>Holder</span>
              <span className={styles.infoValue}>{ticket.holder}</span>
              <span className={styles.infoLabel}>Reference</span>
              <span className={styles.infoValue}>{ticket.reference}</span>
              <span className={styles.infoLabel}>Valid</span>
              <span className={styles.infoValue}>{ticket.valid}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll dots — mobile only */}
      {TICKETS.length > 1 && (
        <div className={styles.dots}>
          {TICKETS.map((_, i) => (
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
