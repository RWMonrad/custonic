# Production Deployment Guide - M6 AI Contract Analysis

## 🚀 Release Gating Checklist

### ✅ Security & Access Control
- [ ] **RLS Verified**: Run `npm run test:rls` against staging
- [ ] **Storage RLS Verified**: Run `npm run test:storage-rls` against staging  
- [ ] **Cross-org isolation tested**: Verify users cannot access other orgs' data
- [ ] **Secrets hygiene**: Service role key ONLY in worker environment

### ✅ Architecture Separation
- [ ] **Web**: Deployed to Vercel (Next.js)
- [ ] **Worker**: Separate runtime (Railway/Fly.io/Render/VM)
- [ ] **Environment separation**: Web has anon keys only, worker has service role

### ✅ Cost Controls & Limits
- [ ] **Hard caps configured**: `AI_MAX_CHUNKS=30`, `AI_MAX_FINDINGS=40`, `AI_MAX_TOKENS=100000`
- [ ] **File size limits**: 10MB maximum per contract
- [ ] **Retry limits**: Maximum 3 attempts per analysis
- [ ] **Rate limiting**: `MAX_ANALYSES_PER_ORG_PER_DAY=10`

### ✅ Observability & Monitoring
- [ ] **Structured logging**: `ENABLE_STRUCTURED_LOGS=true`
- [ ] **Log level set**: `LOG_LEVEL=info` (debug for troubleshooting)
- [ ] **Cost tracking**: Tokens and cost estimation enabled
- [ ] **Error tracking**: Detailed error messages with context
- [ ] **Alerting configured**: Failure rate > 20%, queue age > 30min

---

## 🏗️ Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Users         │    │   Vercel Web    │    │  Supabase DB    │
│                 │───▶│   (Next.js)     │───▶│   (PostgreSQL)  │
│  - Contract UI  │    │                 │    │                 │
│  - Findings     │    │  - Auth only    │    │  - RLS enabled  │
│  - Management   │    │  - No AI keys   │    │  - Isolated     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Worker Runtime │
                       │ (Railway/Fly)   │
                       │                 │
                       │  - AI keys      │
                       │  - Service role │
                       │  - Processing   │
                       └─────────────────┘
```

---

## 🔧 Environment Configuration

### Web Environment (Vercel)
```env
# Public only - no secrets
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional: Server-side AI (if needed)
# OPENAI_API_KEY=your_key (only if web does AI processing)
```

### Worker Environment (Railway/Fly.io)
```env
# Service role access
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

# AI Configuration
AI_PROVIDER=openai
AI_MODEL=gpt-4
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Cost Controls
AI_MAX_CHUNKS=30
AI_MAX_FINDINGS=40
AI_MAX_TOKENS=100000

# Production Controls
ANALYSIS_DISABLED=false
MAX_ANALYSES_PER_ORG_PER_DAY=10
LOG_LEVEL=info
ENABLE_STRUCTURED_LOGS=true

# Observability
FAILURE_RATE_ALERT_THRESHOLD=20
QUEUE_AGE_ALERT_THRESHOLD_MINUTES=30
```

---

## 📋 Step-by-Step Deployment

### Phase 1: Staging Setup
1. **Create staging Supabase project**
2. **Run database migrations**: Apply all schema changes
3. **Setup RLS policies**: Copy from development
4. **Test RLS**: `npm run test:rls` and `npm run test:storage-rls`
5. **Deploy web to Vercel staging branch**
6. **Deploy worker to Railway staging environment**
7. **Test with fixtures**: `npm run test:m6-fixtures`

### Phase 2: Canary Release
1. **Select pilot organization(s)**
2. **Set conservative limits**: `MAX_ANALYSES_PER_ORG_PER_DAY=3`
3. **Enable mock provider fallback**: `AI_PROVIDER=mock` as safety net
4. **Monitor closely**: Check logs, error rates, costs
5. **Gather user feedback**: UI effectiveness, finding quality

### Phase 3: Production Launch
1. **Increase limits gradually**: `MAX_ANALYSES_PER_ORG_PER_DAY=10`
2. **Enable real AI providers**: `AI_PROVIDER=openai`
3. **Setup monitoring alerts**: Failure rate, queue age, costs
4. **Document runbooks**: Error handling, escalation procedures

---

## 🔍 Monitoring & Alerting

### Key Metrics to Monitor
```json
{
  "metrics": {
    "analysis_success_rate": "percentage",
    "average_processing_time": "milliseconds", 
    "daily_token_usage": "count",
    "daily_cost": "USD",
    "queue_length": "count",
    "error_rate_by_type": "percentage"
  }
}
```

### Alert Thresholds
- **Failure rate > 20%**: Investigate immediately
- **Queue age > 30 minutes**: Scale worker or investigate issues
- **Daily cost > $100**: Review usage patterns
- **Error rate by type > 10%**: Check specific error categories

### Log Examples
```json
{
  "timestamp": "2024-03-01T10:00:00Z",
  "level": "info",
  "message": "Analysis completed successfully",
  "service": "analysis-worker",
  "analysisId": "uuid-123",
  "orgId": "uuid-456", 
  "durationMs": 15000,
  "findingsCount": 5,
  "tokensUsed": 2500,
  "costEstimate": 0.025
}
```

---

## 🛡️ Security Considerations

### Data Handling
- **Never log full contract text**: Use hashes and excerpts only
- **PII detection**: Consider implementing PII filtering
- **Data retention**: Define policy for parsed text storage
- **Access logs**: Monitor for unusual access patterns

### Cost Protection
- **Hard token limits**: Prevent runaway costs
- **Daily org limits**: Control per-organization usage
- **Kill switch**: `ANALYSIS_DISABLED=true` for emergencies
- **Backpressure**: Disable enqueue when queue is full

### Compliance
- **GDPR consideration**: Contract data processing
- **Data location**: Supabase region compliance
- **Audit trails**: Analysis lifecycle logging
- **User consent**: Clear communication about AI processing

---

## 🚨 Troubleshooting Guide

### Common Issues
1. **High failure rate**: Check AI provider limits, API keys
2. **Slow processing**: Monitor chunk sizes, token usage
3. **Queue buildup**: Scale worker or check for bottlenecks
4. **Cost spikes**: Review token usage, adjust limits

### Emergency Procedures
1. **Disable analysis**: `ANALYSIS_DISABLED=true`
2. **Switch to mock**: `AI_PROVIDER=mock`
3. **Clear queue**: Manual database intervention
4. **Rollback deployment**: Revert to previous version

---

## 📈 Post-Launch Optimization

### Week 1: Monitor & Stabilize
- Focus on reliability and error handling
- Gather user feedback on UI/UX
- Adjust rate limits based on usage

### Week 2-4: Optimize & Scale  
- Fine-tune AI prompts and parameters
- Implement additional cost controls
- Scale worker infrastructure

### Month 2+: Enhance & Expand
- Add more risk types and analysis features
- Implement advanced monitoring
- Consider additional AI providers

---

## 🎯 Success Criteria

- **99%+ analysis success rate**
- **< 30 second average processing time**
- **<$0.10 average cost per analysis**
- **Zero security incidents**
- **Positive user feedback on finding quality**

---

*This guide should be reviewed and updated based on real-world deployment experience.*
