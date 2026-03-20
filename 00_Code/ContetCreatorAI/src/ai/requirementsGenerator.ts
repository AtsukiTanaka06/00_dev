import { callAI } from "./provider";
import { usePromptStore } from "../store/promptStore";

export async function generateRequirements(
  transcript: string,
  topics: string[]
): Promise<string> {
  const systemPrompt = usePromptStore.getState().getPrompt("requirementsGenerator");

  const prompt = `以下の会議内容とトピックから、要件定義書を作成してください。

## トピック
${topics.map((t) => `- ${t}`).join("\n")}

## 会議内容の概要
${transcript.slice(0, 2000)}

## 作成する要件定義書の構成
1. プロジェクト概要・目的
2. 機能要件（ユーザーストーリー形式）
3. 非機能要件（パフォーマンス・セキュリティ・スケーラビリティ）
4. システム制約・前提条件
5. 優先度付きタスクリスト

Markdown形式で詳細に記述してください。`;

  return callAI(systemPrompt, prompt);
}
