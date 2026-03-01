'use client'

import { useState, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  getSignedDownloadUrlAction,
  initialSignedUrlState,
  renameContractAction,
  initialRenameState,
  softDeleteContractAction,
  initialDeleteState,
  type SignedUrlState,
  type RenameState,
  type DeleteState
} from '@/app/[locale]/(app)/contracts/[contractId]/actions'
import { ContractList } from '@/modules/contracts/lib/contracts'

function SubmitButton({
  children,
  disabled,
  variant = 'primary'
}: {
  children: React.ReactNode
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const { pending } = useFormStatus()

  const baseClasses = 'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-ring',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  }

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  )
}

interface ContractDetailActionsProps {
  contract: ContractList
}

export function ContractDetailActions({ contract }: ContractDetailActionsProps) {
  const router = useRouter()
  const [downloadState, downloadFormAction] = useFormState(
    getSignedDownloadUrlAction,
    initialSignedUrlState
  )
  const [renameState, renameFormAction] = useFormState(
    renameContractAction,
    initialRenameState
  )
  const [deleteState, deleteFormAction] = useFormState(
    softDeleteContractAction,
    initialDeleteState
  )

  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState(contract.title)
  const renameFormRef = useRef<HTMLFormElement>(null)

  // Handle download success
  if (downloadState.status === 'success' && downloadState.url) {
    window.location.href = downloadState.url
    // Reset state after triggering download
    downloadState.status = 'idle'
    downloadState.url = undefined
  }

  // Handle rename success
  if (renameState.status === 'success') {
    setIsRenaming(false)
    setNewTitle(renameState.message || '')
    router.refresh()
    renameState.status = 'idle'
  }

  // Handle delete success
  if (deleteState.status === 'success') {
    router.push('/contracts')
    router.refresh()
  }

  const handleRenameSubmit = (formData: FormData) => {
    formData.append('contractId', contract.id)
    formData.append('title', newTitle)
    return renameFormAction(formData)
  }

  const handleDeleteSubmit = (formData: FormData) => {
    if (confirm('Are you sure you want to delete this contract? This can be undone.')) {
      formData.append('contractId', contract.id)
      return deleteFormAction(formData)
    }
    return Promise.resolve()
  }

  return (
    <div className="space-y-6">
      {/* Download */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Actions</h3>
        
        <form action={downloadFormAction}>
          <input type="hidden" name="contractId" value={contract.id} />
          <SubmitButton disabled={!contract.file_url}>
            Download Contract
          </SubmitButton>
        </form>

        {downloadState.status === 'error' && (
          <p className="mt-2 text-sm text-red-600">{downloadState.message}</p>
        )}
      </div>

      {/* Rename */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Rename Contract</h3>
        
        {!isRenaming ? (
          <div>
            <p className="text-sm text-gray-600 mb-3">{contract.title}</p>
            <button
              type="button"
              onClick={() => setIsRenaming(true)}
              className="text-sm text-primary hover:text-primary/80"
            >
              Rename
            </button>
          </div>
        ) : (
          <form ref={renameFormRef} action={handleRenameSubmit}>
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={120}
                autoFocus
              />
              <div className="flex space-x-2">
                <SubmitButton disabled={newTitle.trim().length < 2}>
                  Save
                </SubmitButton>
                <button
                  type="button"
                  onClick={() => {
                    setIsRenaming(false)
                    setNewTitle(contract.title)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            {renameState.status === 'error' && (
              <p className="mt-2 text-sm text-red-600">{renameState.message}</p>
            )}
          </form>
        )}
      </div>

      {/* Delete */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
        
        <form action={handleDeleteSubmit}>
          <SubmitButton variant="danger">
            Delete Contract
          </SubmitButton>
        </form>

        {deleteState.status === 'error' && (
          <p className="mt-2 text-sm text-red-600">{deleteState.message}</p>
        )}
        
        <p className="mt-2 text-xs text-gray-500">
          This will soft delete the contract. It can be restored later.
        </p>
      </div>
    </div>
  )
}
