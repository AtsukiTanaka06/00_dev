# 求人自動送信システム 全体仕様書

---

## 1. システム概要

### 1.1 目的

LStepフォームに回答したLINEユーザーへ、回答内容に対応した求人情報を自動送信するシステム。

### 1.2 構成技術

| 技術                     | 用途                             |
| ------------------------ | -------------------------------- |
| Google Apps Script (GAS) | サーバーサイド処理               |
| Google Spreadsheet       | データベース                     |
| LStep API                | LINE メッセージ送信              |
| HTML / CSS / JavaScript  | 管理UI（GAS モーダルダイアログ） |

### 1.3 全体アーキテクチャ

```
[LINEユーザー]
    │ フォーム回答
    ▼
[LStep（LINE拡張）]
    │ 回答データをスプレッドシートに書き込み
    ▼
[Spreadsheet: シート1]
    │ 変更トリガー（onSheetChange）
    ▼
[GAS: returnLINE.gas]
    ├─ 回答データ読み取り
    ├─ getGroupIdByAnswers() → Form_Group照合
    ├─ processUserWithLock() → 未送信求人取得 + ID_MAP登録
    └─ sendLstepAPI() → LStep API経由でLINE送信
```

---

## 2. スプレッドシート DB 定義

### 2.1 シート一覧

| シート名      | 役割                                  |
| ------------- | ------------------------------------- |
| `Job_Opening` | 求人情報マスタ                        |
| `ID_MAP`      | ユーザーと送信済み求人の紐付け        |
| `Form_Group`  | フォーム回答 → グループIDのマッピング |
| `シート1`     | LStepフォーム回答データ               |
| `Log`         | 業務処理ログ（送信成功/失敗）         |
| `Logger`      | システム内部ログ                      |
| `Setting`     | システム設定値（KEY-VALUE形式）       |

### 2.2 Job_Opening

求人情報マスタ。

| カラム名        | 型      | 必須 | 説明                                                    |
| --------------- | ------- | ---- | ------------------------------------------------------- |
| `ID`            | number  | ○    | 求人ID（PK）。登録時の行番号（lastRow）が自動付与される |
| `Vaild`         | boolean | ○    | 有効フラグ。FALSEの求人は送信対象外                     |
| `Group_ID`      | number  | ○    | 送信対象グループ（FK: Form_Group.Group_ID）             |
| `Url`           | string  | ○    | 求人ページURL                                           |
| `Job_Name`      | string  | ○    | 求人名（URLから自動取得）                               |
| `Salary`        | string  | -    | 給与情報（URLから自動取得）                             |
| `Working_Style` | string  | -    | 勤務形態（URLから自動取得）                             |

**制約：** `Vaild` 列はチェックボックス形式で管理。`ID` は連番（行番号ベース）のため欠番が発生しうる。

### 2.3 ID_MAP

送信済み求人の履歴管理。同一ユーザーへの重複送信防止に使用。

| カラム名         | 型     | 必須 | 説明                                 |
| ---------------- | ------ | ---- | ------------------------------------ |
| `USER_ID`        | string | ○    | LStepユーザーID                      |
| `Send_Letter_ID` | string | ○    | 送信した求人ID（FK: Job_Opening.ID） |

**制約：** `USER_ID + Send_Letter_ID` の組み合わせで重複は発生しないよう設計されている。

### 2.4 Form_Group

フォーム回答の組み合わせと求人グループIDのマッピング。

| カラム名   | 型     | 必須 | 説明             |
| ---------- | ------ | ---- | ---------------- |
| `Group_ID` | string | ○    | グループID（PK） |
| `Answer1`  | string | ○    | 回答1の期待値    |
| `Answer2`  | string | ○    | 回答2の期待値    |
| `Answer3`  | string | ○    | 回答3の期待値    |

**拡張性：** Answer列は「Answerで始まる列名」を自動検出するため、列の追加が可能。

### 2.5 シート1（フォーム回答）

LStepから書き込まれるフォーム回答データ。

| カラム名   | 型       | 必須 | 説明            |
| ---------- | -------- | ---- | --------------- |
| `回答ID`   | string   | ○    | 回答一意ID      |
| `回答日時` | datetime | ○    | 回答日時        |
| `回答者ID` | string   | ○    | LStepユーザーID |
| `回答者名` | string   | ○    | 回答者名        |
| `Answer1`  | string   | ○    | 回答1           |
| `Answer2`  | string   | ○    | 回答2           |
| `Answer3`  | string   | ○    | 回答3           |

### 2.6 Log（業務ログ）

送信処理の結果を記録。

| カラム名    | 型       | 説明                    |
| ----------- | -------- | ----------------------- |
| `Timestamp` | datetime | 処理日時（JST）         |
| `Status`    | string   | `送信成功` / `送信失敗` |
| `回答ID`    | string   | フォーム回答ID          |
| `回答日時`  | datetime | フォーム回答日時        |
| `回答者ID`  | string   | LStepユーザーID         |
| `回答者名`  | string   | 回答者名                |

### 2.7 Logger（システムログ）

システム内部のデバッグ・監視ログ。7日間で自動削除。

| カラム名    | 型       | 説明                         |
| ----------- | -------- | ---------------------------- |
| `Timestamp` | datetime | 出力日時（JST）              |
| `Level`     | string   | `INFO` / `WARN` / `ERROR`    |
| `Function`  | string   | 実行関数名                   |
| `Step`      | string   | 処理ステップ名               |
| `Message`   | string   | ログメッセージ               |
| `Detail`    | string   | 詳細情報（JSONまたは文字列） |

### 2.8 Setting

システム設定値のKEY-VALUE管理シート。

| キー                  | 説明                         |
| --------------------- | ---------------------------- |
| `LINE_ERROR_GROUP_ID` | エラー通知先のLINEグループID |

---

## 3. データリレーション

```
Form_Group.Group_ID ←── Job_Opening.Group_ID
Job_Opening.ID      ←── ID_MAP.Send_Letter_ID
ID_MAP.USER_ID      ←── シート1.回答者ID
```

---

## 4. 機能仕様

### 4.1 自動送信処理（onSheetChange）

**ファイル：** `returnLINE.gas`
**トリガー：** スプレッドシートの「変更時」イベント
**対象シート：** `シート1`

#### 処理フロー

```
① シート変更イベント発火
② 変更シートが「シート1」か確認
③ 最終行のフォーム回答データを取得
④ 回答者IDのNullチェック
⑤ getGroupIdByAnswers() でGroup_ID取得
⑥ processUserWithLock() で未送信求人取得 + ID_MAP登録
⑦ 求人情報をテキスト整形
⑧ sendLstepAPI() でLINE送信
⑨ writeFormAnswerLog() で結果記録
⑩ 各ステップで writeLog() によるシステムログ出力
```

#### 送信メッセージ形式（現行）

```
{求人ID}
■求人名：{Job_Name}
■給与：{Salary}
■勤務形態：{Working_Style}
詳しくはこちら↓
{Url}
```

#### 現行の制約・未実装箇所

| 項目               | 現状                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| 回答値のマッピング | `["a", "b", "c"]` にハードコード（フォーム実回答値を使用していない） |
| 送信件数           | `JOB_NUM = 2` だが、実際には `sendJobs[0]` のみ送信（1件のみ）       |

---

### 4.2 求人登録（insertJobData）

**ファイル：** `AddJobData.gas`
**UIファイル：** `JobModal.html`
**メニュー：** 求人管理 → 求人を登録

#### 処理フロー

```
① モーダルから groupId / url / isValid を受け取る
② LockService で排他制御（10秒待機）
③ Job_Opening の lastRow を取得し、IDとして使用
④ fetchAndParseStructured(url) でURLをスクレイピング
   - Job_Name（h1タグ）
   - Salary（「給与」セクションの段落）
   - Working_Style（「勤務時間」セクションの段落）
⑤ Job_Opening シートに行を追加（appendRow）
⑥ Vaild列にチェックボックスをセット
⑦ 登録結果をモーダルに返却
```

#### URLスクレイピング仕様

対象サイト：HOMES（`homes.co.jp`）の求人ページ

| 抽出項目                  | 対象HTML                                                 | 備考 |
| ------------------------- | -------------------------------------------------------- | ---- |
| 求人名（Job_Name）        | `section.cont1` 内の `h1` タグ                           |      |
| 給与（Salary）            | `h3[text="給与"]` 配下の `p` タグ（複数 → `/` 結合）     |      |
| 勤務形態（Working_Style） | `h3[text="勤務時間"]` 配下の `p` タグ（複数 → `/` 結合） |      |

---

### 4.3 求人管理（有効/無効の一括更新）

**ファイル：** `JobMange.gas`
**UIファイル：** `JobManageModal.html`
**メニュー：** 求人管理 → 有効/無効を一括設定

#### getJobList()

`Job_Opening` シートの全行を取得し、オブジェクト配列として返す。

```javascript
{
  (id, valid, groupId, url, job, salary, workingStyle);
}
```

#### updateJobValidBulk(updateList)

モーダルから送られた更新リストをもとに、各行の `Vaild` 列を一括更新。

- LockService で排他制御（10秒待機）
- IDから行番号を算出（`rowIndex = ID + 1`）してチェックボックスをセット

---

### 4.4 グループID照合（getGroupIdByAnswers）

**ファイル：** `Mapping.gas`

`Form_Group` シートから回答配列と完全一致する行を検索し、`Group_ID` を返す。

- ヘッダーの「Answerで始まる列」を動的に検出するため、Answer列の追加が可能
- 一致なしの場合は `null` を返す

---

### 4.5 未送信求人取得（processUserWithLock）

**ファイル：** `Mapping.gas`

指定ユーザーの未送信求人を `limit` 件取得し、同時に `ID_MAP` へ送信記録を登録。

#### 処理ロジック

```
① LockService で排他制御
② Job_Opening の全データ取得
③ ID_MAP から対象ユーザーの送信済み求人IDをSetで管理
④ Job_Opening をループ：
   - Valid = TRUE
   - Group_ID が一致
   - 送信済みSet に含まれていない
   → 条件を満たした求人を選出（limit件まで）
⑤ 選出した求人をID_MAPへ一括書き込み
⑥ 選出した求人オブジェクト配列を返す
```

---

### 4.6 LINE送信（sendLstepAPI）

**ファイル：** `returnLINE.gas`

LStep APIへPOSTリクエストを送信。

| 項目           | 値                                                                      |
| -------------- | ----------------------------------------------------------------------- |
| エンドポイント | `https://api.lineml.jp/v1/api-codes/676/triggers/3a842350-...`          |
| 認証方式       | Bearer Token（スクリプトプロパティ `LSTEP_API_TOKEN`）                  |
| リクエスト形式 | `application/json`                                                      |
| 主要パラメータ | `friend_id`（LStepユーザーID）、`params.sned_message`（送信メッセージ） |

> **Note：** `params.sned_message` はタイポ（`send_message` の誤記）。LStep側の仕様に合わせた状態。

---

### 4.7 ログ管理

#### writeLog(level, funcName, step, message, detail)

`Logger` シートに内部ログを記録。

#### writeFormAnswerLog(status, answerId, answerDate, lstepId, answerName)

`Log` シートに業務処理結果を記録。

#### deleteOldLogs()

`Logger` シートの7日以上前のログを削除。定期実行トリガーの設定が必要。

#### notifyLineError(level, ...)

LINEグループへエラー通知を送信（`level === "ERROR"` 時のみ動作）。

---

## 5. 排他制御

以下の関数で `LockService.getScriptLock()` を使用。

| 関数                  | 目的                                       |
| --------------------- | ------------------------------------------ |
| `insertJobData`       | 求人登録時の競合防止                       |
| `processUserWithLock` | 未送信求人取得・ID_MAP書き込みの原子性保証 |
| `updateJobValidBulk`  | 一括更新時の競合防止                       |

全て `waitLock(10000)` で最大10秒待機。`finally` ブロックでロック解放。

---

## 6. ファイル一覧と責務

| ファイル              | 責務                                       |
| --------------------- | ------------------------------------------ |
| `AddJobData.gas`      | スプレッドシートメニュー定義、求人登録処理 |
| `fetchURL.gas`        | 求人URLのスクレイピング・データ抽出        |
| `JobMange.gas`        | 求人管理UI呼び出し、一覧取得、一括更新     |
| `Mapping.gas`         | 回答→グループID変換、未送信求人取得        |
| `returnLINE.gas`      | シート変更トリガー、LINE送信、ログ記録     |
| `JobModal.html`       | 求人登録モーダルUI                         |
| `JobManageModal.html` | 求人管理（有効/無効）モーダルUI            |
| `SpreadStructure.md`  | スプレッドシートDB構造定義書               |

---

## 7. 既知の課題・改善検討事項

| 課題               | 詳細                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 回答値ハードコード | `onSheetChange` 内の `getGroupIdByAnswers(["a","b","c"])` がハードコード。フォーム実回答値（`data["Answer1"]` 等）を渡すよう修正が必要 |
| 送信件数不整合     | `JOB_NUM = 2` だが `sendJobs[0]` のみ使用。複数送信する場合はループ処理が必要                                                          |
| onOpen の二重定義  | `AddJobData.gas` と `JobMange.gas` 両方に `onOpen` が定義されており、後者が上書きされる                                                |
| URL固定            | LStep APIエンドポイントがハードコード。Setting シートやプロパティでの管理が望ましい                                                    |
| スクレイピング依存 | HOMES専用の正規表現パーサーを使用。他サイトは対応外                                                                                    |
| ログ自動削除       | `deleteOldLogs` のトリガー設定が手動。未設定のままだとログが肥大化する                                                                 |
| ID管理             | 求人IDが `lastRow`（行番号）ベースのため、行削除時に欠番・重複が発生しうる                                                             |

---

## 8. トリガー設定一覧

| 関数            | トリガー種別           | 設定内容                         |
| --------------- | ---------------------- | -------------------------------- |
| `onSheetChange` | スプレッドシート変更時 | シートに行が追加されるたびに起動 |
| `deleteOldLogs` | 時間主導型（推奨）     | 毎日1回などで定期実行            |

---

## 9. 環境変数・設定値

| 種別                 | キー                          | 説明                          |
| -------------------- | ----------------------------- | ----------------------------- |
| スクリプトプロパティ | `LSTEP_API_TOKEN`             | LStep API認証トークン         |
| Settingシート        | `LINE_ERROR_GROUP_ID`         | エラー通知先LINEグループID    |
| コード定数           | `JOB_NUM = 2`                 | 1回の処理で送信する最大求人数 |
| コード定数           | `FORM_SHEET_NAME = "シート1"` | フォーム回答シート名          |
| コード定数           | `LOG_SHEET = "Log"`           | 業務ログシート名              |
| コード定数           | `LOGGER_SHEET = "Logger"`     | システムログシート名          |
