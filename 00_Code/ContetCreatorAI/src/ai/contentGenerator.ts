import { callAI } from "./provider";
import { usePromptStore } from "../store/promptStore";

export async function generateContents(
  transcript: string,
  topics: string[]
): Promise<string> {
  const systemPrompt = usePromptStore.getState().getPrompt("contentGenerator");

  const prompt = `以下の会議内容とトピックから、各チャネル向けコンテンツを作成してください。

## トピック
${topics.map((t) => `- ${t}`).join("\n")}

## 会議内容の概要
${transcript.slice(0, 2000)}

## 作成するコンテンツ
1. **Twitter/X投稿**（5件、各280文字以内、ハッシュタグ付き）
2. **LinkedIn投稿**（1件、ビジネス向け、500文字程度）
3. **ブログ記事アウトライン**（見出し構成・各セクションの要点）
4. **メルマガ本文**（件名3案 + 本文800文字程度）
5. **プレスリリース骨子**

Markdown形式で記述してください。`;

  return callAI(systemPrompt, prompt);
}
