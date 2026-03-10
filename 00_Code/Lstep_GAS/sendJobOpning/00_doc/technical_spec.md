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
    ├─ normalizeFormAnswer() → FORM_HEADER で正規化
    ├─ isAnswerIdExists()    → Answer_ID_Log で重複チェック
    ├─ getGroupIdsByAnswers() → Form_Group照合（複数Group_ID返却）
    ├─ getJobsForUser()      → 未送信求人取得（キャッシュ経由）+ ID_MAP更新
    └─ sendJobMessages()     → sendLstepAPI() でLINE送信（複数件対応）
```

---

## 2. スプレッドシート DB 定義

### 2.1 シート一覧

| シート名        | 役割                                  |
| --------------- | ------------------------------------- |
| `Job_Opening`   | 求人情報マスタ                        |
| `ID_MAP`        | ユーザーと送信済み求人IDの紐付け      |
| `Form_Group`    | フォーム回答 → グループIDのマッピング |
| `シート1`       | LStepフォーム回答データ               |
| `Log`           | 業務処理ログ（送信成功/失敗）         |
| `Answer_ID_Log` | 回答ID単位の処理ログ（重複防止用）    |
| `Logger`        | システム内部ログ                      |
| `Setting`       | システム設定値（KEY-VALUE形式）       |

> **注意：** `SpreadStructure.md` では `From_Group` と記載されているが、コードは `"Form_Group"` を参照している。要統一。

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

**制約：** `Vaild` 列はチェックボックス形式。`ID` は連番（行番号ベース）のため欠番が発生しうる。

### 2.3 ID_MAP

送信済み求人の履歴管理。同一ユーザーへの重複送信防止に使用。

| カラム名         | 型     | 必須 | 説明                                          |
| ---------------- | ------ | ---- | --------------------------------------------- |
| `USER_ID`        | string | ○    | LStepユーザーID（ユーザーごと1行）            |
| `Send_Letter_ID` | string | ○    | 送信済み求人IDのJSON配列 例: `[1,2,3]`        |

**構造：** ユーザーごとに1行。送信済み求人IDはJSON配列として1セルに格納される。
`getUserHistory()` / `saveUserHistory()` で読み書きする。

### 2.4 Form_Group

フォーム回答の組み合わせと求人グループIDのマッピング。

| カラム名   | 型     | 必須 | 説明                                       |
| ---------- | ------ | ---- | ------------------------------------------ |
| `Group_ID` | string | ○    | グループID（PK）                           |
| `希望する職種` | string | -  | 回答値（`FORM_HEADER.jobType` に対応）     |
| `希望する勤務エリア` | string | - | 回答値（`FORM_HEADER.area` に対応）    |
| `年代を教えてください。` | string | - | 回答値（`FORM_HEADER.age` に対応）   |
| `宅建を持っていますか？` | string | - | 回答値（`FORM_HEADER.skill` に対応） |
| その他     | string | -    | FORM_HEADERの定義に従い追加可能             |

**照合仕様：** `getGroupIdsByAnswers()` はシート1の回答（rawFormData）と各列を照合する。
空欄（undefined）の列はワイルドカード扱いで常に一致とみなす。
配列値の場合は `includes` で部分一致を評価する。
複数のGroup_IDが一致する場合は全て配列で返す。

### 2.5 シート1（フォーム回答）

LStepから書き込まれるフォーム回答データ。

| カラム名                       | 型       | 必須 | 説明            |
| ------------------------------ | -------- | ---- | --------------- |
| `回答ID`                       | string   | ○    | 回答一意ID      |
| `回答日時`                     | datetime | ○    | 回答日時        |
| `回答者ID`                     | string   | ○    | LStepユーザーID |
| `回答者名`                     | string   | ○    | 回答者名        |
| `希望する職種`                 | string   | ○    | 回答1           |
| `希望する勤務エリア`           | string   | ○    | 回答2           |
| `年代を教えてください。`       | string   | ○    | 回答3           |
| `宅建を持っていますか？`       | string   | ○    | 回答4           |
| `自己PRを教えてください（任意）` | string | -    | 任意回答        |
| `その他の回答`                 | string   | -    | その他          |

`FORM_HEADER_COMMON` と `FORM_HEADER` の2つの定数で列名を定義。`normalizeFormAnswer()` でJSキー名に変換して扱う。

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

### 2.7 Answer_ID_Log（回答IDログ）

回答ID単位の処理履歴。重複処理防止チェックに使用。

| カラム名    | 型       | 説明                    |
| ----------- | -------- | ----------------------- |
| `Timestamp` | datetime | 処理日時（JST）         |
| `Status`    | string   | `送信成功` / `送信失敗` |
| `回答ID`    | string   | 回答ID（3列目）         |
| `回答日時`  | datetime | フォーム回答日時        |
| `回答者ID`  | string   | LStepユーザーID         |
| `回答者名`  | string   | 回答者名                |

**用途：** `isAnswerIdExists(answerId)` が3列目（回答ID）をSetで検索し、処理済みかどうかを判定する。

### 2.8 Logger（システムログ）

システム内部のデバッグ・監視ログ。7日間で自動削除。

| カラム名    | 型       | 説明                         |
| ----------- | -------- | ---------------------------- |
| `Timestamp` | datetime | 出力日時（JST）              |
| `Level`     | string   | `INFO` / `WARN` / `ERROR`    |
| `Function`  | string   | 実行関数名                   |
| `Step`      | string   | 処理ステップ名               |
| `Message`   | string   | ログメッセージ               |
| `Detail`    | string   | 詳細情報（JSONまたは文字列） |

### 2.9 Setting

システム設定値のKEY-VALUE管理シート。

| キー                  | 説明                         |
| --------------------- | ---------------------------- |
| `LINE_ERROR_GROUP_ID` | エラー通知先のLINEグループID |

---

## 3. データリレーション

```
Form_Group.Group_ID ←── Job_Opening.Group_ID
Job_Opening.ID      ←── ID_MAP.Send_Letter_ID（JSON配列内）
ID_MAP.USER_ID      ←── シート1.回答者ID
Answer_ID_Log.回答ID←── シート1.回答ID（重複チェック用）
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
② シート1が存在するか確認（シートフィルタはコメントアウト中）
③ 最終行のフォーム回答データをヘッダーつきオブジェクトとして取得
④ normalizeFormAnswer() で列名→JSキーに変換
⑤ 回答者IDのNullチェック
⑥ isAnswerIdExists() で重複回答IDチェック → 既処理ならスキップ
⑦ getGroupIdsByAnswers(rawFormData) で該当Group_ID配列を取得
⑧ getJobsForUser(lstepUserId, groupIds, JOB_NUM) で未送信求人取得 + ID_MAP更新
⑨ sendJobMessages() で求人をLINE送信（件数分ループ、300ms間隔）
⑩ writeFormAnswerLog() でLogシートに記録
⑪ writeAnsweIdLog() でAnswer_ID_Logに記録
⑫ 各ステップで writeLog() によるシステムログ出力
```

> **注：** `シート1` の変更確認コード（`sheet.getName() !== FORM_SHEET_NAME`）は現在コメントアウト中。全シート変更で発火する状態。

#### 送信メッセージ形式

```
{求人ID}
■求人名：{Job_Name}
■給与：{Salary}
■勤務形態：{Working_Style}
詳しくはこちら↓
{Url}
```

求人が0件の場合は `"紹介できる求人がありません。"` を送信する。

---

### 4.2 フォームヘッダー定義

**ファイル：** `returnLINE.gas`

フォーム列名とJSキーのマッピングを2つの定数で管理。

#### FORM_HEADER_COMMON（共通部）

```javascript
{
  answerId:    "回答ID",
  date:        "回答日時",
  lstepUserId: "回答者ID",
  name:        "回答者名"
}
```

#### FORM_HEADER（顧客ごとに変更可能）

```javascript
{
  jobType: "希望する職種",
  area:    "希望する勤務エリア",
  age:     "年代を教えてください。",
  skill:   "宅建を持っていますか？",
  selfPR:  "自己PRを教えてください（任意）",
  other:   "その他の回答"
}
```

#### normalizeFormAnswer(raw)

rawFormData（列名キー）から正規化済みオブジェクト（JSキー）を生成する。

---

### 4.3 求人登録（insertJobData）

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

| 抽出項目                  | 対象HTML                                                       |
| ------------------------- | -------------------------------------------------------------- |
| 求人名（Job_Name）        | `section.cont1` 内の `h1` タグ                                 |
| 給与（Salary）            | `h3[text="給与"]` 配下の `p` タグ（複数 → ` / ` 結合）        |
| 勤務形態（Working_Style） | `h3[text="勤務時間"]` 配下の `p` タグ（複数 → ` / ` 結合）    |

---

### 4.4 求人管理（有効/無効の一括更新）

**ファイル：** `JobMange.gas`
**UIファイル：** `JobManageModal.html`
**メニュー：** 求人管理 → 有効/無効を一括設定

#### getJobList()

`Job_Opening` シートの全行を取得し、オブジェクト配列として返す。

```javascript
{ id, valid, groupId, url, job, salary, workingStyle }
```

#### updateJobValidBulk(updateList)

モーダルから送られた更新リストをもとに、各行の `Vaild` 列を一括更新。

- LockService で排他制御（10秒待機）
- IDから行番号を算出（`rowIndex = ID + 1`）してチェックボックスをセット

---

### 4.5 グループID照合（getGroupIdsByAnswers）

**ファイル：** `Mapping.gas`

`Form_Group` シートの各行を `FORM_HEADER` で定義された列名で検索し、一致する `Group_ID` を**配列**で返す。

- `FORM_HEADER` の値（日本語列名）でForm_Groupのヘッダーを検索
- 回答値が `undefined` の列はワイルドカード（常に一致）
- 回答値が配列の場合は `includes` で評価
- 一致する行が複数あれば全てのGroup_IDを返す（空配列の場合もある）

---

### 4.6 求人キャッシュ取得（getJobCache）

**ファイル：** `Mapping.gas`

`Job_Opening` シートの有効求人を `CacheService`（TTL: 300秒）にキャッシュして返す。

返却形式：
```javascript
{
  groupMap: {
    [groupId]: [ { ID, Job, Salary, Working_Style, Url }, ... ]
  }
}
```

---

### 4.7 未送信求人取得（getJobsForUser）

**ファイル：** `Mapping.gas`

指定ユーザーの未送信求人を `limit` 件取得し、同時に `ID_MAP` へ送信記録を更新する。

#### 処理ロジック

```
① LockService で排他制御
② getJobCache() でJob_Openingデータ取得（キャッシュ経由）
③ getUserHistory(userId) でID_MAPから送信済みIDのJSON配列を取得
④ 送信済みIDをSetで管理
⑤ 指定groupIds をループ：
   - groupMap[groupId] の求人を順に確認
   - 送信済みSetに含まれていない求人を選出（limit件まで）
⑥ saveUserHistory(userId, newHistory) でID_MAPを更新
⑦ 選出した求人オブジェクト配列を返す
```

#### ID_MAP の読み書き

- `getUserHistory(userId)`: USER_ID行を検索し、Send_Letter_IDのJSON配列をパースして返す
- `saveUserHistory(userId, jobIds)`: 既存行を更新、なければ新規appendRow

---

### 4.8 LINE送信（sendLstepAPI）

**ファイル：** `returnLINE.gas`

LStep APIへPOSTリクエストを送信。

| 項目           | 値                                                                      |
| -------------- | ----------------------------------------------------------------------- |
| エンドポイント | `https://api.lineml.jp/v1/api-codes/676/triggers/3a842350-...`          |
| 認証方式       | Bearer Token（スクリプトプロパティ `LSTEP_API_TOKEN`）                  |
| リクエスト形式 | `application/json`                                                      |
| 主要パラメータ | `friend_id`（LStepユーザーID）、`params.sned_message`（送信メッセージ） |

> **Note：** `params.sned_message` はタイポ（`send_message` の誤記）。LStep側の仕様に合わせた状態。

#### sendJobMessages(lstepUserId, jobs)

求人配列を受け取り、各求人に対して `sendLstepAPI()` を呼び出す。
- 求人が0件の場合は `"紹介できる求人がありません。"` を送信
- 送信間隔: 300ms（`Utilities.sleep(300)`）

---

### 4.9 重複チェック（isAnswerIdExists）

**ファイル：** `returnLINE.gas`

`Answer_ID_Log` シートの3列目（回答ID）をSetに変換し、指定IDが存在するか判定する。
- `true`: 処理済み（スキップ対象）
- `false`: 未処理

---

### 4.10 ログ管理

#### writeLog(level, funcName, step, message, detail)

`Logger` シートに内部ログを記録。

#### writeFormAnswerLog(status, answerId, answerDate, lstepId, answerName)

`Log` シートに業務処理結果を記録。

#### writeAnsweIdLog(status, answerId, answerDate, lstepId, answerName)

`Answer_ID_Log` シートに記録。重複防止チェックの補完ログ。

#### deleteOldLogs()

`Logger` シートの7日以上前のログを削除。定期実行トリガーの設定が必要。

#### notifyLineError(level, ...)

LINEグループへエラー通知を送信（`level === "ERROR"` 時のみ動作）。
`sendLineMessage()` を呼び出すが、この関数は現在未定義（要確認）。

---

## 5. 排他制御

以下の関数で `LockService.getScriptLock()` を使用。

| 関数                 | 目的                                       |
| -------------------- | ------------------------------------------ |
| `insertJobData`      | 求人登録時の競合防止                       |
| `getJobsForUser`     | 未送信求人取得・ID_MAP書き込みの原子性保証 |
| `updateJobValidBulk` | 一括更新時の競合防止                       |

全て `waitLock(10000)` で最大10秒待機。`finally` ブロックでロック解放。

---

## 6. ファイル一覧と責務

| ファイル              | 責務                                                    |
| --------------------- | ------------------------------------------------------- |
| `AddJobData.gas`      | メニュー定義（onOpen）、求人登録処理                    |
| `fetchURL.gas`        | 求人URLのスクレイピング・データ抽出                     |
| `JobMange.gas`        | メニュー定義（onOpen）、求人管理UI呼び出し、一覧・更新  |
| `Mapping.gas`         | 回答→グループID変換、求人キャッシュ、未送信求人取得     |
| `returnLINE.gas`      | シート変更トリガー、フォーム正規化、LINE送信、ログ記録  |
| `JobModal.html`       | 求人登録モーダルUI                                      |
| `JobManageModal.html` | 求人管理（有効/無効）モーダルUI                         |
| `SpreadStructure.md`  | スプレッドシートDB構造定義書                            |

---

## 7. 既知の課題・改善検討事項

| 課題                          | 詳細                                                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `getGroupIdsByAnswers` の照合バグ | `answers[col.key]` で参照しているが `answers`（rawFormData）はJSキーでなく日本語列名でキーイングされている。常に `undefined` → ワイルドカード扱いになり全Group_IDが返る可能性 |
| `writeAnsweIdLog` のステータス誤記 | catch ブロック内で `"送信成功"` を渡しているが `"送信失敗"` が正しい（returnLINE.gas L.132）                             |
| `sendLineMessage` 未定義      | `notifyLineError()` 内で呼び出しているが、いずれのファイルにも定義なし。`sendLstepAPI()` の呼び出しに変更が必要か要確認   |
| `onOpen` の二重定義           | `AddJobData.gas` と `JobMange.gas` 両方に `onOpen` が定義されており、片方が上書きされる                                    |
| URL固定                       | LStep APIエンドポイントがハードコード。Settingシートやプロパティでの管理が望ましい                                          |
| シート1フィルタのコメントアウト | `onSheetChange` の `sheet.getName()` チェックがコメントアウト中。全シート変更で処理が発火する                               |
| スクレイピング依存             | HOMES専用のパーサーを使用。他サイトは対応外                                                                                 |
| ログ自動削除                  | `deleteOldLogs` のトリガー設定が手動。未設定のままだとログが肥大化する                                                     |
| ID管理                        | 求人IDが `lastRow`（行番号）ベースのため、行削除時に欠番・重複が発生しうる                                                  |
| `From_Group` vs `Form_Group`  | `SpreadStructure.md` は `From_Group` と記載しているが、コードは `"Form_Group"` を参照。要統一                              |
| Setting シートの未記載        | `SpreadStructure.md` に `Setting` シートが記載されていないが、コードは参照している                                         |
| ID_MAP 構造の不一致           | `SpreadStructure.md` は1行1求人の形式で記述しているが、コードはJSONArray形式（1行1ユーザー）で管理している                 |

---

## 8. トリガー設定一覧

| 関数            | トリガー種別           | 設定内容                         |
| --------------- | ---------------------- | -------------------------------- |
| `onSheetChange` | スプレッドシート変更時 | シートに行が追加されるたびに起動 |
| `deleteOldLogs` | 時間主導型（推奨）     | 毎日1回などで定期実行            |

---

## 9. 環境変数・設定値

| 種別                 | キー                                      | 説明                          |
| -------------------- | ----------------------------------------- | ----------------------------- |
| スクリプトプロパティ | `LSTEP_API_TOKEN`                         | LStep API認証トークン         |
| Settingシート        | `LINE_ERROR_GROUP_ID`                     | エラー通知先LINEグループID    |
| コード定数           | `JOB_NUM = 2`                             | 1回の処理で送信する最大求人数 |
| コード定数           | `FORM_SHEET_NAME = "シート1"`             | フォーム回答シート名          |
| コード定数           | `LOG_SHEET = "Log"`                       | 業務ログシート名              |
| コード定数           | `LOGGER_SHEET = "Logger"`                 | システムログシート名          |
| コード定数           | `ANSWER_ID_LOGGER_SHEET = "Answer_ID_Log"` | 回答IDログシート名           |
| コード定数           | `FORM_HEADER_COMMON`                      | 共通フォームヘッダー定義      |
| コード定数           | `FORM_HEADER`                             | 顧客別フォームヘッダー定義    |
