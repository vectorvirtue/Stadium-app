import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import styles from "./EventManagement.module.css";
import NewEventModal from "./modal/NewEventModal";
import NotFound from "../../pages/NotFound";

// Placeholder data — swap with backend response
const EVENTS = [
  {
    id: 1,
    name: "Kano Pillars vs Warri Wolves",
    venue: "Abuja National Stadium",
    date: "14-11-2025",
    kickoff: "2:00pm",
    capacity: 5500,
    sales: 4076,
    status: "open",
  },
  {
    id: 2,
    name: "Enyimba vs Rivers United",
    venue: "Enyimba Stadium, Aba",
    date: "21-11-2025",
    kickoff: "4:00pm",
    capacity: 3000,
    sales: 3000,
    status: "closed",
  },
  {
    id: 3,
    name: "Lobi Stars vs Heartland FC",
    venue: "Makurdi Stadium",
    date: "28-11-2025",
    kickoff: "3:00pm",
    capacity: 4000,
    sales: 820,
    status: "open",
  },
];

export default function EventManagement({ onEdit, onDelete }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.topRow}>
        <div>
          <h2 className={styles.heading}>Event Management</h2>
          <p className={styles.sub}>Manage your events here.</p>
        </div>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          <Plus size={15} strokeWidth={2.5} />
          Create New Event
        </button>
      </div>

      {/* Empty state */}
      {EVENTS.length === 0 ? (
        <NotFound onCreateEvent={() => setShowModal(true)} />
      ) : (
        /* Table */
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Event Name</th>
                <th>Venue</th>
                <th>Date</th>
                <th>Kickoff</th>
                <th>Capacity</th>
                <th>Sales Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((event, i) => (
                <tr key={event.id}>
                  <td className={styles.serial}>#{i + 1}</td>
                  <td className={styles.name}>{event.name}</td>
                  <td>{event.venue}</td>
                  <td>{event.date}</td>
                  <td>{event.kickoff}</td>
                  <td>{event.capacity.toLocaleString()}</td>
                  <td>
                    <span className={`${styles.badge} ${event.status === "open" ? styles.badgeOpen : styles.badgeClosed}`}>
                      {event.status === "open" ? "Open" : "Closed"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => onEdit?.(event)} aria-label="Edit event" title="Edit">
                        <Pencil size={14} strokeWidth={2} />
                      </button>
                      <button className={styles.deleteBtn} onClick={() => onDelete?.(event)} aria-label="Delete event" title="Delete">
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Event Modal */}
      {showModal && (
        <NewEventModal
          onClose={() => setShowModal(false)}
          onSave={(data) => console.log("New event:", data)}
        />
      )}
    </div>
  );
}
