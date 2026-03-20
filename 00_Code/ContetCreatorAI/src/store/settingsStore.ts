import { create } from "zustand";
import { saveKey, loadKey } from "../utils/secureStorage";

type AIProvider = "openai" | "claude";

const KEYS = {
  aiProvider: "ai_provider",
  openaiApiKey: "openai_api_key",
  claudeApiKey: "claude_api_key",
  notionApiKey: "notion_api_key",
} as const;

interface SettingsState {
  aiProvider: AIProvider;
  openaiApiKey: string;
  claudeApiKey: string;
  notionApiKey: string;
  loaded: boolean;
  setProvider: (provider: AIProvider) => void;
  saveSettings: (settings: {
    aiProvider: AIProvider;
    openaiApiKey: string;
    claudeApiKey: string;
    notionApiKey: string;
  }) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  aiProvider: "openai",
  openaiApiKey: "",
  claudeApiKey: "",
  notionApiKey: "",
  loaded: false,

  setProvider: (aiProvider) => set({ aiProvider }),

  saveSettings: async (settings) => {
    await Promise.all([
      saveKey(KEYS.aiProvider, settings.aiProvider),
      saveKey(KEYS.openaiApiKey, settings.openaiApiKey),
      saveKey(KEYS.claudeApiKey, settings.claudeApiKey),
      saveKey(KEYS.notionApiKey, settings.notionApiKey),
    ]);
    set(settings);
  },

  loadFromStorage: async () => {
    const [aiProvider, storedOpenai, claudeApiKey, storedNotion] =
      await Promise.all([
        loadKey(KEYS.aiProvider),
        loadKey(KEYS.openaiApiKey),
        loadKey(KEYS.claudeApiKey),
        loadKey(KEYS.notionApiKey),
      ]);

    // ストアに保存済みの値を優先し、なければ環境変数をフォールバック
    const openaiApiKey = storedOpenai || import.meta.env.VITE_OPENAI_API_KEY || "";
    const notionApiKey = storedNotion || import.meta.env.VITE_NOTION_API_KEY || "";

    set({
      aiProvider: (aiProvider as AIProvider) || "openai",
      openaiApiKey,
      claudeApiKey,
      notionApiKey,
      loaded: true,
    });
  },
}));
