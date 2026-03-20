import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLicenseStore } from "../store/licenseStore";
import { runPipeline } from "../ai/pipeline";
import type { PipelineResult, PipelineProgress } from "../types/pipeline";
import ProgressBar from "../components/ProgressBar";
import styles from "./TranscriptInput.module.css";

const FREE_DAILY_LIMIT = 3;

export default function TranscriptInput() {
  const [transcript, setTranscript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [error, setError] = useState("");

  const { plan, dailyCount, canGenerate, incrementCount } = useLicenseStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") setTranscript(text);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const remaining = plan === "free" ? FREE_DAILY_LIMIT - dailyCount : null;

  const handleGenerate = async () => {
    setError("");

    if (!transcript.trim()) {
      setError("トランスクリプトを入力してください");
      return;
    }
    if (transcript.trim().length < 50) {
      setError("トランスクリプトが短すぎます（50文字以上）");
      return;
    }
    if (!canGenerate()) {
      setError("本日の生成回数の上限に達しました。Proプランにアップグレードしてください。");
      return;
    }

    setGenerating(true);
    try {
      const result: PipelineResult = await runPipeline(transcript, (p) => setProgress(p));
      incrementCount();
      navigate("/results", { state: { result } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "生成中にエラーが発生しました";
      setError(msg);
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>ContentCreatorAI</h1>
        <div className={styles.headerRight}>
          {plan === "free" && (
            <span className={styles.badge}>
              Free: 残り {remaining} 回/日
            </span>
          )}
          {plan === "pro" && (
            <span className={`${styles.badge} ${styles.pro}`}>Pro</span>
          )}
          <button
            className={styles.settingsBtn}
            onClick={() => navigate("/settings")}
          >
            ⚙ 設定
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.inputArea}>
          <label className={styles.label}>
            会議トランスクリプト
            <div className={styles.labelRight}>
              <span className={styles.charCount}>{transcript.length.toLocaleString()} 文字</span>
              <button
                type="button"
                className={styles.fileBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={generating}
              >
                ファイルを読み込む
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.text"
                style={{ display: "none" }}
                onChange={handleFileLoad}
              />
            </div>
          </label>
          <textarea
            className={styles.textarea}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="会議の文字起こしをここに貼り付けてください..."
            disabled={generating}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {generating && progress && (
          <div className={styles.progressArea}>
            <ProgressBar
              step={progress.step}
              total={progress.total}
              label={progress.label}
            />
          </div>
        )}

        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={generating || !canGenerate()}
        >
          {generating ? "生成中..." : "コンテンツを生成する"}
        </button>

        {plan === "free" && remaining === 0 && (
          <p className={styles.limitMsg}>
            本日の無料生成回数を使い切りました。明日また試すか、Proプランをご利用ください。
          </p>
        )}
      </main>
    </div>
  );
}
