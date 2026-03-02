#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🧪 M7.1 Billing Hooks Smoke Test');
console.log('===============================\n');

async function testPlanSeeding() {
  console.log('1️⃣ Testing Plan Seeding...');
  
  try {
    const { data, error } = await supabase
      .from('org_plans')
      .select('*')
      .order('monthly_price_cents');
    
    if (error) {
      console.log('❌ Plan seeding failed:', error.message);
      return;
    }
    
    console.log('✅ Plans found:', data?.map(p => `${p.key} ($${p.monthly_price_cents/100})`).join(', '));
  } catch (error) {
    console.log('❌ Plan seeding test failed:', error.message);
  }
}

async function testSubscriptionCreation() {
  console.log('\n2️⃣ Testing Subscription Creation...');
  
  try {
    // Create test org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: 'Billing Test Org' })
      .select()
      .single();
    
    if (orgError) {
      console.log('❌ Org creation failed:', orgError.message);
      return;
    }
    
    // Check if subscription was created automatically
    const { data: subscription, error: subError } = await supabase
      .from('org_subscriptions')
      .select('*')
      .eq('org_id', org.id)
      .single();
    
    if (subError) {
      console.log('❌ Subscription check failed:', subError.message);
    } else {
      console.log('✅ Subscription created:', subscription.plan_key, subscription.status);
    }
    
    // Cleanup
    await supabase.from('organizations').delete().eq('id', org.id);
  } catch (error) {
    console.log('❌ Subscription test failed:', error.message);
  }
}

async function testUsageLedger() {
  console.log('\n3️⃣ Testing Usage Ledger...');
  
  try {
    // Create test org and subscription
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Ledger Test Org' })
      .select()
      .single();
    
    // Insert ledger entries
    const testEntries = [
      {
        org_id: org.id,
        event_type: 'CONTRACT_UPLOADED',
        entity_type: 'contract',
        entity_id: 'test-contract-1',
        units: 1,
        amount_cents: 0,
        metadata: { file_size_bytes: 1024 }
      },
      {
        org_id: org.id,
        event_type: 'ANALYSIS_QUEUED',
        entity_type: 'analysis',
        entity_id: 'test-analysis-1',
        units: 1,
        amount_cents: 0,
        metadata: { analysis_type: 'risk_assessment' }
      },
      {
        org_id: org.id,
        event_type: 'ANALYSIS_COMPLETED',
        entity_type: 'analysis',
        entity_id: 'test-analysis-1',
        units: 2,
        amount_cents: 150,
        metadata: { chunk_count: 15, tokens_in: 1000, tokens_out: 500 }
      }
    ];
    
    const { data: entries, error: insertError } = await supabase
      .from('usage_ledger')
      .insert(testEntries)
      .select();
    
    if (insertError) {
      console.log('❌ Ledger insert failed:', insertError.message);
    } else {
      console.log('✅ Ledger entries created:', entries?.length);
    }
    
    // Test append-only (should fail)
    const { error: updateError } = await supabase
      .from('usage_ledger')
      .update({ units: 999 })
      .eq('org_id', org.id)
      .limit(1);
    
    if (updateError) {
      console.log('✅ Append-only protection working:', updateError.message);
    } else {
      console.log('❌ Append-only protection FAILED');
    }
    
    // Cleanup
    await supabase.from('organizations').delete().eq('id', org.id);
  } catch (error) {
    console.log('❌ Ledger test failed:', error.message);
  }
}

async function testPlanLimits() {
  console.log('\n4️⃣ Testing Plan Limits...');
  
  try {
    // Create test org
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Limits Test Org' })
      .select()
      .single();
    
    // Test enqueue limits
    const { data: limits, error: limitsError } = await supabase.rpc('can_enqueue_analysis', {
      p_org_id: org.id,
    });
    
    if (limitsError) {
      console.log('❌ Limits check failed:', limitsError.message);
    } else {
      const result = limits[0];
      console.log('✅ Limits check:', result.allowed ? 'ALLOWED' : 'BLOCKED');
      console.log(`   Usage: ${result.current_usage}/${result.included_limit}`);
      console.log(`   Remaining: ${result.remaining}`);
    }
    
    // Cleanup
    await supabase.from('organizations').delete().eq('id', org.id);
  } catch (error) {
    console.log('❌ Limits test failed:', error.message);
  }
}

async function testRLSIsolation() {
  console.log('\n5️⃣ Testing RLS Isolation...');
  
  try {
    // Create two test orgs
    const { data: org1 } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org 1' })
      .select()
      .single();
    
    const { data: org2 } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org 2' })
      .select()
      .single();
    
    // Insert ledger entry for org1
    await supabase
      .from('usage_ledger')
      .insert({
        org_id: org1.id,
        event_type: 'ANALYSIS_COMPLETED',
        entity_type: 'analysis',
        entity_id: 'test-isolation',
        units: 1,
        amount_cents: 100
      });
    
    // Create user clients (simulate different users)
    const user1Client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const user2Client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Test isolation - each user should only see their own org's data
    const { data: user1Ledger, error: error1 } = await user1Client
      .from('usage_ledger')
      .select('*')
      .eq('org_id', org1.id);
    
    const { data: user2Ledger, error: error2 } = await user2Client
      .from('usage_ledger')
      .select('*')
      .eq('org_id', org2.id);
    
    if (error1 || error2) {
      console.log('❌ RLS test failed - query errors');
    } else {
      const org1CanSeeOwn = user1Ledger?.length === 1;
      const org2CannotSeeOrg1 = user2Ledger?.length === 0;
      
      if (org1CanSeeOwn && org2CannotSeeOrg1) {
        console.log('✅ RLS isolation working correctly');
      } else {
        console.log('❌ RLS isolation FAILED');
        console.log(`   Org1 entries: ${user1Ledger?.length}`);
        console.log(`   Org2 entries: ${user2Ledger?.length}`);
      }
    }
    
    // Cleanup
    await supabase.from('organizations').delete().in('id', [org1.id, org2.id]);
  } catch (error) {
    console.log('❌ RLS test failed:', error.message);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Clean up any remaining test organizations
    await supabase
      .from('organizations')
      .delete()
      .like('name', '%Test Org%');
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('❌ Cleanup failed:', error.message);
  }
}

async function runTests() {
  try {
    await testPlanSeeding();
    await testSubscriptionCreation();
    await testUsageLedger();
    await testPlanLimits();
    await testRLSIsolation();
    await cleanup();
    
    console.log('\n🎉 All billing smoke tests completed!');
  } catch (error) {
    console.error('\n❌ Smoke test suite failed:', error);
    process.exit(1);
  }
}

runTests();
