'use client'

import { useState, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  enqueueAnalysisAction,
  initialEnqueueAnalysisState,
  type EnqueueAnalysisState
} from '@/app/[locale]/(app)/contracts/[contractId]/analysis-actions'
import { ContractList } from '@/modules/contracts/lib/contracts'

function SubmitButton({
  children,
  disabled,
  variant = 'primary'
}: {
  children: React.ReactNode
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}) {
  const { pending } = useFormStatus()

  const baseClasses = 'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-ring',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500'
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

interface ContractAnalysisProps {
  contract: ContractList
}

export function ContractAnalysis({ contract }: ContractAnalysisProps) {
  const router = useRouter()
  const [enqueueState, enqueueFormAction] = useFormState(
    enqueueAnalysisAction,
    initialEnqueueAnalysisState
  )

  // Mock analysis data - in real implementation, this would come from API
  const [analysisStatus, setAnalysisStatus] = useState<{
    status: 'none' | 'queued' | 'processing' | 'completed' | 'failed'
    findings?: {
      low: number
      medium: number
      high: number
      critical: number
    }
    lastUpdated?: Date
  }>({ status: 'none' })

  // Handle enqueue success
  if (enqueueState.status === 'success') {
    setAnalysisStatus({
      status: 'queued',
      lastUpdated: new Date()
    })
    router.refresh()
    enqueueState.status = 'idle'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'queued': return 'Queued for Analysis'
      case 'processing': return 'Analyzing...'
      case 'completed': return 'Analysis Complete'
      case 'failed': return 'Analysis Failed'
      default: return 'No Analysis'
    }
  }

  const canAnalyze = ['active', 'completed', 'failed'].includes(contract.status)
  const isAnalyzing = ['queued', 'processing'].includes(contract.status)

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Contract Analysis</h3>
      
      {/* Current Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            analysisStatus.status === 'processing' ? 'bg-blue-500 animate-pulse' :
            analysisStatus.status === 'completed' ? 'bg-green-500' :
            analysisStatus.status === 'failed' ? 'bg-red-500' :
            analysisStatus.status === 'queued' ? 'bg-yellow-500' :
            'bg-gray-300'
          }`} />
          <div>
            <p className="text-sm font-medium">{getStatusText(analysisStatus.status)}</p>
            {analysisStatus.lastUpdated && (
              <p className="text-xs text-gray-500">
                Updated {analysisStatus.lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Findings Summary (if completed) */}
      {analysisStatus.status === 'completed' && analysisStatus.findings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-3">Risk Findings Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Low: {analysisStatus.findings.low}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>Medium: {analysisStatus.findings.medium}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span>High: {analysisStatus.findings.high}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Critical: {analysisStatus.findings.critical}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {analysisStatus.status === 'none' && canAnalyze && (
          <form action={enqueueFormAction}>
            <input type="hidden" name="contractId" value={contract.id} />
            <input type="hidden" name="analysisType" value="risk_assessment" />
            <SubmitButton>
              Run Analysis
            </SubmitButton>
          </form>
        )}

        {isAnalyzing && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>
              {analysisStatus.status === 'queued' ? 'Waiting in queue...' : 'Processing analysis...'}
            </span>
          </div>
        )}

        {analysisStatus.status === 'failed' && (
          <div>
            <p className="text-sm text-red-600 mb-3">Analysis failed. Please try again.</p>
            <form action={enqueueFormAction}>
              <input type="hidden" name="contractId" value={contract.id} />
              <input type="hidden" name="analysisType" value="risk_assessment" />
              <SubmitButton variant="secondary">
                Retry Analysis
              </SubmitButton>
            </form>
          </div>
        )}
      </div>

      {/* Error messages */}
      {enqueueState.status === 'error' && (
        <p className="mt-3 text-sm text-red-600">{enqueueState.message}</p>
      )}

      {/* Info text */}
      <div className="mt-6 text-xs text-gray-500">
        <p>Analysis automatically identifies potential risks and compliance issues in your contracts.</p>
        <p>Typical processing time: 1-2 minutes.</p>
      </div>
    </div>
  )
}
