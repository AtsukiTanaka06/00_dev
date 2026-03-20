import { create } from "zustand";
import { saveKey, loadKey } from "../utils/secureStorage";

export type PromptKey =
  | "topicExtractor"
  | "researchAgent"
  | "requirementsGenerator"
  | "strategyGenerator"
  | "contentGenerator"
  | "scriptGenerator";

export const PROMPT_LABELS: Record<PromptKey, string> = {
  topicExtractor: "トピック抽出",
  researchAgent: "リサーチ生成",
  requirementsGenerator: "要件定義生成",
  strategyGenerator: "戦略生成",
  contentGenerator: "コンテンツ生成",
  scriptGenerator: "スクリプト生成",
};

export const DEFAULT_PROMPTS: Record<PromptKey, string> = {
  topicExtractor: `あなたはビジネス分析の専門家です。
会議のトランスクリプトから主要トピックを抽出します。
必ずJSON配列形式のみで回答してください。例: ["トピック1", "トピック2", "トピック3"]`,

  researchAgent: `あなたは市場調査・競合分析の専門家です。
提供されたトピックについて、詳細なリサーチレポートをMarkdown形式で作成します。
日本語で回答してください。`,

  requirementsGenerator: `あなたはプロダクトマネージャー・システムアーキテクトです。
会議内容から要件定義書をMarkdown形式で作成します。
日本語で回答してください。`,

  strategyGenerator: `あなたはマーケティングストラテジストです。
会議内容からコンテンツ配信戦略をMarkdown形式で作成します。
日本語で回答してください。`,

  contentGenerator: `あなたはコンテンツクリエイターです。
会議内容からSNS投稿・ブログ記事などのコンテンツをMarkdown形式で作成します。
日本語で回答してください。`,

  scriptGenerator: `あなたは動画・ライブ配信のスクリプトライターです。
会議内容から動画・配信用スクリプトをMarkdown形式で作成します。
日本語で回答してください。`,
};

const STORAGE_PREFIX = "prompt_";

interface PromptState {
  prompts: Record<PromptKey, string>;
  loaded: boolean;
  getPrompt: (key: PromptKey) => string;
  savePrompts: (prompts: Record<PromptKey, string>) => Promise<void>;
  resetPrompt: (key: PromptKey) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: { ...DEFAULT_PROMPTS },
  loaded: false,

  getPrompt: (key) => get().prompts[key],

  savePrompts: async (prompts) => {
    await Promise.all(
      (Object.keys(prompts) as PromptKey[]).map((key) =>
        saveKey(`${STORAGE_PREFIX}${key}`, prompts[key])
      )
    );
    set({ prompts });
  },

  resetPrompt: async (key) => {
    const defaultValue = DEFAULT_PROMPTS[key];
    await saveKey(`${STORAGE_PREFIX}${key}`, defaultValue);
    set((s) => ({ prompts: { ...s.prompts, [key]: defaultValue } }));
  },

  loadFromStorage: async () => {
    const entries = await Promise.all(
      (Object.keys(DEFAULT_PROMPTS) as PromptKey[]).map(async (key) => {
        const stored = await loadKey(`${STORAGE_PREFIX}${key}`);
        return [key, stored || DEFAULT_PROMPTS[key]] as const;
      })
    );
    set({
      prompts: Object.fromEntries(entries) as Record<PromptKey, string>,
      loaded: true,
    });
  },
}));
