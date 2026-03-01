import { z } from "zod";
import {
    AnalysisOutput,
    ChunkOutput,
    analysisOutputSchema,
    chunkOutputSchema,
} from "./schemas";

export interface AIProvider {
  name: string;
  analyzeChunk(
    chunkText: string,
    chunkIndex: number,
    totalChunks: number,
  ): Promise<ChunkOutput>;
  synthesizeFindings(
    candidateFindings: any[],
    fullText: string,
  ): Promise<AnalysisOutput>;
  estimateTokens(text: string): number;
}

export interface AIConfig {
  provider: "mock" | "openai" | "anthropic";
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class AIAdapter {
  private provider: AIProvider;

  constructor(config: AIConfig) {
    // Initialize provider synchronously
    this.provider = this.createProvider(config);
  }

  private createProvider(config: AIConfig): AIProvider {
    switch (config.provider) {
      case "mock":
        const { MockProvider } = require("./providers/mock");
        return new MockProvider();
      case "openai":
        const { OpenAIProvider } = require("./providers/openai");
        return new OpenAIProvider(config.model || "gpt-4");
      case "anthropic":
        const { AnthropicProvider } = require("./providers/anthropic");
        return new AnthropicProvider(
          config.model || "claude-3-sonnet-20240229",
        );
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  async analyzeChunk(
    chunkText: string,
    chunkIndex: number,
    totalChunks: number,
  ): Promise<ChunkOutput> {
    try {
      const result = await this.provider.analyzeChunk(
        chunkText,
        chunkIndex,
        totalChunks,
      );

      // Validate output with Zod
      const validated = chunkOutputSchema.parse(result);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid AI output for chunk ${chunkIndex}: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async synthesizeFindings(
    candidateFindings: any[],
    fullText: string,
  ): Promise<AnalysisOutput> {
    try {
      const result = await this.provider.synthesizeFindings(
        candidateFindings,
        fullText,
      );

      // Validate output with Zod
      const validated = analysisOutputSchema.parse(result);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid AI output for synthesis: ${error.message}`);
      }
      throw error;
    }
  }

  estimateTokens(text: string): number {
    return this.provider.estimateTokens(text);
  }

  getProviderName(): string {
    return this.provider.name;
  }
}
