import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import styles from "./EventManagement.module.css";
import NewEventModal from "./modal/NewEventModal";
import NotFound from "../../pages/NotFound";
import { api, money } from "../../lib/api";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-NG", { day: "2-digit", month: "2-digit", year: "numeric" });
const formatTime = (value) =>
  new Date(value).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });

export default function EventManagement({ search = "" }) {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  function load() {
    api("/admin/matches")
      .then(setEvents)
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleDelete(event) {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/matches/${event.id}`, { method: "DELETE" });
      setEvents((list) => list.filter((e) => e.id !== event.id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleToggleStatus(event) {
    try {
      const updated = await api(`/admin/matches/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_published: !event.is_published }),
      });
      setEvents((list) => list.map((e) => (e.id === event.id ? { ...e, is_published: updated.is_published } : e)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreate(payload) {
    await api("/admin/matches", { method: "POST", body: JSON.stringify(payload) });
    setShowModal(false);
    load();
  }

  const query = search.trim().toLowerCase();
  const filteredEvents = events && query
    ? events.filter((e) => `${e.title} ${e.venue}`.toLowerCase().includes(query))
    : events;

  return (
    <div className={styles.wrapper}>
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

      {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}

      {!events ? (
        <p>Loading events…</p>
      ) : events.length === 0 ? (
        <NotFound onCreateEvent={() => setShowModal(true)} />
      ) : filteredEvents.length === 0 ? (
        <p className={styles.sub}>No events match "{search}".</p>
      ) : (
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
              {filteredEvents.map((event, i) => (
                <tr key={event.id}>
                  <td className={styles.serial}>#{i + 1}</td>
                  <td className={styles.name}>{event.title}</td>
                  <td>{event.venue}</td>
                  <td>{formatDate(event.kickoff_at)}</td>
                  <td>{formatTime(event.kickoff_at)}</td>
                  <td>{event.capacity.toLocaleString()} ({event.tickets_sold.toLocaleString()} sold · {money(event.revenue)})</td>
                  <td>
                    <span className={`${styles.badge} ${event.is_published ? styles.badgeOpen : styles.badgeClosed}`}>
                      {event.is_published ? "Open" : "Closed"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleToggleStatus(event)}
                        aria-label="Toggle sales status"
                        title={event.is_published ? "Close sales" : "Open sales"}
                      >
                        <Pencil size={14} strokeWidth={2} />
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(event)} aria-label="Delete event" title="Delete">
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

      {showModal && <NewEventModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
    </div>
  );
}
