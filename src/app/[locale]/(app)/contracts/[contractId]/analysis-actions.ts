'use server'

import { z } from 'zod'
import { db } from '@/shared/db'
import { contracts } from '@/shared/db/schema'
import { analyses, analysisTypeEnum } from '@/shared/db/schema/analyses'
import { getContractById } from '@/modules/contracts/lib/contracts'
import { getCurrentOrgIdOrThrow } from '@/modules/auth/lib/current-org'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const enqueueAnalysisSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  analysisType: z.enum(analysisTypeEnum.enumValues).default('risk_assessment')
})

export type EnqueueAnalysisState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  analysisId?: string
}

export const initialEnqueueAnalysisState: EnqueueAnalysisState = { status: 'idle' }

export async function enqueueAnalysisAction(
  prevState: EnqueueAnalysisState,
  formData: FormData
): Promise<EnqueueAnalysisState> {
  const contractId = formData.get('contractId') as string
  const analysisType = formData.get('analysisType') as string || 'risk_assessment'

  const validatedFields = enqueueAnalysisSchema.safeParse({ contractId, analysisType })
  
  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.issues[0]?.message || 'Invalid input'
    }
  }

  try {
    // Get current org and verify contract access
    const orgId = await getCurrentOrgIdOrThrow()
    const contract = await getContractById(validatedFields.data.contractId)

    if (!contract) {
      return {
        status: 'error',
        message: 'Contract not found or access denied'
      }
    }

    // Check if contract can be analyzed (must be active, completed, or failed)
    if (!['active', 'completed', 'failed'].includes(contract.status)) {
      return {
        status: 'error',
        message: `Cannot analyze contract with status: ${contract.status}`
      }
    }

    // Check if there's already a queued/processing analysis for this contract
    const existingAnalysis = await db
      .select({ id: analyses.id })
      .from(analyses)
      .where(and(
        eq(analyses.contract_id, validatedFields.data.contractId),
        eq(analyses.org_id, orgId),
        eq(analyses.type, validatedFields.data.analysisType),
        // Only check for active analyses
        eq(analyses.status, 'queued') // or processing
      ))
      .limit(1)

    if (existingAnalysis.length > 0) {
      return {
        status: 'error',
        message: 'An analysis is already queued or in progress for this contract'
      }
    }

    // Create analysis record
    const analysisId = nanoid()
    await db.insert(analyses).values({
      id: analysisId,
      org_id: orgId,
      contract_id: validatedFields.data.contractId,
      type: validatedFields.data.analysisType,
      status: 'queued',
      retry_count: 0
    })

    // Update contract status to queued
    await db
      .update(contracts)
      .set({ 
        status: 'queued',
        updated_at: new Date()
      })
      .where(and(
        eq(contracts.id, validatedFields.data.contractId),
        eq(contracts.org_id, orgId)
      ))

    // TODO: Add audit log entry
    // await insertAuditLog('ANALYSIS_QUEUED', analysisId, orgId, {
    //   contractId: validatedFields.data.contractId,
    //   analysisType: validatedFields.data.analysisType
    // })

    return {
      status: 'success',
      message: 'Analysis queued successfully',
      analysisId
    }

  } catch (error) {
    console.error('Failed to enqueue analysis:', error)
    return {
      status: 'error',
      message: 'Failed to queue analysis'
    }
  }
}
