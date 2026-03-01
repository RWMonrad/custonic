'use client'

import { useState } from 'react'
import { FindingCard } from './FindingCard'

interface Finding {
  id: string
  title: string
  description: string
  severity: string
  category: string
  confidenceScore: number
  recommendation: string
  citations: Array<{
    excerpt: string
    chunkIndex: number
    startHint?: string
    endHint?: string
  }>
  createdAt: Date
}

interface FindingsListProps {
  findings: Finding[]
}

export function FindingsList({ findings }: FindingsListProps) {
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set())

  const toggleExpanded = (findingId: string) => {
    const newExpanded = new Set(expandedFindings)
    if (newExpanded.has(findingId)) {
      newExpanded.delete(findingId)
    } else {
      newExpanded.add(findingId)
    }
    setExpandedFindings(newExpanded)
  }

  if (findings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No findings match your current filters.</p>
        <p className="text-xs mt-1">Try adjusting your filter criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Findings ({findings.length})
        </h4>
        <div className="text-xs text-gray-500">
          Ordered by severity and confidence
        </div>
      </div>

      {findings.map((finding) => (
        <FindingCard
          key={finding.id}
          finding={finding}
          isExpanded={expandedFindings.has(finding.id)}
          onToggleExpanded={() => toggleExpanded(finding.id)}
        />
      ))}
    </div>
  )
}
