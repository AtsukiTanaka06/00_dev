# タスク管理アプリ 仕様書

## 1. 概要

ログイン機能付きのシンプルなタスク管理アプリ。ユーザーごとにタスクを管理できる最小構成のWebアプリケーション。

---

## 2. 技術スタック

| カテゴリ | 技術 | 備考 |
|---|---|---|
| フレームワーク | Next.js 15 (App Router) | フルスタックフレームワーク |
| バックエンド / DB | Supabase | 認証・データベース・API |
| 言語 | TypeScript | 型安全性の確保 |
| スタイリング | Tailwind CSS | ユーティリティファーストCSS |
| フォームバリデーション | zod + react-hook-form | 入力検証 |
| パッケージマネージャー | npm | 標準構成 |

### 補足・提案

- **Supabase Auth** をそのまま認証基盤として利用（JWTセッション管理含む）
- **Supabase Row Level Security (RLS)** を有効化し、ユーザーが自分のタスクのみ操作できるようDB側で制御する
- **Next.js Server Actions** を使いAPI Routeを最小化する（`/api` ディレクトリを極力作らない）

---

## 3. 機能要件

### 3.1 認証機能

| # | 機能 | 詳細 |
|---|---|---|
| A-1 | メールアドレス登録 | メール＋パスワードで新規アカウント作成 |
| A-2 | メールログイン | メール＋パスワードでログイン |
| A-3 | Googleログイン | Googleアカウントを使ったOAuth 2.0ログイン |
| A-4 | ログアウト | セッションを破棄してログイン画面へリダイレクト |
| A-5 | 未認証時のアクセス制御 | 未ログインユーザーはログイン画面へリダイレクト |

### 3.2 タスク管理機能

| # | 機能 | 詳細 |
|---|---|---|
| T-1 | タスク一覧表示 | ログインユーザーのタスクを一覧表示（作成日降順） |
| T-2 | タスク追加 | タイトルを入力してタスクを新規作成 |
| T-3 | タスク完了トグル | チェックボックスで完了／未完了を切り替え |
| T-4 | タスク削除 | タスクを削除する |

> 最小構成のため、タスクの編集・期日・優先度はスコープ外。

---

## 4. 非機能要件

| 項目 | 要件 |
|---|---|
| レスポンシブ | モバイル・デスクトップ両対応 |
| セキュリティ | RLSによる他ユーザーのデータアクセス禁止 |
| パフォーマンス | Server Componentsを活用しクライアントJSを最小化 |
| 環境変数 | Supabaseのキー等は `.env.local` で管理、リポジトリにはコミットしない |

---

## 5. 画面設計

### 画面一覧

| 画面名 | パス | 説明 |
|---|---|---|
| ログイン画面 | `/login` | メール・パスワード入力フォーム |
| 新規登録画面 | `/signup` | メール・パスワード入力フォーム |
| タスク一覧画面 | `/` | タスクの一覧・追加・削除・完了トグル |

### 画面遷移

```
[未ログイン]
  → / にアクセス → /login にリダイレクト
  → /login でメールログイン成功 → / にリダイレクト
  → /login で「Googleでログイン」ボタン押下 → Google認証画面へ → /auth/callback → /
  → /signup で登録成功 → / にリダイレクト

[ログイン済み]
  → / でタスク管理
  → ログアウトボタン押下 → /login にリダイレクト
```

### OAuth コールバックルート

Supabase の OAuth フローでは、Google 認証後にコールバック URL へリダイレクトされる。

| パス | 説明 |
|---|---|
| `/auth/callback` | Supabase がセッションを確立した後、`/` にリダイレクトする処理を担う Route Handler |

---

## 6. データベース設計（Supabase）

### テーブル: `tasks`

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | `uuid` | PK, default gen_random_uuid() | タスクID |
| `user_id` | `uuid` | NOT NULL, FK → auth.users.id | 作成ユーザー |
| `title` | `text` | NOT NULL | タスクタイトル |
| `is_completed` | `boolean` | NOT NULL, default false | 完了フラグ |
| `created_at` | `timestamptz` | NOT NULL, default now() | 作成日時 |

### RLS ポリシー

```sql
-- tasksテーブルのRLSを有効化
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 自分のタスクのみ参照可
CREATE POLICY "users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- 自分のタスクのみ作成可
CREATE POLICY "users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のタスクのみ更新可
CREATE POLICY "users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- 自分のタスクのみ削除可
CREATE POLICY "users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 7. ディレクトリ構成

```
TodoApp/
├── doc/
│   └── spec.md               # 本仕様書
├── src/
│   ├── app/
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # タスク一覧画面 (/)
│   │   ├── login/
│   │   │   └── page.tsx       # ログイン画面
│   │   ├── signup/
│   │   │   └── page.tsx       # 新規登録画面
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts   # OAuth コールバック Route Handler
│   ├── components/
│   │   ├── TaskList.tsx       # タスク一覧コンポーネント
│   │   ├── TaskItem.tsx       # タスク単体コンポーネント
│   │   └── AddTaskForm.tsx    # タスク追加フォーム
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts      # クライアントサイド Supabase クライアント
│   │       └── server.ts      # サーバーサイド Supabase クライアント
│   └── actions/
│       └── tasks.ts           # Server Actions (CRUD)
├── .env.local                 # 環境変数（gitignore対象）
├── .env.local.example         # 環境変数のサンプル
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 8. 環境変数

`.env.local.example` として管理：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Google OAuth のセットアップ手順

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 「OAuth 2.0 クライアント ID」を作成（種別: ウェブアプリケーション）
3. 承認済みリダイレクト URI に以下を追加：
   ```
   https://<your-project>.supabase.co/auth/v1/callback
   ```
4. 発行された **Client ID** と **Client Secret** を Supabase ダッシュボードの
   `Authentication → Providers → Google` に設定
5. Supabase ダッシュボードの `Authentication → URL Configuration` で
   **Site URL** と **Redirect URLs** に本番・ローカルの URL を設定：
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback
   ```

---

## 9. 今後の拡張候補（スコープ外）

- タスクの編集機能
- 期日・優先度の設定
- カテゴリ・タグ管理
- GitHubログイン等の追加ソーシャルプロバイダー
- ダークモード対応
