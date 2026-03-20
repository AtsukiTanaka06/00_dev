# ContentCreatorAI

会議トランスクリプトからAIを使ってコンテンツを自動生成するデスクトップアプリ。

## 技術スタック

- **デスクトップ:** Tauri
- **フロントエンド:** React + TypeScript
- **認証/DB:** Supabase
- **AI:** OpenAI API / Claude API
- **ドキュメント保存:** Notion API

## ドキュメント

| ファイル | 内容 |
|---|---|
| [doc/requirements.md](doc/requirements.md) | 要件定義書 |
| [doc/specification.md](doc/specification.md) | 詳細仕様書 |
| [doc/tasks.md](doc/tasks.md) | タスク管理 |
| [doc/architecture.md](doc/architecture.md) | アーキテクチャ概要 |

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run tauri dev

# ビルド
npm run tauri build
```

## 環境変数

`.env` ファイルを作成して以下を設定:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

APIキー (OpenAI / Claude / Notion / Whimsical) はアプリ内の Settings 画面から設定。
