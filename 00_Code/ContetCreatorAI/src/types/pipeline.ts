export interface PipelineResult {
  topics: string[];
  research: string;
  requirements: string;
  strategy: string;
  contents: string;
  script: string;
}

export interface PipelineProgress {
  step: number;
  total: number;
  label: string;
}

export type ProgressCallback = (progress: PipelineProgress) => void;
