import { parseDOCX } from "./docx";
import { parsePDF } from "./pdf";

export interface ParseResult {
  text: string;
  pageHints?: Array<{ page: number }>;
  meta: {
    charCount: number;
    lineCount: number;
    pageCount?: number;
  };
}

export async function parseContractToText(
  buffer: Buffer,
  mimeType: string,
): Promise<ParseResult> {
  switch (mimeType) {
    case "application/pdf":
      return await parsePDF(buffer);

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return await parseDOCX(buffer);

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

export { parseDOCX, parsePDF };
