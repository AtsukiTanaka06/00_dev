import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(apiKey: string): OpenAI {
  if (!client || (client as unknown as { apiKey: string }).apiKey !== apiKey) {
    client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }
  return client;
}

export async function chatCompletion(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const openai = getOpenAIClient(apiKey);
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content ?? "";
}
