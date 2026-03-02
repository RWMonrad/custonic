# Billing Model - USD=1 Contract

## 🎯 Core Concept

Custonic uses a simplified **USD=1 billing contract** for maximum clarity and operational simplicity.

### Key Definitions

**"Unit" = 1 per ANALYSIS_COMPLETED**
- Each completed analysis counts as exactly 1 unit
- No complex calculations based on chunks, tokens, or file size
- Simple counting: "X analyses completed this month"

**"Charge" (Revenue) = Monthly Plan Price**
- Revenue comes from fixed monthly subscriptions, not per-analysis billing
- `amount_cents` in ledger is for cost estimates only, not customer charges
- Plans: Free ($0), Pro ($29), Business ($99)

---

## 📊 Billing Architecture

### Ledger Events (usage_ledger table)

| Event Type | Units | Amount | Description |
|------------|-------|--------|-------------|
| CONTRACT_UPLOADED | 0 | $0.00 | Contract uploaded (tracked only) |
| ANALYSIS_QUEUED | 0 | $0.00 | Analysis added to queue |
| ANALYSIS_COMPLETED | 1 | $0.00 | **Revenue event: 1 unit counted** |
| ANALYSIS_FAILED | 0 | $0.00 | Analysis failed (no unit) |
| SIGNED_DOWNLOAD | 0 | $0.00 | Secure download (tracked only) |

### Currency & Amounts

- **currency**: Always "USD" (fixed)
- **units**: 1 per completed analysis
- **amount_cents**: Cost estimates for internal reporting (not customer billing)
- **Revenue**: Fixed monthly plan prices

---

## 💰 Revenue Model

### Plan-Based Revenue

| Plan | Monthly Price | Included Analyses | Revenue Source |
|------|---------------|-------------------|----------------|
| Free | $0 | 10 | None (free tier) |
| Pro | $29 | 200 | Monthly subscription |
| Business | $99 | 1000 | Monthly subscription |

### Enforcement Logic

**Monthly Quota**: Count `ANALYSIS_COMPLETED` events in current billing period
- **Limit Check**: `current_usage <= included_analyses`
- **Over Limit**: Block enqueue with "Upgrade required" message
- **Period Reset**: Monthly based on `current_period_start/end`

---

## 🔧 Technical Implementation

### Database Schema

```sql
-- Plans (fixed pricing)
org_plans:
  - monthly_price_cents (revenue per month)
  - included_analyses (units allowed)

-- Subscriptions (customer status)
org_subscriptions:
  - plan_key (current plan)
  - status (active/past_due/canceled)
  - current_period_start/end
  - stripe_* (future integration)

-- Usage Ledger (immutable audit trail)
usage_ledger:
  - event_type (ANALYSIS_COMPLETED = 1 unit)
  - units (1 for completion, 0 for others)
  - amount_cents (cost estimates only)
  - currency (always "USD")
```

### Enforcement Flow

1. **Enqueue Analysis** → Check plan limits
2. **Complete Analysis** → Record `ANALYSIS_COMPLETED` (1 unit)
3. **Count Usage** → Sum units in current period
4. **Enforce Limits** → Block if over included_analyses

---

## 🚀 Future Stripe Integration

### Stripe-Ready Fields

```sql
-- Added to org_subscriptions
stripe_customer_id TEXT
stripe_subscription_id TEXT  
stripe_price_id TEXT
```

### Activation Steps

1. **Set STRIPE_ENABLED=true** in environment
2. **Configure Stripe prices** for free/pro/business
3. **Update org_plans.stripe_price_id** with Stripe price IDs
4. **Deploy webhook handler** (already ready)
5. **Test checkout flow** → Verify subscription updates

### Webhook Events Handled

- `customer.subscription.*` → Update org_subscriptions
- `invoice.paid` → Set status to 'active'
- `invoice.payment_failed` → Set status to 'past_due'

---

## 📈 Reporting & Exports

### Usage Metrics

- **Analyses Completed**: Count of `ANALYSIS_COMPLETED` events
- **Contracts Uploaded**: Count of `CONTRACT_UPLOADED` events  
- **Current Usage**: Units used in billing period
- **Remaining**: `included_analyses - current_usage`

### CSV Export Format

```csv
Date,Event Type,Entity Type,Entity ID,Units,Amount (USD),Metadata
2024-03-01,ANALYSIS_COMPLETED,analysis,abc123,1,0.00,"{""provider"":""openai""}"
```

### Invoice-Ready Data

- **Period Usage**: Simple analysis counts
- **Plan Revenue**: Fixed monthly amounts
- **Customer ID**: org_id for invoicing
- **Audit Trail**: Complete immutable ledger

---

## 🎯 Benefits of USD=1 Model

### Simplicity
- **No Complex Calculations**: 1 unit = 1 completed analysis
- **Clear Messaging**: "X of Y analyses used this month"
- **Easy Support**: No confusion about billing units

### Predictable Revenue
- **Fixed Monthly Pricing**: No per-analysis revenue variability
- **Simple Forecasting**: X customers × plan price = monthly revenue
- **Clear Upgrade Path**: Over limit → upgrade plan

### Operational Safety
- **Append-only Ledger**: Immutable audit trail
- **Server-side Enforcement**: No client-side billing logic
- **Graceful Degradation**: Clear limits and messaging

---

## 📝 Key Takeaways

1. **Unit = 1 per completed analysis** - Never changes
2. **Revenue = Fixed monthly plans** - Not per-analysis billing  
3. **amount_cents = Cost estimates** - Internal use only
4. **Enforcement = Simple counting** - Sum units in period
5. **Stripe = Future enhancement** - Ready when needed

This model ensures maximum clarity for customers, simple operations for the team, and reliable revenue forecasting for the business.
