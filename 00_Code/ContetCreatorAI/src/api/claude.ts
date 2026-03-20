import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClaudeClient(apiKey: string): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return client;
}

export async function messagesCreate(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const anthropic = getClaudeClient(apiKey);
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
