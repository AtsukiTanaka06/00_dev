import { useState, useEffect } from "react";
import { searchDatabases, saveToNotion, type SaveToNotionResult } from "../api/notion";
import { useSettingsStore } from "../store/settingsStore";
import type { PipelineResult } from "../types/pipeline";
import styles from "./NotionSaveModal.module.css";

interface Props {
  result: PipelineResult;
  onClose: () => void;
}

export default function NotionSaveModal({ result, onClose }: Props) {
  const [databases, setDatabases] = useState<{ id: string; title: string }[]>([]);
  const [selectedDb, setSelectedDb] = useState("");
  const [title, setTitle] = useState("ContentCreatorAI 生成結果");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedUrls, setSavedUrls] = useState<SaveToNotionResult | null>(null);

  const { notionApiKey } = useSettingsStore.getState();

  useEffect(() => {
    if (!notionApiKey) {
      setError("Notion APIキーが設定されていません。設定画面で入力してください。");
      setFetching(false);
      return;
    }
    searchDatabases(notionApiKey)
      .then((dbs) => {
        setDatabases(dbs);
        if (dbs.length > 0) setSelectedDb(dbs[0].id);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "データベース取得に失敗しました");
      })
      .finally(() => setFetching(false));
  }, [notionApiKey]);

  const handleSave = async () => {
    if (!selectedDb) {
      setError("保存先データベースを選択してください");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const urls = await saveToNotion(selectedDb, result, title);
      setSavedUrls(urls);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Notionに保存</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!saved ? (
          <>
            {fetching ? (
              <p className={styles.loading}>データベース一覧を取得中...</p>
            ) : (
              <div className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>タイトル</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>保存先データベース</label>
                  {databases.length > 0 ? (
                    <select
                      value={selectedDb}
                      onChange={(e) => setSelectedDb(e.target.value)}
                      className={styles.select}
                      disabled={loading}
                    >
                      {databases.map((db) => (
                        <option key={db.id} value={db.id}>{db.title}</option>
                      ))}
                    </select>
                  ) : (
                    <p className={styles.noDb}>利用可能なデータベースが見つかりません</p>
                  )}
                </div>

                <p className={styles.hint}>
                  リサーチ・要件定義・戦略・コンテンツ・スクリプトの5ページを作成します。
                </p>

                {error && <p className={styles.error}>{error}</p>}

                <button
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={loading || databases.length === 0}
                >
                  {loading ? "保存中..." : "保存する"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.success}>
            <p className={styles.successMsg}>保存が完了しました！</p>
            {savedUrls && (
              <ul className={styles.urlList}>
                <li>
                  <a href={savedUrls.parent} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
                    Notionで開く（親ページ）→
                  </a>
                </li>
              </ul>
            )}
            <button className={styles.doneBtn} onClick={onClose}>閉じる</button>
          </div>
        )}
      </div>
    </div>
  );
}
