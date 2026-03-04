# 📘 Spreadsheet Database Structure Specification

---

# 1. システム概要

本スプレッドシートは、求人情報管理およびフォーム回答処理を目的とした
擬似データベースとして利用する。

---

# 2. シート構成一覧

| Sheet Name  | Role                       |
| ----------- | -------------------------- |
| ID_MAP      | ユーザーと求人の紐付け管理 |
| Job_Opening | 求人情報マスタ             |
| Form_Group  | 回答テンプレート定義       |
| シート1     | フォーム回答データ         |
| Log         | 業務処理ログ               |
| Logger      | システム内部ログ           |

---

# 3. テーブル定義

---

## 3.1 ID_MAP

### Purpose

ユーザーと送信対象求人の関連付けを管理する

### Columns

| Column Name    | Type   | Required | Description | FK             |
| -------------- | ------ | -------- | ----------- | -------------- |
| USER_ID        | string | Yes      | ユーザーID  | -              |
| Send_Letter_ID | string | Yes      | 求人ID      | Job_Opening.ID |

### Constraints

- Send_Letter_ID は Job_Opening.ID に存在する値のみ許可
- USER_ID + Send_Letter_ID は重複不可（推奨）

---

## 3.2 Job_Opening

### Purpose

求人情報マスタ

### Columns

| Column Name   | Type    | Required | Description    | FK                  |
| ------------- | ------- | -------- | -------------- | ------------------- |
| ID            | string  | Yes      | 求人ID（PK）   | -                   |
| Vaild         | boolean | Yes      | 有効フラグ     | -                   |
| Group_ID      | string  | Yes      | 回答グループID | Form_Group.Group_ID |
| Url           | string  | Yes      | 求人URL        | -                   |
| Job_Name      | string  | Yes      | 求人名         | -                   |
| Salary        | string  | No       | 給与情報       | -                   |
| Working_Style | string  | No       | 勤務形態       | -                   |

### Constraints

- ID は一意
- Vaild = FALSE の場合は外部処理対象外

---

## 3.3 Form_Group

### Purpose

回答テンプレート管理

### Columns

| Column Name | Type   | Required | Description       |
| ----------- | ------ | -------- | ----------------- |
| Group_ID    | string | Yes      | グループID（PK）  |
| Answer1     | string | Yes      | 回答テンプレート1 |
| Answer2     | string | Yes      | 回答テンプレート2 |
| Answer3     | string | Yes      | 回答テンプレート3 |

### Constraints

- Group_ID は一意

---

## 3.4 シート1（フォーム回答）

### Purpose

フォーム回答保存

### Columns

| Column Name | Type     | Required | Description |
| ----------- | -------- | -------- | ----------- |
| 回答ID      | string   | Yes      | 回答一意ID  |
| 回答日時    | datetime | Yes      | 回答日時    |
| 回答者ID    | string   | Yes      | 回答者ID    |
| 回答者名    | string   | Yes      | 回答者名    |
| Answer1     | string   | Yes      | 回答1       |
| Answer2     | string   | Yes      | 回答2       |
| Answer3     | string   | Yes      | 回答3       |

### Constraints

- 回答ID は一意
- 回答者ID は ID_MAP.USER_ID と関連する想定

---

## 3.5 Log

### Purpose

業務処理ログ

### Columns

| Column Name | Type     | Required | Description       |
| ----------- | -------- | -------- | ----------------- |
| Timestamp   | datetime | Yes      | 処理時刻          |
| Status      | string   | Yes      | SUCCESS / FAIL 等 |
| 回答ID      | string   | Yes      | 回答ID            |
| 回答日時    | datetime | Yes      | 回答日時          |
| 回答者ID    | string   | Yes      | 回答者ID          |
| 回答者名    | string   | Yes      | 回答者名          |

---

## 3.6 Logger

### Purpose

システム内部ログ

### Columns

| Column Name | Type     | Required | Description         |
| ----------- | -------- | -------- | ------------------- |
| Timestamp   | datetime | Yes      | 出力時刻            |
| Level       | string   | Yes      | INFO / WARN / ERROR |
| Function    | string   | Yes      | 実行関数名          |
| Step        | string   | Yes      | 処理ステップ        |
| Message     | string   | Yes      | メッセージ          |
| Detail      | string   | No       | 詳細情報            |

---

# 4. リレーション

ID_MAP.Send_Letter_ID
→ Job_Opening.ID

Job_Opening.Group_ID
→ Form_Group.Group_ID

---

# 5. 想定データフロー

1. フォーム回答登録
2. 回答データ保存（シート1）
3. Job_Opening 参照
4. Form_Group 参照
5. 業務処理実行
6. Log 出力
7. Logger 出力

---

# 6. コード仕様書作成時に追記すべき項目

## 6.1 主キー・一意制約の明文化

- 各シートのPK定義
- 重複時の挙動

## 6.2 トランザクション方針

- 途中失敗時のロールバック方法
- 書き込み順序

## 6.3 バリデーション仕様

- Nullチェック
- 参照整合性チェック
- 型チェック

## 6.4 GAS関数設計

例:

- getJobById(id)
- getGroupById(groupId)
- saveAnswer(data)
- writeLog(status, data)
- writeSystemLog(level, context)

## 6.5 エラーハンドリング仕様

- try-catch範囲
- Logger出力ルール
- 再実行可否

## 6.6 同時実行対策

- LockService使用有無
- 重複実行防止キー

## 6.7 パフォーマンス方針

- 全件取得回避
- キャッシュ利用有無
- 検索方法（Map化など）

## 6.8 命名規則

- シート名は固定文字列管理
- 定数化方針
- カラム名ハードコード禁止

---

# 7. 今後拡張検討項目

- ステータス管理カラム追加
- 論理削除フラグ
- 更新日時カラム
- API化設計
- DB移行想定設計
