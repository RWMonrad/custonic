// M5 Analysis Worker
// Processes queued analysis jobs without AI (simulation)

import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase service role configuration')
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Service role client for worker (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Simulated analysis findings generator
function generateDummyFindings(analysisId, orgId, contractId) {
  const severities = ['low', 'medium', 'high', 'critical']
  const categories = ['legal', 'financial', 'operational', 'compliance', 'reputational']
  
  const findings = []
  const numFindings = Math.floor(Math.random() * 4) + 2 // 2-5 findings
  
  for (let i = 0; i < numFindings; i++) {
    const severity = severities[Math.floor(Math.random() * severities.length)]
    const category = categories[Math.floor(Math.random() * categories.length)]
    
    findings.push({
      id: crypto.randomUUID(),
      org_id: orgId,
      contract_id: contractId,
      analysis_id: analysisId,
      title: `Risk Finding ${i + 1}`,
      description: `This is a simulated ${severity} risk in the ${category} category that was identified during analysis.`,
      severity,
      category,
      confidence_score: Math.floor(Math.random() * 30) + 70, // 70-100
      recommendation: `Recommend addressing this ${severity} risk through appropriate measures.`,
      is_resolved: false
    })
  }
  
  return findings
}

// Process a single analysis job
async function processAnalysisJob(analysis) {
  console.log(`🔄 Processing analysis ${analysis.analysis_id} for contract ${analysis.contract_id}`)
  
  const startTime = Date.now()
  
  try {
    // Simulate analysis work (1-2 seconds)
    const processingTime = Math.floor(Math.random() * 1000) + 1000
    await new Promise(resolve => setTimeout(resolve, processingTime))
    
    // Generate dummy findings
    const findings = generateDummyFindings(
      analysis.analysis_id,
      analysis.org_id,
      analysis.contract_id
    )
    
    // Insert risk findings
    const { error: findingsError } = await supabase
      .from('risk_findings')
      .insert(findings)
    
    if (findingsError) {
      throw new Error(`Failed to insert findings: ${findingsError.message}`)
    }
    
    // Mark analysis as completed
    const processingTimeMs = Date.now() - startTime
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        processing_time_ms: processingTimeMs,
        confidence_score: Math.floor(Math.random() * 30) + 70, // 70-100
        results: JSON.stringify({
          findingsCount: findings.length,
          severityBreakdown: findings.reduce((acc, f) => {
            acc[f.severity] = (acc[f.severity] || 0) + 1
            return acc
          }, {}),
          processingTimeMs
        }),
        updated_at: new Date().toISOString()
      })
      .eq('id', analysis.analysis_id)
    
    if (updateError) {
      throw new Error(`Failed to update analysis: ${updateError.message}`)
    }
    
    // Update contract status to completed
    const { error: contractError } = await supabase
      .from('contracts')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', analysis.contract_id)
    
    if (contractError) {
      throw new Error(`Failed to update contract: ${contractError.message}`)
    }
    
    // TODO: Add audit log entries
    // await insertAuditLog('ANALYSIS_STARTED', analysis.analysis_id, analysis.org_id)
    // await insertAuditLog('ANALYSIS_COMPLETED', analysis.analysis_id, analysis.org_id)
    
    console.log(`✅ Analysis ${analysis.analysis_id} completed successfully`)
    console.log(`   📊 Generated ${findings.length} risk findings`)
    console.log(`   ⏱️  Processing time: ${processingTimeMs}ms`)
    
  } catch (error) {
    console.error(`❌ Analysis ${analysis.analysis_id} failed:`, error.message)
    
    // Mark analysis as failed
    await supabase
      .from('analyses')
      .update({
        status: 'failed',
        error_message: error.message,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', analysis.analysis_id)
    
    // Update contract status to failed
    await supabase
      .from('contracts')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', analysis.contract_id)
    
    // TODO: Add audit log entry
    // await insertAuditLog('ANALYSIS_FAILED', analysis.analysis_id, analysis.org_id, { error: error.message })
  }
}

// Main worker loop
async function workerLoop() {
  console.log('🚀 Analysis Worker Starting...')
  console.log('🔄 Polling for queued analysis jobs...')
  
  while (true) {
    try {
      // Claim next available job using RPC
      const { data: claimedJob, error: claimError } = await supabase
        .rpc('claim_next_analysis_job')
      
      if (claimError) {
        console.error('❌ Failed to claim job:', claimError.message)
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5s on error
        continue
      }
      
      if (claimedJob && claimedJob.length > 0) {
        const job = claimedJob[0]
        console.log(`📋 Claimed job: ${job.analysis_id} (${job.analysis_type})`)
        
        // Process the job
        await processAnalysisJob(job)
        
        // Small delay between jobs
        await new Promise(resolve => setTimeout(resolve, 1000))
      } else {
        // No jobs available, wait before polling again
        await new Promise(resolve => setTimeout(resolve, 3000)) // 3s poll interval
      }
      
    } catch (error) {
      console.error('❌ Worker error:', error.message)
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5s on error
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Analysis Worker shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Analysis Worker shutting down gracefully...')
  process.exit(0)
})

// Start worker
workerLoop().catch((error) => {
  console.error('❌ Worker failed to start:', error)
  process.exit(1)
})
