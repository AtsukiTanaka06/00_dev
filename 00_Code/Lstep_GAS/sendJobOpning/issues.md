# コードレビュー指摘事項

---

## 1. 回答値がハードコード（バグ）

**ファイル：** `returnLINE.gas` L48

```javascript
const groupId = getGroupIdByAnswers(["a", "b", "c"]);
```

**問題：** フォームの実回答値ではなく固定値 `["a","b","c"]` を渡しているため、どのユーザーが回答しても常に同じグループIDが使われる。

**修正案：**
```javascript
const groupId = getGroupIdByAnswers([data["Answer1"], data["Answer2"], data["Answer3"]]);
```

---

## 2. 送信件数の不整合（バグ）

**ファイル：** `returnLINE.gas` L1, L51

```javascript
const JOB_NUM = 2; // 2件取得する設定
// ...
const demo_message = sendJobs[0].ID + ...; // 0番目のみ使用
```

**問題：** `JOB_NUM = 2` で2件取得しているが、メッセージ生成では `sendJobs[0]` しか使っておらず、実際には1件しか送信されない。

**修正案：** `sendJobs` をループして複数件分のメッセージを生成するか、`JOB_NUM = 1` に変更する。

---

## 3. `onOpen` の二重定義（バグ）

**ファイル：** `AddJobData.gas` L1、`JobMange.gas` L4

両ファイルに `onOpen` 関数が定義されている。GASでは同名関数が複数存在する場合、実行される関数が不定になる（後に読み込まれた方が優先される場合がある）。

**問題：** `AddJobData.gas` の `onOpen` は「求人を登録」のみ、`JobMange.gas` の `onOpen` は「求人を登録」＋「有効/無効を一括設定」の両方を定義しており、実質 `JobMange.gas` 側に統一されている。`AddJobData.gas` の `onOpen` は不要。

**修正案：** `AddJobData.gas` の `onOpen` を削除し、`JobMange.gas` の `onOpen` のみに一本化する。

---

## 4. LStep APIエンドポイントのハードコード（保守性）

**ファイル：** `returnLINE.gas` L73

```javascript
const url = "https://api.lineml.jp/v1/api-codes/676/triggers/3a842350-1e2c-4864-85f4-83697d5a5e22";
```

**問題：** APIエンドポイントがコードに直書きされており、変更時にコード修正が必要。

**修正案：** スクリプトプロパティまたは `Setting` シートで管理する。

---

## 5. 求人IDの管理方式（設計リスク）

**ファイル：** `AddJobData.gas` L31

```javascript
const newId = lastRow; // 1行目ヘッダ想定
```

**問題：** IDを「最終行番号」で採番しているため、行を削除すると欠番や重複が発生しうる。また `updateJobValidBulk` でも `rowIndex = ID + 1` でID→行番号変換しているため、行の順番が変わると更新対象がずれる。

**修正案：** IDをUUIDや連番カウンター（シート上の最大ID+1）で採番し、行番号とIDを切り離す。

---

## 6. タイポ（APIパラメータ名）

**ファイル：** `returnLINE.gas` L80

```javascript
params: {
  sned_message: message  // "send_message" のタイポ
}
```

**問題：** `sned_message` は `send_message` のタイポ。LStep API側でこのパラメータ名を想定している場合は問題ないが、API仕様と照合が必要。

---

## 7. スクレイピング対象サイトの固定（拡張性）

**ファイル：** `fetchURL.gas`

`parseCont1` 関数は HOMES（`homes.co.jp`）のHTML構造（`class="cont1"` のsectionタグ）に依存した実装になっている。

**問題：** 他の求人サイトのURLを登録した場合、正しく情報取得できない。

**修正案：** 複数サイト対応が必要な場合はURLドメインに応じてパーサーを切り替える設計にする。

---

## 8. `deleteOldLogs` のトリガー未設定リスク（運用）

**ファイル：** `returnLINE.gas` L253

**問題：** `deleteOldLogs` 関数は定期実行トリガーの手動設定が必要だが、未設定のままだとLoggerシートが無制限に肥大化し、スプレッドシートのパフォーマンス低下やストレージ超過の原因になる。

**対応：** GASトリガー設定で毎日1回の時間主導型トリガーを設定する。

---

## 優先度まとめ

| # | 分類 | 優先度 |
|---|---|---|
| 1 | 回答値ハードコード | 🔴 高（機能バグ） |
| 2 | 送信件数不整合 | 🔴 高（機能バグ） |
| 3 | onOpen二重定義 | 🟡 中（動作不安定） |
| 4 | APIエンドポイントハードコード | 🟡 中（保守性） |
| 5 | ID管理方式 | 🟡 中（設計リスク） |
| 6 | タイポ（APIパラメータ） | 🟡 中（要API仕様確認） |
| 7 | スクレイピング固定 | 🟢 低（拡張時に対応） |
| 8 | ログ削除トリガー未設定 | 🟢 低（運用設定） |
