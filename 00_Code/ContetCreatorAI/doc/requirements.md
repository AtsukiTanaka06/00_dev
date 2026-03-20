# 要件定義書

**プロジェクト名:** ContentCreatorAI
**作成日:** 2026-03-15
**バージョン:** 1.0.0

---

## 1. プロジェクト概要

会議トランスクリプトを入力とし、AIを活用してリサーチ・要件定義・戦略・コンテンツ・スクリプトを自動生成するデスクトップアプリケーション。生成結果はNotionに自動保存される。

---

## 2. 技術スタック

| カテゴリ | 技術 |
|---|---|
| デスクトップフレームワーク | Tauri |
| フロントエンド | React + TypeScript |
| ビルドツール | Vite |
| 認証 | Supabase Auth |
| データベース | Supabase (PostgreSQL) |
| AI | OpenAI API / Claude API (切替可能) |
| ドキュメント保存 | Notion API |
| ローカルストレージ | Tauri セキュアストレージ |

---

## 3. 機能要件

### 3.1 ユーザー管理 (USER MANAGEMENT)

| ID | 機能 | 詳細 |
|---|---|---|
| UM-01 | サインアップ | Email + Password でアカウント作成 |
| UM-02 | ログイン | Email + Password でログイン |
| UM-03 | ログアウト | セッションを破棄してログイン画面へ遷移 |

**Supabase テーブル: users**

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | Primary Key |
| email | text | メールアドレス |
| created_at | timestamp | 作成日時 |

---

### 3.2 ライセンス認証 (LICENSE SYSTEM)

| ID | 機能 | 詳細 |
|---|---|---|
| LS-01 | ライセンスキー認証 | キー入力によりプランを有効化 |
| LS-02 | プラン管理 | Free / Pro の2プラン |
| LS-03 | 生成回数制限 | Free: 1日3回 / Pro: 無制限 |
| LS-04 | ライセンス状態チェック | アプリ起動時・生成前に毎回確認 |

**起動フロー:**
```
アプリ起動 → ログイン → ライセンスチェック → アプリ使用
```

**Supabase テーブル: licenses**

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | Primary Key |
| user_id | uuid | FK → users.id |
| license_key | text | ライセンスキー |
| plan | text | "free" / "pro" |
| status | text | "active" / "inactive" / "expired" |
| created_at | timestamp | 作成日時 |

---

### 3.3 AI パイプライン (AI PIPELINE)

| ID | ステップ | 詳細 |
|---|---|---|
| AI-01 | トピック抽出 | トランスクリプトからキーワード・テーマを抽出 |
| AI-02 | リサーチ生成 | 抽出トピックに基づきリサーチ情報を生成 |
| AI-03 | 要件定義生成 | プロジェクト要件をMarkdown形式で生成 |
| AI-04 | 戦略生成 | コンテンツ戦略をMarkdown形式で生成 |
| AI-05 | コンテンツ生成 | 実際のコンテンツをMarkdown形式で生成 |
| AI-06 | スクリプト生成 | 動画・配信用スクリプトをMarkdown形式で生成 |
| AI-07 | Notion保存 | 全生成物をNotion DBに自動保存 |

**入力フォーマット例:**
```
田中: インフルエンサーマーケティングのツールを作りたい
佐藤: 1000人以上のインフルエンサーを抽出したい
山本: InstagramのBANは避けたい
```

**出力ファイル:**
- `Research.md`
- `Requirements.md`
- `Strategy.md`
- `Contents.md`
- `Script.md`

---

### 3.4 画面仕様 (USER INTERFACE)

| 画面 | 画面名 | 主な要素 |
|---|---|---|
| Screen 1 | Login | Email, Password, Loginボタン, Sign upリンク |
| Screen 2 | License Activation | ライセンスキー入力, Activateボタン |
| Screen 3 | Transcript Input | トランスクリプト入力エリア, Generateボタン |
| Screen 4 | Results | タブ切替 (Topics / Research / Requirements / Strategy / Contents / Script) |
| Screen 5 | Settings | AI Provider選択, 各APIキー入力, 保存ボタン |

---

### 3.5 設定管理 (SETTINGS)

| ID | 機能 | 詳細 |
|---|---|---|
| ST-01 | AI Provider 切替 | OpenAI / Claude を選択可能 |
| ST-02 | APIキー管理 | OpenAI / Claude / Notion キーをローカル保存 |
| ST-03 | セキュアストレージ | Tauriのセキュアストレージ(keychain)に暗号化保存 |

---

### 3.6 Notion 連携

**Database: AI Content Pipeline**

| プロパティ | 型 | 説明 |
|---|---|---|
| Title | title | ページタイトル |
| Type | select | research / requirements / strategy / contents / script |
| Content | rich_text | 生成コンテンツ本文 |
| CreatedAt | date | 生成日時 |

---

## 4. 非機能要件

| ID | 要件 | 詳細 |
|---|---|---|
| NF-01 | セキュリティ | APIキーはローカルセキュアストレージに保存、平文保存禁止 |
| NF-02 | オフライン対応 | APIキーが未設定の場合は適切なエラーメッセージを表示 |
| NF-03 | クロスプラットフォーム | Windows / macOS 対応 |
| NF-04 | パフォーマンス | AI生成中はプログレス表示、UIをブロックしない非同期処理 |
| NF-05 | エラーハンドリング | API失敗時のリトライ・エラー表示 |

---

## 5. 制約・前提条件

- インターネット接続必須（Supabase / AI API / Notion API 使用のため）
- APIキーはユーザー自身が取得・設定する
- Supabase プロジェクトは別途セットアップ済みであること
