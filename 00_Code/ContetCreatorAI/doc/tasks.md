# タスク管理

**プロジェクト名:** ContentCreatorAI
**作成日:** 2026-03-15

---

## フェーズ一覧

| フェーズ | 内容 | 優先度 |
|---|---|---|
| Phase 1 | プロジェクトセットアップ | 最高 |
| Phase 2 | 認証・ライセンス基盤 | 高 |
| Phase 3 | 設定画面・APIキー管理 | 高 |
| Phase 4 | AIパイプライン実装 | 高 |
| Phase 5 | UI実装 | 中 |
| Phase 6 | Notion連携 | 中 |
| Phase 7 | テスト・ポリッシュ | 中 |

---

## Phase 1: プロジェクトセットアップ

- [ ] **TASK-01** Tauriプロジェクト初期化
  - `npm create tauri-app@latest` でReact+TypeScriptテンプレートを生成
  - 既存ディレクトリ構成に合わせて調整
- [ ] **TASK-02** 依存パッケージのインストール
  - `@supabase/supabase-js`
  - `zustand` (状態管理)
  - `react-router-dom` (ルーティング)
  - `@tauri-apps/plugin-store` (セキュアストレージ)
  - `openai`
  - `@anthropic-ai/sdk`
  - `react-markdown` (Markdown表示)
- [ ] **TASK-03** Supabaseプロジェクト作成
  - Supabaseダッシュボードでプロジェクト作成
  - `users` テーブル確認 (Supabase Authが自動作成)
  - `licenses` テーブル作成
- [ ] **TASK-04** 環境変数設定
  - `.env` ファイル作成 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  - `.gitignore` に `.env` を追加
- [ ] **TASK-05** 基本ルーティング実装 (`App.tsx`)
  - `/login` → Login
  - `/license` → License
  - `/app` → TranscriptInput
  - `/results` → ResultsView
  - `/settings` → Settings
  - 認証ガード実装

---

## Phase 2: 認証・ライセンス基盤

- [ ] **TASK-06** Supabase Authクライアント実装 (`src/auth/supabase.ts`)
  - `signUp(email, password)`
  - `signIn(email, password)`
  - `signOut()`
  - `getSession()`
- [ ] **TASK-07** 認証状態管理 (`src/store/authStore.ts`)
  - `user` / `session` / `loading` 状態
  - `useAuth` フック
- [ ] **TASK-08** Login画面実装 (`src/ui/Login.tsx`)
  - Email/Passwordフォーム
  - Login / Sign Up の切替
  - バリデーション・エラー表示
- [ ] **TASK-09** licenses テーブル操作実装
  - ライセンスキー検索・検証
  - `user_id` への紐付け
  - ステータス更新
- [ ] **TASK-10** License画面実装 (`src/ui/License.tsx`)
  - ライセンスキー入力フォーム
  - Activateボタン
  - Freeプランのままスキップ機能
- [ ] **TASK-11** ライセンス状態管理 (`src/store/licenseStore.ts`)
  - `plan` / `status` / `dailyCount` 管理
  - 生成回数チェックロジック (Free: 3回/日)

---

## Phase 3: 設定画面・APIキー管理

- [ ] **TASK-12** セキュアストレージ実装 (`src/utils/secureStorage.ts`)
  - `tauri-plugin-store` ラッパー
  - `save(key, value)` / `load(key)` / `delete(key)`
- [ ] **TASK-13** 設定状態管理 (`src/store/settingsStore.ts`)
  - `aiProvider`: `"openai"` | `"claude"`
  - `openaiApiKey` / `claudeApiKey` / `notionApiKey` / `whimsicalApiKey`
  - 起動時にセキュアストレージから読み込み
- [ ] **TASK-14** Settings画面実装 (`src/ui/Settings.tsx`)
  - AI Provider ラジオボタン
  - 各APIキー入力フィールド (マスク表示)
  - 保存・トースト通知

---

## Phase 4: AIパイプライン実装

- [ ] **TASK-15** AIプロバイダー抽象化 (`src/ai/pipeline.ts`)
  - `AIProvider` インターフェース定義
  - OpenAI / Claude の切替ロジック
- [ ] **TASK-16** OpenAI クライアント実装 (`src/api/openai.ts`)
  - `ChatCompletion` API ラッパー
- [ ] **TASK-17** Claude クライアント実装 (`src/api/claude.ts`)
  - `Messages` API ラッパー
- [ ] **TASK-18** トピック抽出実装 (`src/ai/topicExtractor.ts`)
  - プロンプト設計
  - `topics: string[]` を返す
- [ ] **TASK-19** Whimsical API実装 (`src/api/whimsical.ts`)
  - マインドマップ生成API呼び出し
  - `mindmapUrl: string` を返す
- [ ] **TASK-20** リサーチ生成実装 (`src/ai/researchAgent.ts`)
  - プロンプト設計 (市場・競合・技術)
- [ ] **TASK-21** 要件定義生成実装 (`src/ai/requirementsGenerator.ts`)
  - プロンプト設計 (機能要件・非機能要件)
- [ ] **TASK-22** 戦略生成実装 (`src/ai/strategyGenerator.ts`)
  - プロンプト設計 (ターゲット・配信戦略)
- [ ] **TASK-23** コンテンツ生成実装 (`src/ai/contentGenerator.ts`)
  - プロンプト設計 (SNS・ブログコンテンツ)
- [ ] **TASK-24** スクリプト生成実装 (`src/ai/scriptGenerator.ts`)
  - プロンプト設計 (動画・配信スクリプト)
- [ ] **TASK-25** パイプライン統合 (`src/ai/pipeline.ts`)
  - TASK-18〜24を順次実行するオーケストレーター
  - 各ステップの進捗コールバック

---

## Phase 5: UI実装

- [ ] **TASK-26** 共通コンポーネント作成
  - `Button.tsx` / `Input.tsx` / `ProgressBar.tsx` / `TabPanel.tsx` / `ErrorMessage.tsx`
- [ ] **TASK-27** TranscriptInput画面実装 (`src/ui/TranscriptInput.tsx`)
  - テキストエリア (大きめ)
  - 残り生成回数表示 (Freeプラン)
  - Generateボタン
  - 生成中プログレスバー (7ステップ)
- [ ] **TASK-28** ResultsView画面実装 (`src/ui/ResultsView.tsx`)
  - タブ切替 (Mindmap / Research / Requirements / Strategy / Contents / Script)
  - Markdown レンダリング
  - 「Notionに保存」ボタン
  - 「コピー」ボタン

---

## Phase 6: Notion連携

- [ ] **TASK-29** Notion API クライアント実装 (`src/api/notion.ts`)
  - Database への ページ作成
  - 各生成物 (Research / Requirements 等) を個別ページとして保存
- [ ] **TASK-30** Notion保存フロー実装
  - Results画面の「Notionに保存」ボタンと連携
  - 保存完了通知

---

## Phase 7: テスト・ポリッシュ

- [ ] **TASK-31** ユニットテスト
  - パイプライン各ステップのテスト
  - ライセンスロジックのテスト
- [ ] **TASK-32** E2Eテスト
  - ログイン → 生成 → 結果表示フローのテスト
- [ ] **TASK-33** エラーハンドリング強化
  - API失敗時のリトライ (最大3回)
  - ネットワークエラー対応
- [ ] **TASK-34** UIポリッシュ
  - ローディング状態の整備
  - レスポンシブ対応
  - アクセシビリティ改善
- [ ] **TASK-35** ビルド・パッケージング
  - Windows / macOS 向けビルド設定
  - アイコン作成・設定
  - `tauri build` で配布用バイナリ生成

---

## 進捗サマリー

| フェーズ | 完了 | 合計 |
|---|---|---|
| Phase 1 | 5 | 5 |
| Phase 2 | 6 | 6 |
| Phase 3 | 3 | 3 |
| Phase 4 | 11 | 11 |
| Phase 5 | 3 | 3 |
| Phase 6 | 2 | 2 |
| Phase 7 | 3 | 5 |
| **合計** | **33** | **35** |

> TASK-31 (ユニットテスト) / TASK-32 (E2Eテスト) は実装骨格完成後に追加予定
