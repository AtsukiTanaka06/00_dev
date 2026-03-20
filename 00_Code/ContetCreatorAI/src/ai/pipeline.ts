import { extractTopics } from "./topicExtractor";
import { generateResearch } from "./researchAgent";
import { generateRequirements } from "./requirementsGenerator";
import { generateStrategy } from "./strategyGenerator";
import { generateContents } from "./contentGenerator";
import { generateScript } from "./scriptGenerator";
import type { PipelineResult, ProgressCallback } from "../types/pipeline";

const STEPS = [
  "トピック抽出中...",
  "リサーチ生成中...",
  "要件定義生成中...",
  "戦略生成中...",
  "コンテンツ生成中...",
  "スクリプト生成中...",
] as const;

export async function runPipeline(
  transcript: string,
  onProgress: ProgressCallback
): Promise<PipelineResult> {
  const total = STEPS.length;

  const progress = (step: number) =>
    onProgress({ step, total, label: STEPS[step - 1] });

  // STEP 1: トピック抽出
  progress(1);
  const topics = await extractTopics(transcript);

  // STEP 2: リサーチ
  progress(2);
  const research = await generateResearch(transcript, topics);

  // STEP 3: 要件定義
  progress(3);
  const requirements = await generateRequirements(transcript, topics);

  // STEP 4: 戦略
  progress(4);
  const strategy = await generateStrategy(transcript, topics);

  // STEP 5: コンテンツ
  progress(5);
  const contents = await generateContents(transcript, topics);

  // STEP 6: スクリプト
  progress(6);
  const script = await generateScript(transcript, topics);

  return { topics, research, requirements, strategy, contents, script };
}
