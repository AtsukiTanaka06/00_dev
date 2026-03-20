import styles from "./ProgressBar.module.css";

interface Props {
  step: number;
  total: number;
  label: string;
}

export default function ProgressBar({ step, total, label }: Props) {
  const percent = Math.round((step / total) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.count}>{step} / {total}</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <div className={styles.steps}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`${styles.dot} ${i < step ? styles.done : ""} ${i === step - 1 ? styles.active : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
