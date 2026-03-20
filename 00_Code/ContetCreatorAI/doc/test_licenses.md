# テスト用ライセンスキー

**作成日:** 2026-03-15
**Supabaseプロジェクト:** ContentCreatorAI (`mzkwzsvmnpcpztzmnnum`)

---

## ライセンスキー一覧

| ライセンスキー | プラン | 状態 | 用途 |
|---|---|---|---|
| `CCAI-PRO1-2026-TEST` | Pro | inactive (未使用) | Proプランの動作確認 |
| `CCAI-PRO2-2026-TEST` | Pro | inactive (未使用) | 予備・複数アカウントテスト用 |
| `CCAI-FREE-2026-TEST` | Free | inactive (未使用) | Freeプラン制限（3回/日）の動作確認 |

> **注意:** 各キーは1アカウントにつき1回のみ有効化できます。
> 再利用が必要な場合はSupabaseダッシュボードで `user_id` を `NULL`、`status` を `inactive` にリセットしてください。

---

## 使い方

1. アプリを起動してログイン
2. License画面でキーを入力し **「ライセンスを有効化」** をクリック
3. 有効化されるとアカウントに紐付けられ、次回以降は自動認識される

---

## ライセンスキーのリセット方法

テストを繰り返す場合は、Supabaseダッシュボードの SQL Editor で以下を実行：

```sql
-- 特定のキーをリセット
UPDATE public.licenses
SET user_id = NULL,
    status = 'inactive',
    activated_at = NULL
WHERE license_key = 'CCAI-PRO1-2026-TEST';

-- 全テストキーをリセット
UPDATE public.licenses
SET user_id = NULL,
    status = 'inactive',
    activated_at = NULL
WHERE license_key LIKE 'CCAI-%2026-TEST';
```

---

## 新しいライセンスキーの追加方法

```sql
INSERT INTO public.licenses (license_key, plan, status)
VALUES ('CCAI-XXXX-XXXX-XXXX', 'pro', 'inactive');
```

---

## Freeプランの制限仕様

| 項目 | 内容 |
|---|---|
| 生成回数 | 3回/日 |
| カウントのリセット | アプリ再起動時（現在はメモリ管理） |
| 上限超過時 | エラーメッセージ表示・生成ボタン無効化 |
