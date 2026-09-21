import styles from "./AdminHome.module.css";
import { TrendingUp } from "lucide-react";
import { TrendingDown } from "lucide-react";
import ticket from "../../assets/Tickets.svg"
import revenue from "../../assets/Frame.svg"
import checked from "../../assets/icon.svg"
import denied from "../../assets/icon (1).svg"
import SalesByCategory from "./SalesByCategory";
export default function AdminHome() {
  return (
    <>
    <div className={styles.wrapper}>
     <strong>Up Next: Kano  Pillars vs Warri Wolves</strong>
              <span>14Nov | 2:00pm | Abuja National Stadium</span>
    </div>

<div className={styles.statContainer}>
    <div className={styles.stats}>
      <div className={styles.headerContainer}>
        <div className={styles.header}>Total Sold Tickets</div>
        <div className={styles.icon}>
          <img src={ticket} alt="icon" />
        </div>
      </div>
      <div className={styles.counter}>
        4,076
      </div>
      <div className={styles.stat}>
<TrendingUp size={20} />
<span>Of 5,500 Capacity</span>
      </div>
    </div>
    <div className={styles.stats}>
      <div className={styles.headerContainer}>
        <div className={styles.header}>Revenue</div>
        <div className={styles.iconTwo} style={{
          backgroundColor:"#fec43d43",
        }}>
          <img src={revenue} alt="icon" />
        </div>
      </div>
      <div className={styles.counter}>
       ₦38.4M
      </div>
      <div className={styles.stat}>
<TrendingUp size={20} />
<span>13%</span> <span style={{
  color:"#606060"
}}>Up vs last game</span>
      </div>
    </div>
    <div className={styles.stats}>
      <div className={styles.headerContainer}>
        <div className={styles.header}>Checked In</div>
        <div className={styles.icon} style={{
          backgroundColor:"#4ad99242"
        }}>
          <img src={checked} alt="icon" />
        </div>
      </div>
      <div className={styles.counter}>
       2,910
      </div>
      <div className={styles.stat}>
<TrendingUp size={20}  />
<span>69%</span> <span style={{
  color:"#606060"
}}>Of Sold Tickets</span>
      </div>
    </div>
    <div className={styles.stats}>
      <div className={styles.headerContainer}>
        <div className={styles.header}>Denied Entries</div>
        <div className={styles.icon} style={{
          backgroundColor:"#ff8f6637"
        }}>
          <img src={denied} alt="icon" />
        </div>
      </div>
      <div className={styles.counter}>
      14
      </div>
      <div className={styles.stat}>
<TrendingDown size={20} color="#F93C65"/>
<span style={{
  color:"#F93C65"
}}>reused / invalid</span>
      </div>
    </div>
</div>

    <SalesByCategory />
    </>
  );
}
