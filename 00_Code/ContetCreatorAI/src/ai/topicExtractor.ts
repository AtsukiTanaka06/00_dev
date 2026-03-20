import { callAI } from "./provider";
import { usePromptStore } from "../store/promptStore";

export async function extractTopics(transcript: string): Promise<string[]> {
  const systemPrompt = usePromptStore.getState().getPrompt("topicExtractor");

  const prompt = `以下の会議トランスクリプトから主要なトピックを5〜10個抽出してください。
JSON配列形式のみで回答してください。

トランスクリプト:
${transcript}`;

  const result = await callAI(systemPrompt, prompt);

  try {
    const match = result.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("JSON配列が見つかりません");
    return JSON.parse(match[0]) as string[];
  } catch {
    return result
      .split("\n")
      .map((l) => l.replace(/^[-*•\d.]\s*/, "").trim())
      .filter((l) => l.length > 0)
      .slice(0, 10);
  }
}
