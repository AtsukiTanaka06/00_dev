# Cursor × Supabase MCP 接続手順（Windows・OAuth認証）

## 概要

MCP（Model Context Protocol）を使うと、Cursor から自然言語で Supabase プロジェクトを直接操作できる。
本ドキュメントは **Windows 環境 × Cursor × OAuth 認証** の構成を前提に、ゼロから接続できるよう手順をまとめたもの。

---

## Step 1: 前提条件の確認

PowerShell または コマンドプロンプトで以下を実行し、インストール済みを確認する。

```powershell
node -v   # v18以上推奨
npx -v
```

インストールされていない場合は [Node.js 公式サイト](https://nodejs.org/) からインストールする（LTS版を選択）。

---

## Step 2: Cursor の MCP 設定ファイルを作成する

Cursor の MCP 設定ファイルは2種類ある。

| スコープ     | ファイルパス                                 | 適用範囲             |
| ------------ | -------------------------------------------- | -------------------- |
| グローバル   | `%USERPROFILE%\.cursor\mcp.json`             | 全プロジェクト共通   |
| プロジェクト | `.cursor\mcp.json`（プロジェクトルート直下） | そのプロジェクトのみ |

通常は **グローバル設定** を推奨。

### 2-1. グローバル設定ファイルの作成

エクスプローラーで `C:\Users\<ユーザー名>\.cursor\` フォルダを開き、`mcp.json` を作成する。
フォルダが存在しない場合は作成する。

PowerShell での作成コマンド：

```powershell
# フォルダ作成（すでにあればスキップ）
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cursor"

# mcp.json を作成
New-Item -ItemType File -Path "$env:USERPROFILE\.cursor\mcp.json"
```

### 2-2. 設定ファイルに内容を記述する

作成した `mcp.json` を以下の内容で保存する。

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest"]
    }
  }
}
```

> **Windows では `"command": "cmd"` + `"args": ["/c", "npx", ...]` の形式が必須。**
> `"command": "npx"` のみでは動作しないことがある。

---

## Step 3: PAT（Personal Access Token）を設定する【推奨】

OAuth 認証の代わりに PAT を使う方法。環境変数に設定しておくと、Cursor 再起動後に自動で認証が通り、毎回ブラウザ認証が不要になる。

### 3-1. Supabase で PAT を発行する

1. ブラウザで [Supabase](https://supabase.com/) にログイン
2. 右上のユーザーアイコン → **Access Tokens**（または **Personal Access Tokens**）を選択
3. 新しいトークンを作成してコピーする

### 3-2. Windows のユーザー環境変数に設定する

1. Windows 検索で「環境変数」と入力 → **「システム環境変数の編集」** を選択
2. **「環境変数(N)...」** ボタンをクリック
3. 上側の **「ユーザー環境変数」** 欄で **「新規(N)...」** をクリック
4. 以下を入力して OK で閉じる

| 項目   | 値                          |
| ------ | --------------------------- |
| 変数名 | `SUPABASE_ACCESS_TOKEN`     |
| 変数値 | （コピーした PAT を貼り付け） |

5. すべての環境変数ダイアログを OK で閉じて設定を反映する

---

## Step 4: Cursor を完全終了して再起動する

環境変数を設定したら、Cursor を完全に終了して再起動する。**タスクトレイまで含めて完全に終了することが重要。**

- すべての Cursor ウィンドウを閉じる
- タスクトレイ（通知領域）のアイコンを右クリック → 「終了」
- 終了しない場合はタスクマネージャーで `Cursor` プロセスをすべて終了する
- その後、Cursor を再起動する

---

## Step 5: MCP サーバーの接続を確認する

Cursor 再起動後、以下の手順で MCP サーバーが認識されているか確認する。

1. `Ctrl + Shift + P` でコマンドパレットを開く
2. `MCP` と入力 → **「MCP: List Servers」** または **「Open MCP Settings」** を選択
3. `supabase` が一覧に表示されていれば設定は正しく読み込まれている

または Cursor の設定画面から確認：

1. `Ctrl + ,` で設定を開く
2. 左メニューから **Features** → **MCP** を選択
3. `supabase` サーバーが表示されていることを確認

---

## Step 6: OAuth 認証を行う（PAT未設定の場合）

### 5-1. 認証トリガーの方法

Cursor のチャット（Composer / Agent モード）で Supabase に関する操作を依頼する。

```
Supabase のプロジェクト一覧を表示して
```

### 5-2. ブラウザが自動で開く

初回実行時、MCP サーバーが認証を要求し **自動的にブラウザが起動** する。

ブラウザが開かない場合は、Cursor のターミナルや出力パネルに認証用 URL が表示されるので、それをブラウザに貼り付ける。

### 5-3. Supabase にログインして認証を承認する

1. ブラウザで Supabase アカウントにログイン
2. 「Allow access to your Supabase organization」の画面で **Allow** をクリック
3. 「Authentication successful」と表示されたらブラウザを閉じる

### 5-4. Cursor に戻って動作を確認する

認証後、Cursor のチャットに Supabase の情報が返ってくれば接続成功。

---

## Step 7: tasks テーブルの作成（このプロジェクト用）

接続確認後、以下のプロンプトをそのまま Cursor のチャットに貼り付けて実行する。

```
Supabase に tasks テーブルを作成してください。以下の SQL を実行してください。

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

---

## トラブルシューティング

### ブラウザが開かない・認証 URL が表示されない

Cursor の出力パネルを確認する。

1. メニューバー → **View** → **Output**
2. 右上のドロップダウンで **MCP** または **Supabase** を選択
3. エラーメッセージや URL が表示されていないか確認する

### `npx` が見つからないエラー

Node.js がインストールされているにも関わらずエラーが出る場合、フルパスで指定する。

PowerShell で npx のパスを確認：

```powershell
where.exe npx
```

出力例: `C:\Program Files\nodejs\npx.cmd`

mcp.json をフルパスに変更：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "C:\\Program Files\\nodejs\\npx.cmd",
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ]
    }
  }
}
```

### MCP サーバーが一覧に表示されない

- JSON の構文エラーがないか確認する（末尾カンマ、括弧の閉じ忘れなど）
- ファイルの保存場所が正しいか確認する（`%USERPROFILE%\.cursor\mcp.json`）
- Cursor を完全再起動する

JSON の検証は [jsonlint.com](https://jsonlint.com/) などで行える。

### 認証後もツールが動作しない

一度認証トークンをリセットして再認証する。

```powershell
# Supabase MCP のキャッシュ・認証情報を削除
Remove-Item -Recurse -Force "$env:APPDATA\supabase-mcp" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\supabase-mcp" -ErrorAction SilentlyContinue
```

削除後、Cursor を再起動して再度 OAuth 認証を行う。

---

## 参考リンク

- [Supabase MCP 公式ドキュメント](https://supabase.com/docs/guides/getting-started/mcp)
- [Cursor MCP ドキュメント](https://docs.cursor.com/context/model-context-protocol)
- [supabase-mcp GitHub](https://github.com/supabase-community/supabase-mcp)
