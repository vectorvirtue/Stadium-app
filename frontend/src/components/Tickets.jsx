import { useCallback, useEffect, useState } from "react";
import { api, money } from "../lib/api";
import styles from "./Tickets.module.css";

export default function Tickets() {
  const [orders, setOrders] = useState([]); const [error, setError] = useState(""); const [busyId, setBusyId] = useState("");
  const load = useCallback(() => api("/tickets").then(setOrders).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  async function cancel(id) { setBusyId(id); setError(""); try { await api(`/tickets/${id}/cancel`, { method: "POST" }); await load(); } catch (e) { setError(e.message); } finally { setBusyId(""); } }
  return <section>
    <h1 className={styles.heading}>My Tickets & Orders</h1>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {!orders.length && !error && <p className={styles.empty}>No orders yet.</p>}
    <div className={styles.orders}>
      {orders.map((order) => <article key={order.id} className={styles.order}>
        <p className={styles.orderTop}>Order {order.id.slice(0, 8)}<span className={styles.status} data-status={order.status}>{order.status}</span></p>
        <p className={styles.orderMeta}>Total: {money(order.total_amount)} · {new Date(order.created_at).toLocaleString()}</p>
        <p className={styles.orderMeta}>Payment reference: {order.paystack_reference}</p>
        {order.status === "pending" && <button className={styles.cancelBtn} disabled={busyId === order.id} onClick={() => cancel(order.id)}>{busyId === order.id ? "Cancelling…" : "Cancel pending order"}</button>}
      </article>)}
    </div>
  </section>;
}
