import { parseDOCX } from "./docx";
import { parsePDF } from "./pdf";

export interface ParseResult {
  text: string;
  pageHints?: any[];
  meta: {
    charCount: number;
    lineCount: number;
    pageCount?: number;
  };
}

export async function parseContractToText(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<ParseResult> {
  switch (mimeType) {
    case "application/pdf":
      return await parsePDF(buffer, filename);

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return await parseDOCX(buffer, filename);

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

export { parseDOCX, parsePDF };
