# 📘 Spreadsheet Database Structure Specification

---

# 1. システム概要

本スプレッドシートは、求人情報管理およびフォーム回答処理を目的とした
擬似データベースとして利用する。

---

# 2. シート構成一覧

| Sheet Name    | Role                       |
| ------------- | -------------------------- |
| ID_MAP        | ユーザーと求人の紐付け管理 |
| Job_Opening   | 求人情報マスタ             |
| From_Group    | 回答テンプレート定義       |
| シート1       | フォーム回答データ         |
| Log           | 業務処理ログ               |
| Answer_ID_Log | 回答ID単位の処理ログ       |
| Logger        | システム内部ログ           |

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
- USER_ID + Send_Letter_ID の組み合わせは重複不可（推奨）

---

## 3.2 Job_Opening

### Purpose

求人情報マスタ

### Columns

| Column Name   | Type    | Required | Description    | FK                  |
| ------------- | ------- | -------- | -------------- | ------------------- |
| ID            | string  | Yes      | 求人ID（PK）   | -                   |
| Vaild         | boolean | Yes      | 有効フラグ     | -                   |
| Group_ID      | string  | Yes      | 回答グループID | From_Group.Group_ID |
| Url           | string  | Yes      | 求人URL        | -                   |
| Job_Name      | string  | Yes      | 求人名         | -                   |
| Salary        | string  | No       | 給与情報       | -                   |
| Working_Style | string  | No       | 勤務形態       | -                   |

### Constraints

- ID は一意
- Vaild = FALSE の場合は処理対象外

---

## 3.3 From_Group

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

## 3.6 Answer_ID_Log

### Purpose

回答ID単位での処理履歴を管理するログ

### Columns

| Column Name | Type     | Required | Description    |
| ----------- | -------- | -------- | -------------- |
| Timestamp   | datetime | Yes      | 処理時刻       |
| Status      | string   | Yes      | 処理ステータス |
| 回答ID      | string   | Yes      | 回答ID         |
| 回答日時    | datetime | Yes      | 回答日時       |
| 回答者ID    | string   | Yes      | 回答者ID       |
| 回答者名    | string   | Yes      | 回答者名       |

### Notes

- 回答IDごとの処理履歴を保存
- 重複処理防止のチェックに利用可能

---

## 3.7 Logger

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

```
ID_MAP.Send_Letter_ID
        ↓
Job_Opening.ID
        ↓
Job_Opening.Group_ID
        ↓
From_Group.Group_ID
```

---

# 5. 想定データフロー

1. フォーム回答登録
2. 回答データ保存（シート1）
3. 回答IDの重複チェック（Answer_ID_Log）
4. Job_Opening 参照
5. From_Group 参照
6. 業務処理実行
7. Log 出力
8. Answer_ID_Log 出力
9. Logger 出力

---

# 6. コード仕様書作成時に追記すべき項目

## 6.1 主キー定義

| Table       | Primary Key |
| ----------- | ----------- |
| Job_Opening | ID          |
| From_Group  | Group_ID    |
| シート1     | 回答ID      |

---

## 6.2 外部キー定義

| Table       | Column         | Reference           |
| ----------- | -------------- | ------------------- |
| ID_MAP      | Send_Letter_ID | Job_Opening.ID      |
| Job_Opening | Group_ID       | From_Group.Group_ID |

---

## 6.3 GAS関数設計（例）

取得系

- getUserJobs(userId)
- getJobById(id)
- getGroupById(groupId)
- getAnswerById(answerId)

更新系

- saveAnswer(data)
- writeLog(status,data)
- writeAnswerLog(data)
- writeSystemLog(level,context)

---

## 6.4 エラーハンドリング仕様

- try-catch を各処理単位で実装
- Logger シートへエラー出力
- 処理ステップを Step カラムに記録

---

## 6.5 同時実行対策

- LockService 使用検討
- Answer_ID_Log による重複処理防止

---

## 6.6 パフォーマンス方針

- getValues() の回数最小化
- Map構造で検索高速化
- シートアクセス回数削減

---

# 7. 将来拡張案

- ステータス管理カラム追加
- updated_at カラム
- API化
- RDB移行対応
