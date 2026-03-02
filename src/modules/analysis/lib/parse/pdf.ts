import { Buffer } from "buffer";
// @ts-expect-error - pdf-parse doesn't have proper TypeScript definitions
import pdf from "pdf-parse";

export interface ParseResult {
  text: string;
  pageHints?: Array<{ page: number }>;
  meta: {
    charCount: number;
    lineCount: number;
    pageCount?: number;
  };
}

export async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  try {
    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error("PDF contains no extractable text");
    }

    // Clean up common PDF parsing artifacts
    const cleanedText = data.text
      .replace(/\f/g, "\n\n") // Form feed to double newline
      .replace(/\s+\n/g, "\n") // Remove trailing spaces before newlines
      .replace(/\n{3,}/g, "\n\n") // Normalize multiple newlines
      .trim();

    if (cleanedText.length < 100) {
      throw new Error("PDF text appears to be too short or corrupted");
    }

    const lines = cleanedText.split("\n");
    const charCount = cleanedText.length;
    const lineCount = lines.length;

    return {
      text: cleanedText,
      pageHints: data.numpages
        ? Array.from({ length: data.numpages }, (_, i) => ({ page: i + 1 }))
        : undefined,
      meta: {
        charCount,
        lineCount,
        pageCount: data.numpages,
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
      `Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
