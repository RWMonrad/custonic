import { z } from 'zod'

// Risk types enum as specified
export const riskTypeSchema = z.enum([
  'payment_terms',
  'termination', 
  'liability',
  'indemnity',
  'governing_law',
  'confidentiality',
  'ip',
  'data_protection',
  'sla',
  'audit',
  'change_control',
  'warranties',
  'assignment',
  'force_majeure',
  'dispute_resolution',
  'other'
])

// Severity enum as specified
export const severitySchema = z.enum(['low', 'medium', 'high', 'critical'])

// Citation schema
export const citationSchema = z.object({
  excerpt: z.string().min(1, 'Excerpt cannot be empty'),
  chunk_index: z.number().int().min(0, 'Chunk index must be non-negative'),
  start_hint: z.string().optional(),
  end_hint: z.string().optional()
})

// Individual finding schema
export const findingSchema = z.object({
  risk_type: riskTypeSchema,
  severity: severitySchema,
  confidence: z.number().min(0, 'Confidence must be between 0 and 1').max(1, 'Confidence must be between 0 and 1'),
  title: z.string().min(1, 'Title cannot be empty').max(200, 'Title too long'),
  explanation: z.string().min(1, 'Explanation cannot be empty').max(1000, 'Explanation too long'),
  recommended_review: z.string().min(1, 'Recommended review cannot be empty').max(500, 'Recommended review too long'),
  citations: z.array(citationSchema).min(1, 'Each finding must have at least one citation').max(5, 'Too many citations')
})

// Final output schema (strict)
export const analysisOutputSchema = z.object({
  prompt_version: z.string().min(1, 'Prompt version required'),
  contract_summary: z.string().min(10, 'Summary too short').max(500, 'Summary too long'),
  findings: z.array(findingSchema).max(40, 'Too many findings')
})

// Chunk-level output schema (for pass 1)
export const chunkOutputSchema = z.object({
  prompt_version: z.string(),
  chunk_index: z.number().int(),
  candidate_findings: z.array(findingSchema.omit({ citations: true }).extend({
    excerpt: z.string(),
    confidence_boost: z.number().min(-0.2).max(0.2).default(0)
  })).max(10, 'Too many candidate findings in chunk')
})

// Type exports
export type RiskType = z.infer<typeof riskTypeSchema>
export type Severity = z.infer<typeof severitySchema>
export type Citation = z.infer<typeof citationSchema>
export type Finding = z.infer<typeof findingSchema>
export type AnalysisOutput = z.infer<typeof analysisOutputSchema>
export type ChunkOutput = z.infer<typeof chunkOutputSchema>
