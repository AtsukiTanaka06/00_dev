# 詳細仕様書

**プロジェクト名:** ContentCreatorAI
**作成日:** 2026-03-15
**バージョン:** 1.0.0

---

## 1. ディレクトリ構成

```
content-creator-ai/
├── src/                          # フロントエンド (React + TypeScript)
│   ├── ui/                       # ページコンポーネント
│   │   ├── App.tsx               # ルーティング・認証ガード
│   │   ├── Login.tsx             # Screen 1: ログイン・サインアップ
│   │   ├── License.tsx           # Screen 2: ライセンス認証
│   │   ├── TranscriptInput.tsx   # Screen 3: トランスクリプト入力
│   │   ├── ResultsView.tsx       # Screen 4: 生成結果表示
│   │   └── Settings.tsx          # Screen 5: API設定
│   ├── ai/                       # AIパイプライン
│   │   ├── pipeline.ts           # パイプライン全体のオーケストレーション
│   │   ├── topicExtractor.ts     # ステップ1: トピック抽出
│   │   ├── researchAgent.ts      # ステップ3: リサーチ生成
│   │   ├── requirementsGenerator.ts  # ステップ4: 要件定義生成
│   │   ├── strategyGenerator.ts  # ステップ5: 戦略生成
│   │   ├── contentGenerator.ts   # ステップ6: コンテンツ生成
│   │   └── scriptGenerator.ts    # ステップ7: スクリプト生成
│   ├── api/                      # 外部API統合
│   │   ├── openai.ts             # OpenAI API クライアント
│   │   ├── claude.ts             # Claude API クライアント
│   │   └── notion.ts             # Notion API クライアント
│   ├── auth/                     # 認証
│   │   └── supabase.ts           # Supabase Auth クライアント
│   ├── store/                    # 状態管理 (Zustand)
│   │   ├── authStore.ts          # 認証状態
│   │   ├── licenseStore.ts       # ライセンス状態
│   │   ├── pipelineStore.ts      # パイプライン進捗・結果
│   │   └── settingsStore.ts      # 設定値
│   ├── types/                    # TypeScript型定義
│   │   └── index.ts
│   ├── hooks/                    # カスタムフック
│   │   ├── useAuth.ts
│   │   ├── useLicense.ts
│   │   └── usePipeline.ts
│   ├── components/               # 共通UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── TabPanel.tsx
│   │   └── ErrorMessage.tsx
│   └── utils/
│       ├── secureStorage.ts      # Tauriセキュアストレージラッパー
│       └── markdown.ts           # Markdownユーティリティ
├── src-tauri/                    # Rustバックエンド (Tauri)
│   ├── src/
│   │   └── main.rs               # Tauriメインプロセス
│   ├── icons/                    # アプリアイコン
│   ├── Cargo.toml
│   └── tauri.conf.json
├── doc/                          # ドキュメント
│   ├── requirements.md           # 要件定義書
│   ├── specification.md          # 詳細仕様書 (本ファイル)
│   ├── tasks.md                  # タスク管理
│   └── architecture.md          # アーキテクチャ図
├── tests/
│   ├── unit/                     # ユニットテスト
│   └── e2e/                      # E2Eテスト
├── prompt.md                     # プロジェクト概要メモ
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 2. 画面仕様

### Screen 1: Login

```
┌─────────────────────────────────┐
│         ContentCreatorAI        │
│                                 │
│  Email    [________________]    │
│  Password [________________]    │
│                                 │
│         [   Login   ]           │
│                                 │
│     アカウントをお持ちでない方          │
│         [ Sign Up ]             │
└─────────────────────────────────┘
```

**処理:**
1. Supabase `signInWithPassword(email, password)`
2. 成功 → ライセンスチェック → Screen 2 または Screen 3
3. 失敗 → エラーメッセージ表示

---

### Screen 2: License Activation

```
┌─────────────────────────────────┐
│       License Activation        │
│                                 │
│  License Key                    │
│  [____________________________] │
│                                 │
│         [ Activate ]            │
│                                 │
│  ※ Free プランで続ける             │
└─────────────────────────────────┘
```

**処理:**
1. `licenses` テーブルで `license_key` を検索
2. 一致 → `status = active` に更新、`user_id` に紐付け
3. プランに応じて Screen 3 へ遷移

---

### Screen 3: Transcript Input

```
┌─────────────────────────────────┐
│  ContentCreatorAI    [Settings] │
├─────────────────────────────────┤
│  会議トランスクリプトを入力してください    │
│  ┌───────────────────────────┐  │
│  │ 田中: ツールを作りたい...   │  │
│  │ 佐藤: 1000人を抽出したい.. │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  残り生成回数: 3回 (Free)          │
│                                 │
│         [ Generate ]            │
└─────────────────────────────────┘
```

**処理:**
1. Freeプランの場合、当日の生成回数をチェック（3回上限）
2. `pipeline.ts` を呼び出し、非同期でパイプライン実行
3. 進捗をプログレスバーで表示
4. 完了後 → Screen 4 へ遷移

---

### Screen 4: Results

```
┌─────────────────────────────────┐
│  生成結果                         │
├─────────────────────────────────┤
│ [Topics][Research][Requirements] │
│ [Strategy][Contents][Script]    │
├─────────────────────────────────┤
│                                 │
│  ## リサーチ結果                   │
│  ...                            │
│                                 │
│  [ Notionに保存 ] [ コピー ]       │
└─────────────────────────────────┘
```

**タブ:**
- `Topics` → 抽出されたトピック一覧表示
- `Research` / `Requirements` / `Strategy` / `Contents` / `Script` → Markdown表示

---

### Screen 5: Settings

```
┌─────────────────────────────────┐
│  Settings                       │
├─────────────────────────────────┤
│  AI Provider                    │
│  ( ) OpenAI  (●) Claude         │
│                                 │
│  OpenAI API Key                 │
│  [____________________________] │
│                                 │
│  Claude API Key                 │
│  [____________________________] │
│                                 │
│  Notion API Key                 │
│  [____________________________] │
│                                 │
│         [  保存  ]               │
└─────────────────────────────────┘
```

**処理:**
- 各APIキーを `tauri-plugin-store` または OS keychain に暗号化保存
- 保存後にトースト通知

---

## 3. AIパイプライン仕様

### 3.1 パイプライン全体フロー

```
入力: transcript (string)
  │
  ▼
[1] topicExtractor.ts
    → topics: string[]
  │
  ▼
[2] researchAgent.ts
    → research: string (Markdown)
  │
  ▼
[3] requirementsGenerator.ts
    → requirements: string (Markdown)
  │
  ▼
[4] strategyGenerator.ts
    → strategy: string (Markdown)
  │
  ▼
[5] contentGenerator.ts
    → contents: string (Markdown)
  │
  ▼
[6] scriptGenerator.ts
    → script: string (Markdown)
  │
  ▼
[7] notion.ts (Notion保存)
    → 各ページのURL
```

### 3.2 AI プロバイダー抽象化

```typescript
// src/ai/pipeline.ts
interface AIProvider {
  complete(prompt: string): Promise<string>
}

// OpenAI / Claude 両方が同一インターフェースを実装
```

### 3.3 各ステップのプロンプト設計

| ステップ | システムプロンプト概要 |
|---|---|
| topicExtractor | 会議内容からキーワードとメインテーマを抽出 |
| researchAgent | 抽出トピックに関する市場・競合・技術リサーチを生成 |
| requirementsGenerator | 会議内容から機能要件・非機能要件を整理 |
| strategyGenerator | ターゲット・訴求ポイント・配信戦略を策定 |
| contentGenerator | SNS・ブログ等のコンテンツ本文を生成 |
| scriptGenerator | 動画・ライブ配信用スクリプトを生成 |

---

## 4. データフロー

```
[User Input]
     │
     ▼
[TranscriptInput.tsx]
     │
     ▼
[pipeline.ts] ──────── [AI Provider (OpenAI/Claude)]
     │                        │
     ├── topicExtractor ───────┤
     ├── researchAgent ────────┤
     ├── requirementsGenerator─┤
     ├── strategyGenerator ────┤
     ├── contentGenerator ─────┤
     └── scriptGenerator ──────┘
           │
           ▼
     [ResultsView.tsx]
           │
           ▼
     [notion.ts] ──── [Notion API]
```

---

## 5. セキュリティ仕様

| 項目 | 仕様 |
|---|---|
| APIキー保存 | Tauriの `tauri-plugin-store` + OS keychain |
| 認証トークン | Supabase SDKが自動管理 (メモリ内) |
| 通信 | 全てHTTPS |
| ライセンスキー | サーバーサイド検証 (Supabase) |

---

## 6. エラーハンドリング

| エラー種別 | 対応 |
|---|---|
| 認証失敗 | エラーメッセージ表示 |
| ライセンス無効 | ライセンス画面に戻す |
| API呼び出し失敗 | リトライ(最大3回) → エラーモーダル |
| 生成回数上限 | アップグレード促進メッセージ |
| ネットワーク未接続 | オフライン通知 |
