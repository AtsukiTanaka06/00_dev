# カスタマイズ設定ガイド

顧客ごとに変更・設定が必要な箇所の一覧。

---

## 一覧

| #   | カテゴリ               | 設定項目                              | ファイル / 場所                       | 変更頻度           |
| --- | ---------------------- | ------------------------------------- | ------------------------------------- | ------------------ |
| 1   | コード定数             | `FORM_HEADER`（フォーム質問文）       | `returnLINE.gas`                      | 顧客ごと必須       |
| 2   | コード定数             | `FORM_HEADER_COMMON`（共通列名）      | `returnLINE.gas`                      | 通常変更不要       |
| 3   | コード定数             | `JOB_NUM`（1回の送信求人数）          | `returnLINE.gas`                      | 顧客ごとに調整     |
| 4   | コード定数             | `FORM_SHEET_NAME`（フォームシート名） | `returnLINE.gas`                      | 通常変更不要       |
| 5   | コード直書き           | LStep APIエンドポイントURL            | `returnLINE.gas` L145                 | 顧客ごと必須       |
| 6   | スクリプトプロパティ   | `LSTEP_API_TOKEN`                     | GASスクリプトプロパティ               | 顧客ごと必須       |
| 7   | Settingシート          | `LINE_ERROR_GROUP_ID`                 | スプレッドシート `Setting` シート     | 顧客ごと必須       |
| 8   | スプレッドシートデータ | `Form_Group` シートの列構成・データ   | スプレッドシート                      | 顧客ごと必須       |
| 9   | スプレッドシートデータ | `Job_Opening` シートの求人データ      | スプレッドシート                      | 都度登録           |
| 10  | スクレイピング仕様     | 対象サイトのHTML構造                  | `fetchURL.gas`                        | サイトが変わる場合 |
| 11  | スクレイピング仕様     | 抽出対象セクション名（h3テキスト）    | `fetchURL.gas` L33-34                 | サイトが変わる場合 |
| 12  | メッセージ             | LINE送信テキストのフォーマット        | `returnLINE.gas` `createJobMessage()` | 顧客の要望に応じて |

---

## 詳細

---

### 1. `FORM_HEADER`（フォーム質問文）

**ファイル：** `returnLINE.gas`

LStepフォームの質問文（スプレッドシートの列ヘッダー）とJSキーのマッピング。
フォームの設問が変わるたびに変更が必要。

```javascript
const FORM_HEADER = {
  jobType: "希望する職種", // ← 顧客のフォーム設問に合わせる
  area: "希望する勤務エリア",
  age: "年代を教えてください。",
  skill: "宅建を持っていますか？",
  selfPR: "自己PRを教えてください（任意）",
  other: "その他の回答",
};
```

**注意：**

- JSキー（左辺）は英字。内部処理で使用する識別子のため変更は不要。
- 値（右辺）をフォームの実際の質問文と**完全一致**させること（スペース・句読点含む）。
- `Form_Group` シートの列ヘッダーもこの値と一致させること（後述）。
- 照合に不要な設問（`selfPR`, `other` 等）はエントリを追加しても照合時にワイルドカード扱いになるため影響なし。

---

### 2. `FORM_HEADER_COMMON`（共通列名）

**ファイル：** `returnLINE.gas`

フォームに必ず存在する共通列（回答ID・日時・LStepユーザーID・回答者名）の列名定義。
LStepのスプレッドシート書き出し形式に依存するため、通常は変更不要。

```javascript
const FORM_HEADER_COMMON = {
  answerId: "回答ID",
  date: "回答日時",
  lstepUserId: "回答者ID",
  name: "回答者名",
};
```

---

### 3. `JOB_NUM`（1回の送信求人数）

**ファイル：** `returnLINE.gas`

フォーム回答1件につき送信する求人の最大件数。

```javascript
const JOB_NUM = 2;
```

数値を増やすとLINEへのメッセージ送信回数が増える。LINE APIのレートリミットに注意。

---

### 4. `FORM_SHEET_NAME`（フォームシート名）

**ファイル：** `returnLINE.gas`

LStepが回答データを書き込むスプレッドシートのシート名。

```javascript
const FORM_SHEET_NAME = "シート1";
```

LStep側の書き出し先シート名と一致させること。

---

### 5. LStep APIエンドポイントURL

**ファイル：** `returnLINE.gas` L145

```javascript
const url =
  "https://api.lineml.jp/v1/api-codes/676/triggers/3a842350-1e2c-4864-85f4-83697d5a5e22";
```

顧客ごとにLStepのAPIコードおよびトリガーIDが異なるため、URLを変更すること。
LStep管理画面のAPIコード設定画面で確認できる。

> **課題（issues.md #5）：** 現在コードに直書きされている。Settingシートまたはスクリプトプロパティで管理することを推奨。

---

### 6. `LSTEP_API_TOKEN`（LStep API認証トークン）

**場所：** GASスクリプトエディタ → プロジェクトの設定 → スクリプトプロパティ

| プロパティ名      | 値                                 |
| ----------------- | ---------------------------------- |
| `LSTEP_API_TOKEN` | LStep管理画面で発行したAPIトークン |

コードからは以下で参照している：

```javascript
const token =
  PropertiesService.getScriptProperties().getProperty("LSTEP_API_TOKEN");
```

---

### 7. `LINE_ERROR_GROUP_ID`（エラー通知先LINEグループID）

**場所：** スプレッドシート `Setting` シート（A列：キー、B列：値）

| A列（キー）           | B列（値）                    |
| --------------------- | ---------------------------- |
| `LINE_ERROR_GROUP_ID` | エラー通知先のLINEグループID |

LINEグループIDはLStep管理画面のユーザー一覧などで確認できる。
設定がない場合、エラー発生時のLINE通知はスキップされる（`Logger.log` のみ）。

---

### 8. `Form_Group` シートの列構成・データ

**場所：** スプレッドシート `Form_Group` シート

回答の組み合わせと送信対象グループ（Group_ID）を定義するマスタシート。

#### 列構成

| 列名                     | 内容                                                |
| ------------------------ | --------------------------------------------------- |
| `Group_ID`               | グループID（PK）。`Job_Opening.Group_ID` と対応する |
| `希望する職種`           | `FORM_HEADER.jobType` の値と一致させる              |
| `希望する勤務エリア`     | `FORM_HEADER.area` の値と一致させる                 |
| `年代を教えてください。` | `FORM_HEADER.age` の値と一致させる                  |
| `宅建を持っていますか？` | `FORM_HEADER.skill` の値と一致させる                |
| （追加可能）             | `FORM_HEADER` に追加した設問を列として追加できる    |

**照合ルール：**

- シートのセルが空欄 → その列はワイルドカード（どの回答でも一致）
- セルに値あり → フォーム回答の値と完全一致で判定
- 一致した行の `Group_ID` がすべて返される（複数可）

#### 設定例

| Group_ID | 希望する職種 | 希望する勤務エリア | 宅建を持っていますか？ |
| -------- | ------------ | ------------------ | ---------------------- |
| 1        | 営業         | 東京               | はい                   |
| 2        | 営業         | 東京               | いいえ                 |
| 3        | 事務         |                    |                        |

---

### 9. `Job_Opening` シートの求人データ

**場所：** スプレッドシート `Job_Opening` シート
**登録方法：** スプレッドシートのメニュー「求人管理 → 求人を登録」から操作

| カラム          | 内容                                             |
| --------------- | ------------------------------------------------ |
| `ID`            | 自動付与（登録時の行番号）                       |
| `Vaild`         | 有効フラグ（チェックボックス）                   |
| `Group_ID`      | 送信対象グループ（`Form_Group.Group_ID` と対応） |
| `Url`           | 求人ページのURL（HOMESの求人URLを想定）          |
| `Job_Name`      | URLから自動取得                                  |
| `Salary`        | URLから自動取得                                  |
| `Working_Style` | URLから自動取得                                  |

---

### 10. スクレイピング対象サイトのHTML構造

**ファイル：** `fetchURL.gas` `parseCont1()`

現在 HOMES（`homes.co.jp`）の求人ページHTML構造に固定されている。

| 依存箇所                  | 内容                               |
| ------------------------- | ---------------------------------- |
| `section[class*="cont1"]` | 求人情報が含まれるセクションの特定 |
| `h1` タグ                 | 求人名の取得                       |
| `h3` + `p` タグの繰り返し | 各項目（給与・勤務時間など）の取得 |

他のサイトURLを登録した場合、この構造が存在しないためスクレイピングが失敗する。

> **課題（issues.md #11）：** 複数サイト対応が必要な場合、URLのドメインに応じてパーサーを切り替える設計が必要。

---

### 11. 抽出対象セクション名（h3テキスト）

**ファイル：** `fetchURL.gas` `extractRequiredData()` L33-34

```javascript
const salarySection = findSection("給与");
const workingTimeSection = findSection("勤務時間");
```

HOMESのHTML内の `h3` テキストに依存している。
サイトが変わったり、HOMESのHTML構造が変更された場合は修正が必要。

---

### 12. LINE送信テキストのフォーマット

**ファイル：** `returnLINE.gas` `createJobMessage()`

```javascript
function createJobMessage(job) {
  return (
    job.ID +
    "\r\n" +
    "■求人名：" +
    job.Job +
    "\r\n" +
    "■給与：" +
    job.Salary +
    "\r\n" +
    "■勤務形態：" +
    job.Working_Style +
    "\r\n" +
    "詳しくはこちら↓" +
    "\r\n" +
    job.Url
  );
}
```

顧客の要望に応じてラベル文字列やフォーマットを変更できる。
使用できるフィールドは `job.ID` / `job.Job` / `job.Salary` / `job.Working_Style` / `job.Url`。

求人が0件の場合のメッセージ（`"紹介できる求人がありません。"`）も同ファイルの `sendJobMessages()` 内で変更できる。
