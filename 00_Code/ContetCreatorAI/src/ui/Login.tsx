import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import styles from "./Login.module.css";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { signIn, signUp } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        setMessage("確認メールを送信しました。メールを確認してください。");
      } else {
        await signIn(email, password);
        navigate("/license");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "エラーが発生しました";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>ContentCreatorAI</h1>
        <p className={styles.subtitle}>会議トランスクリプトからコンテンツを自動生成</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="example@email.com"
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="6文字以上"
              disabled={loading}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "処理中..." : isSignUp ? "アカウント作成" : "ログイン"}
          </button>
        </form>

        <button
          className={styles.toggle}
          onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
        >
          {isSignUp ? "すでにアカウントをお持ちの方はこちら" : "アカウントをお持ちでない方はこちら"}
        </button>
      </div>
    </div>
  );
}
