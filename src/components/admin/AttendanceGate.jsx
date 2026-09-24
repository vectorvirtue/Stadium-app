import styles from "./AttendanceGate.module.css";
import NotFound from "../../pages/NotFound";
import ticket from "../../assets/Tickets.svg";

const GATES = [
  { id: 1, label: "Gate 1 Entries", count: 812,  denied: 0  },
  { id: 2, label: "Gate 2 Entries", count: 1045, denied: 3  },
  { id: 3, label: "Gate 3 Entries", count: 960,  denied: 1  },
  { id: 4, label: "Gate 4 Entries", count: 93,   denied: 14 },
];

const ATTENDANCE = [
  { id: 1, ticketId: "TCKT-8841", holder: "Femi Balogun",  category: "VIP",     time: "N25,750", result: "Granted" },
  { id: 2, ticketId: "TCKT-8841", holder: "Aisha Bello",   category: "Premium", time: "N12,300", result: "Granted" },
  { id: 3, ticketId: "TCKT-8841", holder: "Chidi Okafor",  category: "Regular", time: "N5,200",  result: "Denied"  },
  { id: 4, ticketId: "TCKT-8841", holder: "Grace Udo",     category: "VIP",     time: "N25,750", result: "Granted" },
  { id: 5, ticketId: "TCKT-8841", holder: "Sam Eze",       category: "Regular", time: "N5,200",  result: "Granted" },
  { id: 6, ticketId: "TCKT-8841", holder: "Japheth Ehis",  category: "Regular", time: "N5,200",  result: "Granted" },
];

export default function AttendanceGate() {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Attendance / Gate</h2>
      <p className={styles.sub}>Gate access and attendance tracking</p>

      {ATTENDANCE.length === 0 ? (
        <NotFound message="No event, No attendance" />
      ) : (
        <>
          {/* Gate stat cards */}
          <div className={styles.gateCards}>
            {GATES.map((gate) => (
              <div key={gate.id} className={styles.gateCard}>
                <div className={styles.gateCardTop}>
                  <span className={styles.gateLabel}>{gate.label}</span>
                  <div className={styles.gateIcon}>
                    <img src={ticket} alt="" />
                  </div>
                </div>
                <p className={styles.gateCount}>{gate.count.toLocaleString()}</p>
                <p className={styles.deniedNonZero}>
                  {gate.denied} Denied
                </p>
              </div>
            ))}
          </div>

          {/* Attendance table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Holder</th>
                  <th>Category</th>
                  <th>Time</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {ATTENDANCE.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.ticketId}>{row.ticketId}</td>
                    <td>{row.holder}</td>
                    <td>{row.category}</td>
                    <td>{row.time}</td>
                    <td>
                      <span className={`${styles.badge} ${row.result === "Granted" ? styles.badgeGranted : styles.badgeDenied}`}>
                        {row.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
