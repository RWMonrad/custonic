'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getContractById, renameContract, softDeleteContract } from '@/modules/contracts/lib/contracts'
import { getCurrentOrgIdOrThrow } from '@/modules/auth/lib/current-org'

const getSignedUrlSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID')
})

const renameContractSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  title: z.string().min(2, 'Title must be at least 2 characters').max(120, 'Title too long')
})

const softDeleteSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID')
})

export type SignedUrlState = {
  status: 'idle' | 'error' | 'success'
  url?: string
  message?: string
}

export const initialSignedUrlState: SignedUrlState = { status: 'idle' }

export async function getSignedDownloadUrlAction(
  prevState: SignedUrlState,
  formData: FormData
): Promise<SignedUrlState> {
  const contractId = formData.get('contractId') as string

  const validatedFields = getSignedUrlSchema.safeParse({ contractId })
  
  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.issues[0]?.message || 'Invalid input'
    }
  }

  try {
    // Get current org and contract
    const orgId = await getCurrentOrgIdOrThrow()
    const contract = await getContractById(validatedFields.data.contractId)

    if (!contract) {
      return {
        status: 'error',
        message: 'Contract not found'
      }
    }

    // Validate file path format
    if (!contract.file_url) {
      return {
        status: 'error',
        message: 'No file associated with this contract'
      }
    }

    const expectedPathPrefix = `${orgId}/${validatedFields.data.contractId}/`
    if (!contract.file_url.startsWith(expectedPathPrefix)) {
      return {
        status: 'error',
        message: 'Invalid file path'
      }
    }

    // Create signed URL using user session (cookie-based)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.storage
      .from('contracts')
      .createSignedUrl(contract.file_url, 60) // 60 seconds TTL

    if (error) {
      return {
        status: 'error',
        message: `Failed to generate download URL: ${error.message}`
      }
    }

    // TODO: Add audit log if audit_log table exists
    // await insertAuditLog('CONTRACT_DOWNLOADED', validatedFields.data.contractId, orgId)

    return {
      status: 'success',
      url: data.signedUrl
    }

  } catch (error) {
    console.error('Failed to get signed download URL:', error)
    return {
      status: 'error',
      message: 'Failed to generate download URL'
    }
  }
}

export type RenameState = {
  status: 'idle' | 'error' | 'success'
  message?: string
}

export const initialRenameState: RenameState = { status: 'idle' }

export async function renameContractAction(
  prevState: RenameState,
  formData: FormData
): Promise<RenameState> {
  const contractId = formData.get('contractId') as string
  const title = formData.get('title') as string

  const validatedFields = renameContractSchema.safeParse({ contractId, title })
  
  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.issues[0]?.message || 'Invalid input'
    }
  }

  try {
    const orgId = await getCurrentOrgIdOrThrow()
    
    await renameContract({
      orgId,
      contractId: validatedFields.data.contractId,
      title: validatedFields.data.title
    })

    // TODO: Add audit log if audit_log table exists
    // await insertAuditLog('CONTRACT_RENAMED', validatedFields.data.contractId, orgId, { newTitle: validatedFields.data.title })

    return {
      status: 'success',
      message: 'Contract renamed successfully'
    }

  } catch (error) {
    console.error('Failed to rename contract:', error)
    return {
      status: 'error',
      message: 'Failed to rename contract'
    }
  }
}

export type DeleteState = {
  status: 'idle' | 'error' | 'success'
  message?: string
}

export const initialDeleteState: DeleteState = { status: 'idle' }

export async function softDeleteContractAction(
  prevState: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  const contractId = formData.get('contractId') as string

  const validatedFields = softDeleteSchema.safeParse({ contractId })
  
  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.issues[0]?.message || 'Invalid input'
    }
  }

  try {
    const orgId = await getCurrentOrgIdOrThrow()
    
    await softDeleteContract({
      orgId,
      contractId: validatedFields.data.contractId
    })

    // TODO: Add audit log if audit_log table exists
    // await insertAuditLog('CONTRACT_SOFT_DELETED', validatedFields.data.contractId, orgId)

    return {
      status: 'success',
      message: 'Contract deleted successfully'
    }

  } catch (error) {
    console.error('Failed to delete contract:', error)
    return {
      status: 'error',
      message: 'Failed to delete contract'
    }
  }
}
