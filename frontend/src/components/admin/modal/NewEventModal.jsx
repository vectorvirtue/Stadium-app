import { useState } from "react";
import { X, Plus } from "lucide-react";
import styles from "./NewEventModal.module.css";

const DEFAULT_CATEGORIES = [
  { id: 1, key: "vip", name: "VIP", price: 25000, seats: 500 },
  { id: 2, key: "premium", name: "Premium", price: 12000, seats: 1500 },
  { id: 3, key: "regular", name: "Regular", price: 5000, seats: 3000 },
];

export default function NewEventModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", venue: "", date: "", kickoff: "" });
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const addCategory = () => {
    setCategories((c) => [...c, { id: Date.now(), key: `cat-${Date.now()}`, name: "New", price: 0, seats: 0 }]);
  };

  const removeCategory = (id) => setCategories((c) => c.filter((cat) => cat.id !== id));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.date || !form.kickoff) {
      setError("Please set both a date and a kickoff time.");
      return;
    }
    const kickoff_at = new Date(`${form.date}T${form.kickoff}`).toISOString();
    const payload = {
      title: form.name,
      venue: form.venue,
      kickoff_at,
      seat_types: categories.map((c) => ({
        key: c.key || c.name.toLowerCase().replace(/\W+/g, "-"),
        label: c.name,
        price: Number(c.price) || 0,
        capacity: Number(c.seats) || 0,
      })),
    };
    setBusy(true);
    try {
      await onSave?.(payload);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Create event</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p role="alert" style={{ color: "#b42318", margin: 0 }}>{error}</p>}

          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Event name</label>
              <input type="text" placeholder="Team A vs Team B" value={form.name} onChange={set("name")} required />
            </div>
            <div className={styles.field}>
              <label>Venue</label>
              <input type="text" placeholder="Lagos National Stadium" value={form.venue} onChange={set("venue")} required />
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Date</label>
              <input type="date" value={form.date} onChange={set("date")} required />
            </div>
            <div className={styles.field}>
              <label>Kickoff time</label>
              <input type="time" value={form.kickoff} onChange={set("kickoff")} required />
            </div>
          </div>

          <div className={styles.categories}>
            {categories.map((cat) => (
              <div key={cat.id} className={styles.categoryPill}>
                <input
                  className={styles.catName}
                  style={{ border: "none", width: 60, background: "transparent" }}
                  value={cat.name}
                  onChange={(e) => setCategories((cs) => cs.map((c) => (c.id === cat.id ? { ...c, name: e.target.value } : c)))}
                />
                <span className={styles.catDash}>—</span>
                <input
                  type="number"
                  className={styles.catDetail}
                  style={{ border: "none", width: 70, background: "transparent" }}
                  value={cat.price}
                  onChange={(e) => setCategories((cs) => cs.map((c) => (c.id === cat.id ? { ...c, price: e.target.value } : c)))}
                />
                <span className={styles.catDash}>·</span>
                <input
                  type="number"
                  className={styles.catDetail}
                  style={{ border: "none", width: 60, background: "transparent" }}
                  value={cat.seats}
                  onChange={(e) => setCategories((cs) => cs.map((c) => (c.id === cat.id ? { ...c, seats: e.target.value } : c)))}
                />
                <button type="button" className={styles.removeCat} onClick={() => removeCategory(cat.id)} aria-label="Remove category">
                  <X size={10} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            <button type="button" className={styles.addCategory} onClick={addCategory}>
              <Plus size={13} strokeWidth={2.5} />
              Add category
            </button>
          </div>

          <button type="submit" className={styles.publishBtn} disabled={busy}>
            {busy ? "Publishing…" : "Publish event"}
          </button>
        </form>
      </div>
    </div>
  );
}
