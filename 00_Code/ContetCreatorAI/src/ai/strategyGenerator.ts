import { callAI } from "./provider";
import { usePromptStore } from "../store/promptStore";

export async function generateStrategy(
  transcript: string,
  topics: string[]
): Promise<string> {
  const systemPrompt = usePromptStore.getState().getPrompt("strategyGenerator");

  const prompt = `以下の会議内容とトピックから、コンテンツ配信戦略を作成してください。

## トピック
${topics.map((t) => `- ${t}`).join("\n")}

## 会議内容の概要
${transcript.slice(0, 2000)}

## 作成する戦略の構成
1. ターゲットオーディエンス定義
2. コンテンツテーマ・メッセージング
3. チャネル別配信戦略（SNS / ブログ / 動画 / メルマガ）
4. 配信スケジュール（週次・月次）
5. KPI・成果指標
6. 予算配分の提案

Markdown形式で詳細に記述してください。`;

  return callAI(systemPrompt, prompt);
}
