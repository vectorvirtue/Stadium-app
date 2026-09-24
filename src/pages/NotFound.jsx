import styles from "./NotFound.module.css";
import notfound from '../assets/404.svg';

export default function NotFound({ message = "No events", onCreateEvent }) {
  return (
    <div className={styles.wrapper}>
      <img className={styles.image} src={notfound} alt="No data" />
      <h3 className={styles.title}>{message}</h3>
      <button className={styles.btn} onClick={onCreateEvent}>
        Create an Event
      </button>
    </div>
  );
}
