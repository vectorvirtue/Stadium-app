import { useEffect, useState } from "react";
import styles from "./TicketSales.module.css";
import NotFound from "../../pages/NotFound";
import { api, money } from "../../lib/api";

const STATUS_LABEL = { issued: "Issued", checked_in: "Used", void: "Denied-reused" };

function statusClass(status, styles) {
  if (status === "checked_in") return styles.badgeUsed;
  if (status === "issued") return styles.badgeIssued;
  if (status === "void") return styles.badgeDenied;
  return "";
}

export default function TicketSales({ search = "", onCreateEvent }) {
  const [sales, setSales] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/admin/tickets").then(setSales).catch((e) => setError(e.message));
  }, []);

  if (error) return <p role="alert" style={{ color: "#b42318" }}>{error}</p>;

  const query = search.trim().toLowerCase();
  const filtered = sales && query
    ? sales.filter((s) => `${s.holder_name} ${s.ticket_code} ${s.category}`.toLowerCase().includes(query))
    : sales;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Ticket Sales</h2>
      <p className={styles.sub}>Ticket Management</p>

      {!sales ? (
        <p>Loading ticket sales…</p>
      ) : sales.length === 0 ? (
        <NotFound message="No event, No ticket sales" onCreateEvent={onCreateEvent} />
      ) : filtered.length === 0 ? (
        <p className={styles.sub}>No tickets match "{search}".</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Holder</th>
                <th>Category</th>
                <th>Payment</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale) => (
                <tr key={sale.id}>
                  <td className={styles.ticketId}>{sale.ticket_code}</td>
                  <td>{sale.holder_name}</td>
                  <td>{sale.category}</td>
                  <td>{money(sale.payment)}</td>
                  <td>
                    <span className={`${styles.badge} ${statusClass(sale.status, styles)}`}>
                      {STATUS_LABEL[sale.status] || sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
