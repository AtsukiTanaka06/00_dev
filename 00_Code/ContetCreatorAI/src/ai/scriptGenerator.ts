import { callAI } from "./provider";
import { usePromptStore } from "../store/promptStore";

export async function generateScript(
  transcript: string,
  topics: string[]
): Promise<string> {
  const systemPrompt = usePromptStore.getState().getPrompt("scriptGenerator");

  const prompt = `以下の会議内容とトピックから、動画・配信用スクリプトを作成してください。

## トピック
${topics.map((t) => `- ${t}`).join("\n")}

## 会議内容の概要
${transcript.slice(0, 2000)}

## 作成するスクリプト
1. **YouTube動画スクリプト**（10〜15分想定）
   - オープニング（フック・自己紹介）
   - 本編（各トピックの解説）
   - クロージング（CTA）
2. **ショート動画スクリプト**（60秒想定、3本）
3. **ライブ配信トークスクリプト**（30分想定）
   - オープニング
   - メインコンテンツ
   - Q&Aセクション

Markdown形式で詳細に記述してください。`;

  return callAI(systemPrompt, prompt);
}
