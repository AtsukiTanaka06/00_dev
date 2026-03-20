import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import type { PipelineResult } from "../types/pipeline";
import TabPanel from "../components/TabPanel";
import type { Tab } from "../components/TabPanel";
import NotionSaveModal from "../components/NotionSaveModal";
import styles from "./ResultsView.module.css";

export default function ResultsView() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as PipelineResult | undefined;
  const [showNotion, setShowNotion] = useState(false);

  if (!result) {
    navigate("/app");
    return null;
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const tabs: Tab[] = [
    {
      id: "topics",
      label: "トピック",
      content: (
        <div className={styles.topicsSection}>
          <h3 className={styles.topicsTitle}>抽出されたトピック</h3>
          <ul className={styles.topicList}>
            {result.topics.map((t, i) => (
              <li key={i} className={styles.topicItem}>{t}</li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: "research",
      label: "リサーチ",
      content: <MarkdownPane content={result.research} onCopy={() => copyToClipboard(result.research)} />,
    },
    {
      id: "requirements",
      label: "要件定義",
      content: <MarkdownPane content={result.requirements} onCopy={() => copyToClipboard(result.requirements)} />,
    },
    {
      id: "strategy",
      label: "戦略",
      content: <MarkdownPane content={result.strategy} onCopy={() => copyToClipboard(result.strategy)} />,
    },
    {
      id: "contents",
      label: "コンテンツ",
      content: <MarkdownPane content={result.contents} onCopy={() => copyToClipboard(result.contents)} />,
    },
    {
      id: "script",
      label: "スクリプト",
      content: <MarkdownPane content={result.script} onCopy={() => copyToClipboard(result.script)} />,
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/app")}>
          ← 新しく生成
        </button>
        <h2 className={styles.title}>生成結果</h2>
        <button
          className={styles.notionBtn}
          onClick={() => setShowNotion(true)}
        >
          Notionに保存
        </button>
      </header>

      <div className={styles.tabContainer}>
        <TabPanel tabs={tabs} />
      </div>

      {showNotion && (
        <NotionSaveModal result={result} onClose={() => setShowNotion(false)} />
      )}
    </div>
  );
}

function MarkdownPane({ content, onCopy }: { content: string; onCopy: () => void }) {
  return (
    <div className={styles.pane}>
      <button className={styles.copyBtn} onClick={onCopy}>
        コピー
      </button>
      <div className={styles.markdown}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
