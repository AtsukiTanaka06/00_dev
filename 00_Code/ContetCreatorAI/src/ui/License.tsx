import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useLicenseStore } from "../store/licenseStore";
import { findLicense, activateLicense, getMyLicense } from "../auth/license";
import styles from "./License.module.css";

export default function License() {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuthStore();
  const { setLicense, skip } = useLicenseStore();
  const navigate = useNavigate();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!key.trim()) {
      setError("ライセンスキーを入力してください");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      // まず既存のライセンスを確認
      const existing = await getMyLicense(user.id);
      if (existing) {
        setLicense(existing.plan, existing.status);
        navigate("/app");
        return;
      }

      const license = await findLicense(key.trim());
      if (!license) {
        setError("ライセンスキーが見つかりません");
        return;
      }
      if (license.status !== "inactive") {
        setError("このライセンスキーはすでに使用されています");
        return;
      }

      const ok = await activateLicense(license.id, user.id);
      if (!ok) {
        setError("ライセンスの有効化に失敗しました");
        return;
      }

      setLicense(license.plan, "active");
      navigate("/app");
    } catch {
      setError("エラーが発生しました。もう一度お試しください");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    skip();
    navigate("/app");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>ライセンス認証</h2>
        <p className={styles.description}>
          Proライセンスをお持ちの場合はキーを入力してください。
          <br />
          お持ちでない場合は無料プランでお試しいただけます（3回/日）。
        </p>

        <form onSubmit={handleActivate} className={styles.form}>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className={styles.input}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            disabled={loading}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "確認中..." : "ライセンスを有効化"}
          </button>
        </form>

        <div className={styles.divider}>または</div>

        <button className={styles.skipButton} onClick={handleSkip} disabled={loading}>
          無料プランで続ける
        </button>
      </div>
    </div>
  );
}
