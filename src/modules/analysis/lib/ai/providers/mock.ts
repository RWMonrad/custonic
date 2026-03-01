import { AIProvider } from '../adapter'
import { ChunkOutput, AnalysisOutput, riskTypeSchema, severitySchema } from '../schemas'
import { PROMPT_VERSION } from '../prompts'

export class MockProvider implements AIProvider {
  name = 'mock'

  async analyzeChunk(chunkText: string, chunkIndex: number, totalChunks: number): Promise<ChunkOutput> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Generate deterministic mock findings based on chunk content
    const findings = this.generateMockFindings(chunkText, chunkIndex)

    return {
      prompt_version: PROMPT_VERSION,
      chunk_index: chunkIndex,
      candidate_findings: findings
    }
  }

  async synthesizeFindings(candidateFindings: any[], fullText: string): Promise<AnalysisOutput> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200))

    // Generate deterministic final findings
    const finalFindings = this.generateFinalFindings(fullText, candidateFindings)

    return {
      prompt_version: PROMPT_VERSION,
      contract_summary: this.generateMockSummary(fullText),
      findings: finalFindings
    }
  }

  estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  private generateMockFindings(chunkText: string, chunkIndex: number) {
    const findings = []
    const text = chunkText.toLowerCase()

    // Look for risk keywords in chunk
    const riskKeywords = {
      liability: { type: 'liability' as const, severity: 'high' as const, confidence: 0.8 },
      termination: { type: 'termination' as const, severity: 'medium' as const, confidence: 0.7 },
      indemnity: { type: 'indemnity' as const, severity: 'high' as const, confidence: 0.9 },
      confidential: { type: 'confidentiality' as const, severity: 'medium' as const, confidence: 0.6 },
      payment: { type: 'payment_terms' as const, severity: 'low' as const, confidence: 0.5 },
      governing: { type: 'governing_law' as const, severity: 'low' as const, confidence: 0.6 }
    }

    let findingIndex = 0
    for (const [keyword, risk] of Object.entries(riskKeywords)) {
      if (text.includes(keyword) && findingIndex < 3) {
        const excerpt = this.extractExcerpt(chunkText, keyword)
        
        findings.push({
          risk_type: risk.type,
          severity: risk.severity,
          confidence: risk.confidence + (Math.random() * 0.2 - 0.1), // Add some variation
          title: `Potential ${risk.type.replace('_', ' ')} risk identified`,
          explanation: `Analysis of the ${keyword} clause indicates potential ${risk.type} considerations that may require review.`,
          recommended_review: `Review the ${keyword} provisions to ensure they align with standard practices and organizational risk tolerance.`,
          excerpt,
          confidence_boost: Math.random() * 0.2 - 0.1
        })
        findingIndex++
      }
    }

    return findings
  }

  private generateFinalFindings(fullText: string, candidateFindings: any[]) {
    // Select top findings from candidates and add proper citations
    const topFindings = candidateFindings
      .flat()
      .sort((a, b) => (b.confidence + b.confidence_boost) - (a.confidence + a.confidence_boost))
      .slice(0, 5)

    return topFindings.map((finding, index) => ({
      risk_type: finding.risk_type,
      severity: finding.severity,
      confidence: Math.min(1, Math.max(0, finding.confidence + finding.confidence_boost)),
      title: finding.title,
      explanation: finding.explanation,
      recommended_review: finding.recommended_review,
      citations: [{
        excerpt: finding.excerpt,
        chunk_index: finding.chunk_index || 0,
        start_hint: 'Context before risk clause',
        end_hint: 'Context after risk clause'
      }]
    }))
  }

  private generateMockSummary(fullText: string): string {
    const text = fullText.toLowerCase()
    
    let summary = 'This contract contains '
    
    if (text.includes('liability') || text.includes('indemnity')) {
      summary += 'significant liability provisions '
    }
    if (text.includes('termination')) {
      summary += 'termination clauses '
    }
    if (text.includes('confidential')) {
      summary += 'confidentiality requirements '
    }
    if (text.includes('payment')) {
      summary += 'payment terms '
    }
    
    summary += 'that require careful review to ensure adequate risk protection.'
    
    return summary
  }

  private extractExcerpt(text: string, keyword: string): string {
    const lowerText = text.toLowerCase()
    const keywordIndex = lowerText.indexOf(keyword.toLowerCase())
    
    if (keywordIndex === -1) return text.substring(0, 100)
    
    const start = Math.max(0, keywordIndex - 50)
    const end = Math.min(text.length, keywordIndex + keyword.length + 50)
    
    return text.substring(start, end).trim()
  }
}
