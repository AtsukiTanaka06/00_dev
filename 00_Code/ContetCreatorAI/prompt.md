# ROLE

あなたはシニアソフトウェアアーキテクト兼フルスタックエンジニアです。

Windows向けのデスクトップアプリを設計・実装してください。

このアプリは **会議トランスクリプトからコンテンツ制作資料を生成するAIツール**です。

---

# GOAL

ユーザーが会議トランスクリプトを入力すると
以下の成果物を自動生成する。

Mindmap
Research
Requirements
Strategy
Contents
Script

さらに必要に応じて Notion Database に保存できる。

---

# IMPORTANT REQUIREMENT

AI APIや外部サービスAPIは **ユーザー自身が設定する方式**にする。

ユーザーが設定するAPI

OpenAI API Key
Claude API Key
Notion API Key
Mindmap API Key

APIキーはローカルセキュアストレージに保存する。

---

# DESKTOP APPLICATION

Windowsデスクトップアプリとして実装する。

技術スタック

Frontend

React

Desktop Framework

Tauri

Language

TypeScript

AI

OpenAI API
または
Claude API

Mindmap

Whimsical API

Database

Notion API

User Authentication

Supabase Auth

---

# USER MANAGEMENT

ユーザー管理を実装する。

Authentication

Supabase Auth

機能

Signup
Login
Logout

Users table

id
email
created_at

---

# LICENSE SYSTEM

ライセンス認証機能を実装する。

Database table

licenses

id
user_id
license_key
plan
status
created_at

License Flow

アプリ起動
↓
Login
↓
License check
↓
有効ならアプリ使用可能

Plan example

Free

1日3回生成

Pro

無制限生成

---

# USER INTERFACE

以下の5画面を作る。

Screen 1

Login

Email
Password
Login
Sign up

Screen 2

License Activation

License Key入力
Activate

Screen 3

Transcript Input

会議トランスクリプト入力

Generateボタン

Screen 4

Results

生成結果表示

Mindmap
Research
Requirements
Strategy
Contents
Script

Screen 5

Settings

API設定画面

AI Provider

OpenAI
Claude

OpenAI API Key

Claude API Key

Notion API Key

Mindmap API Key

保存

ローカルセキュアストレージ

---

# AI PIPELINE

Transcript
↓
Topic Extraction
↓
Mindmap生成
↓
Research Agent
↓
Requirements生成
↓
Strategy生成
↓
Contents生成
↓
Script生成
↓
Notion保存

---

# INPUT FORMAT

会議トランスクリプト

例

田中:
インフルエンサーマーケティングのツールを作りたい

佐藤:
1000人以上のインフルエンサーを抽出したい

山本:
InstagramのBANは避けたい

---

# OUTPUT FILES

Research.md
Requirements.md
Strategy.md
Contents.md
Script.md

---

# NOTION DATABASE

Database name

AI Content Pipeline

Properties

Title

Type

mindmap
research
requirements
strategy
contents
script

MindmapURL

Content

CreatedAt

---

# DIRECTORY STRUCTURE

content-ai-desktop

src

ui

App.tsx
Login.tsx
License.tsx
TranscriptInput.tsx
ResultsView.tsx
Settings.tsx

ai

pipeline.ts
topicExtractor.ts
researchAgent.ts
requirementsGenerator.ts
strategyGenerator.ts
contentGenerator.ts
scriptGenerator.ts

integrations

openai.ts
claude.ts
notion.ts
mindmap.ts

storage

settings.ts

prompts

mindmap.md
research.md
requirements.md
strategy.md
contents.md
script.md

src-tauri

main.rs

package.json

---

# BUILD

このアプリはWindows用デスクトップアプリとしてビルドできるようにする。

Tauri buildコマンドで

ContentAI.exe

を生成できるようにする。

---

# DEVELOPMENT PROCESS

以下の順番で実装する。

Step1

Architecture Design

Step2

Project Structure

Step3

User Authentication

Step4

License System

Step5

AI Pipeline

Step6

UI Implementation

Step7

External API Integration

Step8

Windows Build Configuration

Step9

Packaging

---

# FINAL GOAL

ユーザーは

ContentAI.exe

を起動して

Login
License Activation

を行い

会議トランスクリプトを入力して Generate を押すだけで

Mindmap
Research
Requirements
Strategy
Contents
Script

が生成される。

さらに必要に応じて Notion Database に保存できる。

---
