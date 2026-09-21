import { useState } from "react";
import pin from "../assets/Pin.svg";
import matchBanner from "../assets/Frame 1000004712.svg";
import styles from "./Matches.module.css";
import payment from "../assets/images (7) 1.svg"

// ─── Constants ───────────────────────────────────────────────────────────────

const MATCHES = [
  { id: 1, title: "Kano Pillars vs Warri Wolves", meta: "14 Nov | 2:00pm | Abuja National Stadium", soldOut: true },
  { id: 2, title: "Kano Pillars vs Warri Wolves", meta: "14 Nov | 2:00pm | Abuja National Stadium", soldOut: false },
  { id: 3, title: "Kano Pillars vs Warri Wolves", meta: "14 Nov | 2:00pm | Abuja National Stadium", soldOut: false },
  { id: 4, title: "Kano Pillars vs Warri Wolves", meta: "14 Nov | 2:00pm | Abuja National Stadium", soldOut: false },
];

const SEAT_TYPES = [
  { id: "vip",     label: "VIP SEATS",     description: "Covered stand",    left: 212,  price: 25000 },
  { id: "premium", label: "PREMIUM SEATS", description: "Side stand",       left: 640,  price: 12000 },
  { id: "regular", label: "Regular",       description: "General terraces", left: 3100, price: 5000  },
];

const SERVICE_FEE = 850;
const VAT_RATE = 0.075;

function formatNaira(amount, decimals = false) {
  return "₦" + amount.toLocaleString("en-NG", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
}

// ─── MatchList view ───────────────────────────────────────────────────────────

function MatchList({ onSelect }) {
  return (
    <>
      <h1 className={styles.heading}>Upcoming Games</h1>
      <div className={styles.centre}>
        <img className={styles.pin} src={pin} alt="" />
        <span><h5>Abuja National Stadium</h5></span>
      </div>

      <div className={styles.matches}>
        {MATCHES.map((match) => (
          <article
            key={match.id}
            className={`${styles.match} ${match.soldOut ? styles.soldOutMatch : ""}`}
          >
            <div className={styles.matchBanner}>
              <img src={matchBanner} alt={match.title} />
              {match.soldOut && <span className={styles.soldOut}>SOLD OUT</span>}
            </div>
            <div className={styles.matchInfo}>
              <strong>{match.title}</strong>
              <span>{match.meta}</span>
              {!match.soldOut && (
                <div className={styles.matchFooter}>
                  <strong>From ₦5,000</strong>
                  <button type="button" onClick={() => onSelect(match)}>
                    Select
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

// ─── PickTickets view ─────────────────────────────────────────────────────────

function PickTickets({ match, onBack, onCheckout }) {
  const [quantities, setQuantities] = useState(
    Object.fromEntries(SEAT_TYPES.map((s) => [s.id, 0]))
  );

  const increment = (id) => setQuantities((q) => ({ ...q, [id]: q[id] + 1 }));
  const decrement = (id) => setQuantities((q) => ({ ...q, [id]: Math.max(0, q[id] - 1) }));

  const total = SEAT_TYPES.reduce((sum, s) => sum + s.price * quantities[s.id], 0);

  const handleCheckout = () => {
    const selectedSeats = SEAT_TYPES
      .filter((s) => quantities[s.id] > 0)
      .map((s) => ({ ...s, quantity: quantities[s.id] }));
    onCheckout(selectedSeats);
  };

  return (
    <>
      <button className={styles.back} onClick={onBack}>
        ← <span>View all matches</span>
      </button>

      <h1 className={styles.matchTitle}>{match.title}</h1>
      <p className={styles.matchMeta}>{match.meta}</p>

      <div className={styles.seats}>
        {SEAT_TYPES.map((seat) => (
          <div
            key={seat.id}
            className={`${styles.seatCard} ${quantities[seat.id] > 0 ? styles.seatSelected : ""}`}
            onClick={() => {
              if (quantities[seat.id] === 0) {
                increment(seat.id);
              } else {
                setQuantities((q) => ({ ...q, [seat.id]: 0 }));
              }
            }}
          >
            <p className={styles.seatLabel}>{seat.label}</p>
            <p className={styles.seatDesc}>
              {seat.description} | {seat.left.toLocaleString()} left
            </p>
            <div className={styles.seatFooter}>
              <span className={styles.seatPrice}>{formatNaira(seat.price)}</span>
              {quantities[seat.id] > 0 && (
                <div className={styles.counter}>
                  <button
                    className={styles.counterBtn}
                    onClick={(e) => { e.stopPropagation(); decrement(seat.id); }}
                    aria-label="Decrease"
                  >−</button>
                  <span className={styles.counterVal}>{quantities[seat.id]}</span>
                  <button
                    className={styles.counterBtn}
                    onClick={(e) => { e.stopPropagation(); increment(seat.id); }}
                    aria-label="Increase"
                  >+</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total bar */}
      <div className={styles.totalBar}>
        <div>
          <p className={styles.totalLabel}>Total</p>
          <p className={styles.totalAmount}>{formatNaira(total)}</p>
        </div>
        <button
          className={styles.checkoutBtn}
          disabled={total === 0}
          onClick={handleCheckout}
        >
          Check out
        </button>
      </div>
    </>
  );
}

// ─── Checkout view ────────────────────────────────────────────────────────────

function Checkout({ match, selectedSeats, onBack }) {
  const ticketsTotal = selectedSeats.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const subtotal = ticketsTotal + SERVICE_FEE;
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;

  return (
    <>
      <button className={styles.back} onClick={onBack}>
        ← <span>Pick tickets</span>
      </button>

      <h1 className={styles.checkoutHeading}>Checkout</h1>
      <p className={styles.checkoutSubheading}>Order summary</p>

      <div className={styles.lineItems}>
        {selectedSeats.map((s) => (
          <div key={s.id} className={styles.row}>
            <span>{s.label} x{s.quantity}</span>
            <span>{formatNaira(s.price * s.quantity, true)}</span>
          </div>
        ))}
        <div className={styles.row}>
          <span>Service fee</span>
          <span>{formatNaira(SERVICE_FEE, true)}</span>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.lineItems}>
        <div className={styles.row}>
          <span>SubTotal</span>
          <span>{formatNaira(subtotal, true)}</span>
        </div>
        <div className={styles.row}>
          <span>VAT (7.5%)</span>
          <span>{formatNaira(vat, true)}</span>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={`${styles.row} ${styles.totalRow}`}>
        <span>Total</span>
        <span>{formatNaira(total, true)}</span>
      </div>

      <div className={styles.payWrapper}>
        <button className={styles.payBtn}>
          <img src={payment} alt="" />
          Pay {formatNaira(total, true)}
        </button>
        <p className={styles.payNote}>Payments processed securely off-platform.</p>
      </div>
    </>
  );
}

// ─── Root Matches component ───────────────────────────────────────────────────

export default function Matches() {
  const [view, setView] = useState("list");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const handleSelect = (match) => {
    setSelectedMatch(match);
    setView("pickTickets");
  };

  const handleCheckout = (seats) => {
    setSelectedSeats(seats);
    setView("checkout");
  };

  return (
    <>
      {view === "list" && (
        <MatchList onSelect={handleSelect} />
      )}
      {view === "pickTickets" && (
        <PickTickets
          match={selectedMatch}
          onBack={() => setView("list")}
          onCheckout={handleCheckout}
        />
      )}
      {view === "checkout" && (
        <Checkout
          match={selectedMatch}
          selectedSeats={selectedSeats}
          onBack={() => setView("pickTickets")}
        />
      )}
    </>
  );
}
