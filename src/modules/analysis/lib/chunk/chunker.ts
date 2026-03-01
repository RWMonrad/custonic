export interface Chunk {
  index: number
  text: string
  startChar: number
  endChar: number
  metadata?: {
    truncated?: boolean
    pageHint?: number
  }
}

export interface ChunkResult {
  chunks: Chunk[]
  metadata: {
    totalChunks: number
    totalChars: number
    truncated: boolean
    maxCharsPerChunk: number
    overlapChars: number
  }
}

export function chunkText(
  text: string,
  options: {
    maxCharsPerChunk?: number
    overlapChars?: number
    maxChunks?: number
  } = {}
): ChunkResult {
  const {
    maxCharsPerChunk = 10000, // ~8-12k chars as requested
    overlapChars = 600,       // ~500-800 chars overlap
    maxChunks = 30           // Hard cap as requested
  } = options

  if (!text || text.length === 0) {
    return {
      chunks: [],
      metadata: {
        totalChunks: 0,
        totalChars: 0,
        truncated: false,
        maxCharsPerChunk,
        overlapChars
      }
    }
  }

  const chunks: Chunk[] = []
  let currentPos = 0
  let chunkIndex = 0

  while (currentPos < text.length && chunkIndex < maxChunks) {
    const remainingText = text.slice(currentPos)
    
    // If this is the last chunk or remaining text is small, take it all
    if (remainingText.length <= maxCharsPerChunk || chunkIndex === maxChunks - 1) {
      chunks.push({
        index: chunkIndex,
        text: remainingText,
        startChar: currentPos,
        endChar: text.length,
        metadata: {
          truncated: chunkIndex === maxChunks - 1 && currentPos + maxCharsPerChunk < text.length
        }
      })
      break
    }

    // Find a good breaking point within the max chunk size
    let chunkEnd = currentPos + maxCharsPerChunk
    
    // Try to break at paragraph or sentence boundaries
    const paragraphBreak = remainingText.lastIndexOf('\n\n', maxCharsPerChunk)
    const sentenceBreak = remainingText.lastIndexOf('. ', maxCharsPerChunk)
    
    if (paragraphBreak > maxCharsPerChunk * 0.7) {
      // Good paragraph break found
      chunkEnd = currentPos + paragraphBreak + 2
    } else if (sentenceBreak > maxCharsPerChunk * 0.8) {
      // Good sentence break found
      chunkEnd = currentPos + sentenceBreak + 2
    }
    
    // Extract chunk
    const chunkText = text.slice(currentPos, chunkEnd)
    
    chunks.push({
      index: chunkIndex,
      text: chunkText,
      startChar: currentPos,
      endChar: chunkEnd
    })

    // Move to next position with overlap
    currentPos = Math.max(currentPos + 1, chunkEnd - overlapChars)
    chunkIndex++
  }

  const truncated = chunks.length === maxChunks && chunks[chunks.length - 1].endChar < text.length

  return {
    chunks,
    metadata: {
      totalChunks: chunks.length,
      totalChars: text.length,
      truncated,
      maxCharsPerChunk,
      overlapChars
    }
  }
}
