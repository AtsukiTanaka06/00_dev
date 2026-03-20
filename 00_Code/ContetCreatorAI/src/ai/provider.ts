import { chatCompletion } from "../api/openai";
import { messagesCreate } from "../api/claude";
import { useSettingsStore } from "../store/settingsStore";
import { withRetry } from "../utils/retry";

export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const { aiProvider, openaiApiKey, claudeApiKey } = useSettingsStore.getState();

  if (aiProvider === "claude") {
    if (!claudeApiKey) throw new Error("Claude APIキーが設定されていません");
    return withRetry(() => messagesCreate(claudeApiKey, systemPrompt, userPrompt));
  } else {
    if (!openaiApiKey) throw new Error("OpenAI APIキーが設定されていません");
    return withRetry(() => chatCompletion(openaiApiKey, systemPrompt, userPrompt));
  }
}
