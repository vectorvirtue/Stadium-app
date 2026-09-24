import styles from "./TicketSales.module.css";
import NotFound from "../../pages/NotFound";

// Placeholder — swap with backend response
const SALES = [
  { id: 1, ticketId: "TCKT-8841", holder: "Femi Balogun",  category: "VIP",     payment: "₦25,750", status: "Used" },
  { id: 2, ticketId: "TCKT-8841", holder: "Aisha Bello",   category: "Premium", payment: "₦12,300", status: "Issued" },
  { id: 3, ticketId: "TCKT-8841", holder: "Chidi Okafor",  category: "Regular", payment: "₦5,200",  status: "Denied-reused" },
  { id: 4, ticketId: "TCKT-8841", holder: "Grace Udo",     category: "VIP",     payment: "₦25,750", status: "Used" },
  { id: 5, ticketId: "TCKT-8841", holder: "Sam Eze",       category: "Regular", payment: "₦5,200",  status: "Issued" },
  { id: 6, ticketId: "TCKT-8841", holder: "Japheth Ehis",  category: "Regular", payment: "₦5,200",  status: "Used" },
];

function statusClass(status, styles) {
  if (status === "Used")          return styles.badgeUsed;
  if (status === "Issued")        return styles.badgeIssued;
  if (status === "Denied-reused") return styles.badgeDenied;
  return "";
}

export default function TicketSales() {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Ticket Sales</h2>
      <p className={styles.sub}>Ticket Management</p>

      {SALES.length === 0 ? (
        <NotFound message="No event, No ticket sales" />
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
              {SALES.map((sale) => (
                <tr key={sale.id}>
                  <td className={styles.ticketId}>{sale.ticketId}</td>
                  <td>{sale.holder}</td>
                  <td>{sale.category}</td>
                  <td>{sale.payment}</td>
                  <td>
                    <span className={`${styles.badge} ${statusClass(sale.status, styles)}`}>
                      {sale.status}
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
