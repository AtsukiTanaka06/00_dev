import { callAI } from "./provider";
import { usePromptStore } from "../store/promptStore";

export async function generateResearch(
  transcript: string,
  topics: string[]
): Promise<string> {
  const systemPrompt = usePromptStore.getState().getPrompt("researchAgent");

  const prompt = `以下の会議内容とトピックに基づいて、詳細なリサーチレポートを作成してください。

## トピック
${topics.map((t) => `- ${t}`).join("\n")}

## 会議内容の概要
${transcript.slice(0, 2000)}

## 作成するレポートの構成
1. 市場概況・トレンド分析
2. 競合分析
3. 技術・ソリューション動向
4. 機会とリスク
5. 推奨アクション

Markdown形式で詳細に記述してください。`;

  return callAI(systemPrompt, prompt);
}
