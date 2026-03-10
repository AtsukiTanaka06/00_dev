# コードレビュー指摘事項

---

## 1. ~~`getGroupIdsByAnswers` の照合バグ（バグ）~~ ✅ 解決済み

**ファイル：** `Mapping.gas` L39

**問題：** `answers`（rawFormData）は日本語列名（`"希望する職種"` 等）でキーイングされているが、`col.key` はJSオブジェクトキー（`"jobType"` 等）で参照していたため、`answerValue` が常に `undefined` となり全Group_IDが返却されていた。

**対応：** `answers[FORM_HEADER[col.key]]` に変更し、`searchColumns` に `header` プロパティを追加。

---

## 2. ~~catch ブロック内のステータス誤記（バグ）~~ ✅ 解決済み

**ファイル：** `returnLINE.gas` L132

**問題：** `onSheetChange` の catch ブロック内で `writeAnsweIdLog` に `"送信成功"` を渡しており、失敗が成功として記録されていた。

**対応：** `"送信失敗"` に変更。

---

## 3. `sendLineMessage` 未定義（バグ）

**ファイル：** `returnLINE.gas` L208

```javascript
sendLineMessage(groupId, text); // この関数はどのファイルにも定義されていない
```

**問題：** `notifyLineError()` 内で `sendLineMessage()` を呼び出しているが、プロジェクト内のどのファイルにも定義が存在しない。エラー通知が必要な場面で実行時エラーが発生する。

**修正案：** `sendLstepAPI(groupId, text)` に変更するか、`sendLineMessage` 関数を別途定義する。

---

## 4. `onOpen` の二重定義（バグ）

**ファイル：** `AddJobData.gas` L1、`JobMange.gas` L4

両ファイルに `onOpen` 関数が定義されている。GASでは同名関数が複数存在する場合、実行される関数が不定になる。

**問題：** `AddJobData.gas` の `onOpen` は「求人を登録」のみ、`JobMange.gas` の `onOpen` は両メニューを含む。`AddJobData.gas` の定義は実質デッドコード。

**修正案：** `AddJobData.gas` の `onOpen` を削除し、`JobMange.gas` の `onOpen` のみに一本化する。

---

## 5. LStep APIエンドポイントのハードコード（保守性）

**ファイル：** `returnLINE.gas` L145

```javascript
const url = "https://api.lineml.jp/v1/api-codes/676/triggers/3a842350-1e2c-4864-85f4-83697d5a5e22";
```

**問題：** APIエンドポイントがコードに直書きされており、変更時にコード修正が必要。

**修正案：** スクリプトプロパティまたは `Setting` シートで管理する。

---

## 6. 求人IDの管理方式（設計リスク）

**ファイル：** `AddJobData.gas` L31

```javascript
const newId = lastRow; // 1行目ヘッダ想定
```

**問題：** IDを「最終行番号」で採番しているため、行を削除すると欠番や重複が発生しうる。また `updateJobValidBulk` でも `rowIndex = ID + 1` でID→行番号変換しているため、行の順番が変わると更新対象がずれる。

**修正案：** IDをUUIDや連番カウンター（シート上の最大ID+1）で採番し、行番号とIDを切り離す。

---

## 7. ~~タイポ（APIパラメータ名）~~ ✅ 解決済み

**ファイル：** `returnLINE.gas` L152

**問題：** `sned_message` は `send_message` のタイポ。

**対応：** `send_message` に修正。

---

## 8. シート1フィルタのコメントアウト（バグリスク）

**ファイル：** `returnLINE.gas` L33〜42

```javascript
/*
const sheet = e.source.getActiveSheet();
if (sheet.getName() !== FORM_SHEET_NAME) {
  return;
}
*/
```

**問題：** シート名チェックがコメントアウトされており、スプレッドシート上のどのシートが変更されても処理が発火する。不要な処理実行、誤ったデータ取得につながる可能性がある。

**修正案：** コメントアウトを解除し、`シート1` 以外の変更では処理をスキップするようにする。なお `e.source.getActiveSheet()` は変更時トリガーでは動作が不安定なため、`e.source.getSheetByName(FORM_SHEET_NAME)` とlastRowを使った判定に変更することを推奨。

---

## 9. `From_Group` vs `Form_Group` の命名不統一（ドキュメント）

**ファイル：** `SpreadStructure.md`、`Mapping.gas` L14

`SpreadStructure.md` ではシート名を `From_Group` と記載しているが、コードは `"Form_Group"` を参照している。

**問題：** ドキュメントとコードの乖離。実際のスプレッドシートのシート名がどちらかによって動作に影響する。

**修正案：** `SpreadStructure.md` を `Form_Group` に統一するか、シート名を確認して正しい方に合わせる。

---

## 10. `ID_MAP` 構造の仕様書との不一致（ドキュメント）

**ファイル：** `SpreadStructure.md` 3.1節、`Mapping.gas`

`SpreadStructure.md` では ID_MAP を `USER_ID + Send_Letter_ID`（1行1求人）として定義しているが、実コードは1ユーザー1行でJSON配列として求人IDを管理している。

**修正案：** `SpreadStructure.md` の ID_MAP 定義を実装に合わせて修正する（`Send_Letter_ID` → `JSON配列`）。

---

## 11. スクレイピング対象サイトの固定（拡張性）

**ファイル：** `fetchURL.gas`

`parseCont1` 関数は HOMES（`homes.co.jp`）のHTML構造（`class="cont1"` のsectionタグ）に依存。

**問題：** 他の求人サイトのURLを登録した場合、正しく情報取得できない。

**修正案：** 複数サイト対応が必要な場合はURLドメインに応じてパーサーを切り替える設計にする。

---

## 12. `deleteOldLogs` のトリガー未設定リスク（運用）

**ファイル：** `returnLINE.gas` L422

**問題：** `deleteOldLogs` 関数は定期実行トリガーの手動設定が必要だが、未設定のままだとLoggerシートが無制限に肥大化する。

**対応：** GASトリガー設定で毎日1回の時間主導型トリガーを設定する。

---

## 優先度まとめ

| # | 内容 | 優先度 |
|---|---|---|
| 1 | ~~`getGroupIdsByAnswers` 照合バグ~~ | ✅ 解決済み |
| 2 | ~~catch ブロックのステータス誤記~~ | ✅ 解決済み |
| 3 | `sendLineMessage` 未定義 | 🔴 高（実行時エラー） |
| 4 | `onOpen` 二重定義 | 🟡 中（動作不安定） |
| 5 | APIエンドポイントハードコード | 🟡 中（保守性） |
| 6 | ID管理方式 | 🟡 中（設計リスク） |
| 7 | ~~タイポ（APIパラメータ）~~ | ✅ 解決済み |
| 8 | シート1フィルタのコメントアウト | 🟡 中（バグリスク） |
| 9 | `From_Group` vs `Form_Group` 不統一 | 🟡 中（ドキュメント） |
| 10 | ID_MAP 仕様書との不一致 | 🟢 低（ドキュメント） |
| 11 | スクレイピング固定 | 🟢 低（拡張時に対応） |
| 12 | ログ削除トリガー未設定 | 🟢 低（運用設定） |
