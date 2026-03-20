import { useState } from "react";
import styles from "./TabPanel.module.css";

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface Props {
  tabs: Tab[];
}

export default function TabPanel({ tabs }: Props) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${active === tab.id ? styles.active : ""}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.content}>
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
}
