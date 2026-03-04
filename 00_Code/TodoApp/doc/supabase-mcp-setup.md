# Supabase MCP 接続設定手順

## 概要

MCP（Model Context Protocol）を使うと、Claude Code から自然言語で Supabase プロジェクトを直接操作できる。
テーブルの作成・マイグレーション・SQLの実行・TypeScript型の生成などが AI との対話で可能になる。

- **ホスト型 MCP サーバー URL**: `https://mcp.supabase.com/mcp`
- **GitHub**: [supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp)

---

## 1. 前提条件

- [Node.js](https://nodejs.org/) がインストール済みであること（`npx` が使えること）
- [Claude Code CLI](https://claude.ai/claude-code) がインストール済みであること
- Supabase アカウントおよびプロジェクトが作成済みであること

---

## 2. 認証方法の選択

2種類の認証方法がある。通常の開発では **方法A（OAuth）** を推奨。

| 方法 | 適した場面 | 手間 |
|---|---|---|
| A. OAuth（ブラウザ認証） | ローカル開発・通常使用 | 少ない（自動） |
| B. Personal Access Token (PAT) | CI/CD・自動化環境 | やや多い（手動発行） |

---

## 3. 方法A：OAuth（推奨）

### 3.1 MCP サーバーを登録する

ターミナルで以下を実行する：

```bash
claude mcp add supabase -s project -- npx -y @supabase/mcp-server-supabase@latest
```

- `-s project` はプロジェクトスコープで登録（プロジェクト全体で有効）
- 特定プロジェクトに限定する場合は [4章](#4-プロジェクトスコープの設定（推奨）) を参照

### 3.2 認証を完了する

Claude Code を起動して Supabase の操作を依頼すると、初回のみブラウザが起動しログイン画面が表示される。

1. ブラウザで Supabase アカウントにログイン
2. 組織へのアクセスを許可
3. ブラウザを閉じて Claude Code に戻る

以降は自動的に認証が維持される。

---

## 4. 方法B：Personal Access Token (PAT)

### 4.1 PAT を発行する

1. [Supabase ダッシュボード](https://supabase.com/dashboard) にアクセス
2. 右上のアバター → **Account settings** → **Access Tokens**
3. **Generate new token** でトークンを発行し、安全な場所に保存する

### 4.2 MCP サーバーを PAT で登録する

```bash
claude mcp add supabase -s project -e SUPABASE_ACCESS_TOKEN=your_pat_here -- npx -y @supabase/mcp-server-supabase@latest
```

> `your_pat_here` を実際のトークンに置き換える。

---

## 5. プロジェクトスコープの設定（推奨）

デフォルトでは組織内の全プロジェクトにアクセスできる。
特定プロジェクトのみに制限することでセキュリティが向上する。

### 5.1 Project Ref を確認する

1. Supabase ダッシュボードでプロジェクトを開く
2. **Settings → General** の **Reference ID** をコピー（例: `abcdefghijklmnop`）

### 5.2 スコープを指定して登録する

**OAuth の場合：**

```bash
claude mcp add supabase -s project -- npx -y @supabase/mcp-server-supabase@latest --project-ref abcdefghijklmnop
```

**PAT の場合：**

```bash
claude mcp add supabase -s project -e SUPABASE_ACCESS_TOKEN=your_pat_here -- npx -y @supabase/mcp-server-supabase@latest --project-ref abcdefghijklmnop
```

---

## 6. 接続確認

### 登録済みサーバーの確認

```bash
claude mcp list
```

`supabase` が一覧に表示されていれば登録成功。

### 動作確認

Claude Code に対して以下のように話しかけて確認する：

```
Supabase の tasks テーブルの一覧を見せて
```

正常に接続されていれば、テーブル情報が返ってくる。

---

## 7. 利用できる主な操作

| カテゴリ | できること |
|---|---|
| データベース | テーブル一覧・SQL実行・マイグレーション管理・拡張機能 |
| 開発支援 | プロジェクト URL / APIキー取得・TypeScript型生成 |
| デバッグ | サービスログ取得・セキュリティアドバイザー |
| Edge Functions | 関数のデプロイ・管理 |
| ドキュメント | Supabase 公式ドキュメントの検索 |
| ブランチ管理 | DBブランチの作成・切り替え（有料プランのみ） |

---

## 8. セキュリティ上の注意

- **本番環境には接続しない** — 開発用プロジェクトのみに MCP を使う
- **プロジェクトスコープを必ず設定する** — 不要なプロジェクトへのアクセスを防ぐ
- **読み取り専用モード** — 本番データを参照するだけの場合は `--read-only` オプションを追加：
  ```bash
  npx -y @supabase/mcp-server-supabase@latest --project-ref <ref> --read-only
  ```
- **PAT はリポジトリにコミットしない** — `.env.local` や環境変数で管理する

---

## 参考リンク

- [Supabase MCP 公式ドキュメント](https://supabase.com/docs/guides/getting-started/mcp)
- [supabase-mcp GitHub リポジトリ](https://github.com/supabase-community/supabase-mcp)
