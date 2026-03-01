import { Buffer } from "buffer";
import mammoth from "mammoth";

export interface ParseResult {
  text: string;
  pageHints?: Array<{ page: number }>;
  meta: {
    charCount: number;
    lineCount: number;
    pageCount?: number;
  };
}

export async function parseDOCX(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    if (!result.value || result.value.trim().length === 0) {
      throw new Error("DOCX contains no extractable text");
    }

    // Clean up DOCX parsing artifacts
    const cleanedText = result.value
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\n{3,}/g, "\n\n") // Normalize multiple newlines
      .trim();

    if (cleanedText.length < 50) {
      throw new Error("DOCX text appears to be too short or corrupted");
    }

    const lines = cleanedText.split("\n");
    const charCount = cleanedText.length;
    const lineCount = lines.length;

    return {
      text: cleanedText,
      meta: {
        charCount,
        lineCount,
      },
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("no extractable text")
    ) {
      throw error;
    }
    throw new Error(
      `Failed to parse DOCX: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
