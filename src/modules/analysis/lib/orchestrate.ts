import { AIAdapter, AIConfig } from "./ai/adapter";
import { PROMPT_VERSION } from "./ai/prompts";
import { Finding } from "./ai/schemas";
import { chunkText } from "./chunk/chunker";
import { parseContractToText } from "./parse";

export interface AnalysisJob {
  id: string;
  orgId: string;
  contractId: string;
  fileUrl: string;
  mimeType: string;
  filename: string;
}

export interface OrchestrationResult {
  success: boolean;
  analysisId: string;
  findings?: Finding[];
  error?: string;
  metadata: {
    promptVersion: string;
    provider: string;
    model?: string;
    parseTime: number;
    analysisTime: number;
    totalTokens: number;
    chunksProcessed: number;
    findingsCount: number;
    truncated: boolean;
  };
}

export async function orchestrateAnalysis(
  job: AnalysisJob,
  fileBuffer: Buffer,
  aiConfig: AIConfig,
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  let parseTime = 0;
  let analysisTime = 0;
  let totalTokens = 0;

  try {
    // Step 1: Parse contract to text
    console.log(`📄 Parsing contract ${job.contractId}`);
    const parseStart = Date.now();

    const parseResult = await parseContractToText(
      fileBuffer,
      job.mimeType,
      job.filename,
    );
    parseTime = Date.now() - parseStart;

    console.log(
      `✅ Parsed ${parseResult.meta.charCount} characters in ${parseTime}ms`,
    );

    // Step 2: Chunk the text
    console.log(`🔪 Chunking text into manageable pieces`);
    const chunkResult = chunkText(parseResult.text, {
      maxCharsPerChunk: 10000,
      overlapChars: 600,
      maxChunks: 30,
    });

    console.log(
      `📊 Created ${chunkResult.chunks.length} chunks${chunkResult.metadata.truncated ? " (truncated)" : ""}`,
    );

    // Step 3: Initialize AI adapter
    const aiAdapter = new AIAdapter(aiConfig);
    totalTokens = chunkResult.chunks.reduce(
      (sum, chunk) => sum + aiAdapter.estimateTokens(chunk.text),
      0,
    );

    // Step 4: Analyze chunks (pass 1)
    console.log(
      `🤖 Analyzing ${chunkResult.chunks.length} chunks with ${aiConfig.provider}`,
    );
    const analysisStart = Date.now();

    const candidateFindings = [];
    for (let i = 0; i < chunkResult.chunks.length; i++) {
      const chunk = chunkResult.chunks[i];
      console.log(`  Processing chunk ${i + 1}/${chunkResult.chunks.length}`);

      const chunkAnalysisResult = await aiAdapter.analyzeChunk(
        chunk.text,
        i,
        chunkResult.chunks.length,
      );
      candidateFindings.push(...chunkAnalysisResult.candidate_findings);
    }

    console.log(`📋 Found ${candidateFindings.length} candidate findings`);

    // Step 5: Synthesize final findings (pass 2)
    console.log(`🔗 Synthesizing final findings`);
    const finalResult = await aiAdapter.synthesizeFindings(
      candidateFindings,
      parseResult.text,
    );
    analysisTime = Date.now() - analysisStart;

    console.log(
      `✅ Analysis complete: ${finalResult.findings.length} final findings`,
    );

    return {
      success: true,
      analysisId: job.id,
      findings: finalResult.findings,
      metadata: {
        promptVersion: finalResult.prompt_version,
        provider: aiAdapter.getProviderName(),
        model: aiConfig.model,
        parseTime,
        analysisTime,
        totalTokens,
        chunksProcessed: chunkResult.chunks.length,
        findingsCount: finalResult.findings.length,
        truncated: chunkResult.metadata.truncated,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Analysis failed for ${job.contractId}:`, errorMessage);

    return {
      success: false,
      analysisId: job.id,
      error: errorMessage,
      metadata: {
        promptVersion: PROMPT_VERSION,
        provider: aiConfig.provider,
        model: aiConfig.model,
        parseTime,
        analysisTime,
        totalTokens,
        chunksProcessed: 0,
        findingsCount: 0,
        truncated: false,
      },
    };
  }
}

// Helper function to validate analysis configuration
export function validateAnalysisConfig(config: AIConfig): void {
  if (!config.provider) {
    throw new Error("AI provider is required");
  }

  const validProviders = ["mock", "openai", "anthropic"];
  if (!validProviders.includes(config.provider)) {
    throw new Error(
      `Invalid AI provider: ${config.provider}. Must be one of: ${validProviders.join(", ")}`,
    );
  }

  if (config.provider !== "mock" && !config.model) {
    throw new Error(`Model is required for ${config.provider} provider`);
  }

  if (config.provider === "openai" && !process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY environment variable is required for OpenAI provider",
    );
  }

  if (config.provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is required for Anthropic provider",
    );
  }
}
