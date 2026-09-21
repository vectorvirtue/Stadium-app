import { useState } from "react";
import { X, Plus } from "lucide-react";
import styles from "./NewEventModal.module.css";

const DEFAULT_CATEGORIES = [
  { id: 1, name: "VIP",     price: 25000, seats: 500 },
  { id: 2, name: "Premium", price: 12000, seats: 1500 },
  { id: 3, name: "Regular", price: 5000,  seats: 3000 },
];

export default function NewEventModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    venue: "",
    date: "",
    kickoff: "",
    capacity: "",
    status: "Open",
  });

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const addCategory = () => {
    setCategories((c) => [
      ...c,
      { id: Date.now(), name: "New", price: 0, seats: 0 },
    ]);
  };

  const removeCategory = (id) =>
    setCategories((c) => c.filter((cat) => cat.id !== id));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.({ ...form, categories });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Heading */}
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Create event</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Row 1: Event name + Venue */}
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Event name</label>
              <input
                type="text"
                placeholder="Team A vs Team B"
                value={form.name}
                onChange={set("name")}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Venue</label>
              <input
                type="text"
                placeholder="Lagos National Stadium"
                value={form.venue}
                onChange={set("venue")}
                required
              />
            </div>
          </div>

          {/* Row 2: Date + Kickoff time */}
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={set("date")}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Kickoff time</label>
              <input
                type="time"
                value={form.kickoff}
                onChange={set("kickoff")}
                required
              />
            </div>
          </div>

          {/* Row 3: Total capacity + Sales status */}
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Total capacity</label>
              <input
                type="number"
                placeholder="5,000"
                value={form.capacity}
                onChange={set("capacity")}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Sales status</label>
              <select value={form.status} onChange={set("status")}>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Ticket categories */}
          <div className={styles.categories}>
            {categories.map((cat) => (
              <div key={cat.id} className={styles.categoryPill}>
                <span className={styles.catName}>{cat.name}</span>
                <span className={styles.catDash}>—</span>
                <span className={styles.catDetail}>
                  ₦{cat.price.toLocaleString()} · {cat.seats.toLocaleString()} seats
                </span>
                <button
                  type="button"
                  className={styles.removeCat}
                  onClick={() => removeCategory(cat.id)}
                  aria-label="Remove category"
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addCategory}
              onClick={addCategory}
            >
              <Plus size={13} strokeWidth={2.5} />
              Add category
            </button>
          </div>

          {/* Submit */}
          <button type="submit" className={styles.publishBtn}>
            Publish event
          </button>
        </form>
      </div>
    </div>
  );
}
