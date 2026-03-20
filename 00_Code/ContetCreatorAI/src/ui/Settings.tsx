import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../store/settingsStore";
import { usePromptStore, PROMPT_LABELS, DEFAULT_PROMPTS, type PromptKey } from "../store/promptStore";
import { useLicenseStore } from "../store/licenseStore";
import { useAuthStore } from "../store/authStore";
import { findLicense, activateLicense, getMyLicense } from "../auth/license";
import styles from "./Settings.module.css";

type AIProvider = "openai" | "claude";
type SettingsTab = "general" | "prompts";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BackButton />
        <h2 className={styles.title}>設定</h2>
      </div>

      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === "general" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("general")}
        >
          一般
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "prompts" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("prompts")}
        >
          プロンプト
        </button>
      </div>

      {activeTab === "general" ? <GeneralSettings /> : <PromptSettings />}
    </div>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return (
    <button className={styles.backButton} onClick={() => navigate("/app")}>
      ← 戻る
    </button>
  );
}

/* ─── 一般設定 ─── */
function GeneralSettings() {
  const { aiProvider, openaiApiKey, claudeApiKey, notionApiKey, saveSettings, loadFromStorage } =
    useSettingsStore();

  const [form, setForm] = useState({
    aiProvider: aiProvider as AIProvider,
    openaiApiKey,
    claudeApiKey,
    notionApiKey,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [showKeys, setShowKeys] = useState({ openai: false, claude: false, notion: false });

  useEffect(() => {
    loadFromStorage().then(() => {
      const s = useSettingsStore.getState();
      setForm({ aiProvider: s.aiProvider, openaiApiKey: s.openaiApiKey, claudeApiKey: s.claudeApiKey, notionApiKey: s.notionApiKey });
    });
  }, [loadFromStorage]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(form);
      showToast(setToast, "設定を保存しました");
    } catch {
      showToast(setToast, "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.content}>
      {/* ライセンス管理 */}
      <LicenseSection onToast={(msg) => showToast(setToast, msg)} />

      {/* AI Provider */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>AIプロバイダー</h3>
        <div className={styles.radioGroup}>
          {(["openai", "claude"] as AIProvider[]).map((p) => (
            <label key={p} className={styles.radioLabel}>
              <input
                type="radio"
                name="aiProvider"
                value={p}
                checked={form.aiProvider === p}
                onChange={() => setForm((f) => ({ ...f, aiProvider: p }))}
                className={styles.radio}
              />
              <span>{p === "openai" ? "OpenAI (GPT-4o)" : "Anthropic (Claude)"}</span>
            </label>
          ))}
        </div>
      </section>

      {/* API Keys */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>APIキー</h3>
        <p className={styles.hint}>APIキーはローカルに暗号化して保存されます。</p>
        <ApiKeyField label="OpenAI API Key" value={form.openaiApiKey} show={showKeys.openai}
          onToggle={() => setShowKeys((s) => ({ ...s, openai: !s.openai }))}
          onChange={(v) => setForm((f) => ({ ...f, openaiApiKey: v }))} placeholder="sk-..." />
        <ApiKeyField label="Claude API Key" value={form.claudeApiKey} show={showKeys.claude}
          onToggle={() => setShowKeys((s) => ({ ...s, claude: !s.claude }))}
          onChange={(v) => setForm((f) => ({ ...f, claudeApiKey: v }))} placeholder="sk-ant-..." />
        <ApiKeyField label="Notion API Key" value={form.notionApiKey} show={showKeys.notion}
          onToggle={() => setShowKeys((s) => ({ ...s, notion: !s.notion }))}
          onChange={(v) => setForm((f) => ({ ...f, notionApiKey: v }))} placeholder="secret_..." />
      </section>

      <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
        {saving ? "保存中..." : "設定を保存"}
      </button>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}

/* ─── ライセンス管理セクション ─── */
function LicenseSection({ onToast }: { onToast: (msg: string) => void }) {
  const { user } = useAuthStore();
  const { plan, status, setLicense } = useLicenseStore();
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isActivated = status === "active";

  const handleActivate = async () => {
    if (!licenseKey.trim() || !user) return;
    setError("");
    setLoading(true);
    try {
      const existing = await getMyLicense(user.id);
      if (existing) {
        setLicense(existing.plan, existing.status);
        onToast("ライセンスを確認しました");
        return;
      }
      const license = await findLicense(licenseKey.trim());
      if (!license) { setError("ライセンスキーが見つかりません"); return; }
      if (license.status !== "inactive") { setError("このキーはすでに使用されています"); return; }

      const ok = await activateLicense(license.id, user.id);
      if (!ok) { setError("有効化に失敗しました"); return; }

      setLicense(license.plan, "active");
      setLicenseKey("");
      onToast(`Proライセンスを有効化しました`);
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>ライセンス</h3>
      <div className={styles.licenseStatus}>
        <span className={styles.licenseLabel}>現在のプラン</span>
        <span className={`${styles.licenseBadge} ${plan === "pro" && isActivated ? styles.pro : ""}`}>
          {plan === "pro" && isActivated ? "Pro" : "Free"}
        </span>
      </div>

      {!(plan === "pro" && isActivated) && (
        <div className={styles.licenseForm}>
          <div className={styles.inputRow}>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className={styles.input}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              disabled={loading}
            />
            <button
              className={styles.activateBtn}
              onClick={handleActivate}
              disabled={loading || !licenseKey.trim()}
            >
              {loading ? "確認中..." : "有効化"}
            </button>
          </div>
          {error && <p className={styles.licenseError}>{error}</p>}
        </div>
      )}
    </section>
  );
}

/* ─── プロンプト設定 ─── */
function PromptSettings() {
  const { prompts, savePrompts, resetPrompt, loadFromStorage } = usePromptStore();
  const [form, setForm] = useState<Record<PromptKey, string>>({ ...prompts });
  const [activeStep, setActiveStep] = useState<PromptKey>("topicExtractor");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadFromStorage().then(() => {
      setForm({ ...usePromptStore.getState().prompts });
    });
  }, [loadFromStorage]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePrompts(form);
      showToast(setToast, "プロンプトを保存しました");
    } catch {
      showToast(setToast, "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (key: PromptKey) => {
    await resetPrompt(key);
    setForm((f) => ({ ...f, [key]: DEFAULT_PROMPTS[key] }));
    showToast(setToast, `「${PROMPT_LABELS[key]}」をデフォルトに戻しました`);
  };

  const steps = Object.keys(PROMPT_LABELS) as PromptKey[];

  return (
    <div className={styles.content}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>ステップ別システムプロンプト</h3>
        <p className={styles.hint}>各生成ステップのAIへの指示（システムプロンプト）を編集できます。</p>

        <div className={styles.stepNav}>
          {steps.map((key) => (
            <button
              key={key}
              className={`${styles.stepBtn} ${activeStep === key ? styles.stepActive : ""}`}
              onClick={() => setActiveStep(key)}
            >
              {PROMPT_LABELS[key]}
            </button>
          ))}
        </div>

        <div className={styles.promptEditor}>
          <div className={styles.promptHeader}>
            <span className={styles.promptLabel}>{PROMPT_LABELS[activeStep]}</span>
            <button className={styles.resetBtn} onClick={() => handleReset(activeStep)}>
              デフォルトに戻す
            </button>
          </div>
          <textarea
            className={styles.promptTextarea}
            value={form[activeStep]}
            onChange={(e) => setForm((f) => ({ ...f, [activeStep]: e.target.value }))}
            rows={12}
            spellCheck={false}
          />
          <p className={styles.promptHint}>変更後は「保存」ボタンを押すと次回の生成から反映されます。</p>
        </div>
      </section>

      <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
        {saving ? "保存中..." : "プロンプトを保存"}
      </button>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}

/* ─── 共通コンポーネント・ユーティリティ ─── */
function ApiKeyField({ label, value, show, onToggle, onChange, placeholder }: {
  label: string; value: string; show: boolean;
  onToggle: () => void; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.inputRow}>
        <input type={show ? "text" : "password"} value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.input} placeholder={placeholder} />
        <button type="button" className={styles.toggleBtn} onClick={onToggle}>
          {show ? "隠す" : "表示"}
        </button>
      </div>
    </div>
  );
}

function showToast(setter: (v: string) => void, msg: string) {
  setter(msg);
  setTimeout(() => setter(""), 3000);
}
