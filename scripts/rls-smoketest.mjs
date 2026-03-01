import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');

function sb() {
  return createClient(url, anon, { auth: { persistSession: false } });
}

async function signIn(email, password) {
  const s = sb();
  const { data, error } = await s.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // return an authed client
  return createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } }
  });
}

async function main() {
  // Create two real users in Supabase Auth (manual or via your app):
  const aliceEmail = process.env.TEST_ALICE_EMAIL;
  const alicePass = process.env.TEST_ALICE_PASS;
  const bobEmail = process.env.TEST_BOB_EMAIL;
  const bobPass = process.env.TEST_BOB_PASS;

  if (!aliceEmail || !alicePass || !bobEmail || !bobPass) {
    throw new Error('Set TEST_ALICE_EMAIL/TEST_ALICE_PASS/TEST_BOB_EMAIL/TEST_BOB_PASS in .env.local');
  }

  console.log('🔐 Signing in Alice and Bob...');
  const alice = await signIn(aliceEmail, alicePass);
  const bob = await signIn(bobEmail, bobPass);

  // Alice creates org via RPC
  console.log('🏢 Alice creating org via RPC...');
  const { data: aliceOrgId, error: aliceOrgErr } = await alice.rpc('create_org_and_make_owner', { org_name: 'Alice Org' });
  if (aliceOrgErr) throw aliceOrgErr;
  console.log('✅ Alice org created:', aliceOrgId);

  // Bob creates org via RPC
  console.log('🏢 Bob creating org via RPC...');
  const { data: bobOrgId, error: bobOrgErr } = await bob.rpc('create_org_and_make_owner', { org_name: 'Bob Org' });
  if (bobOrgErr) throw bobOrgErr;
  console.log('✅ Bob org created:', bobOrgId);

  // NEGATIVE: Alice should NOT see Bob's org when filtering by Bob's id
  console.log('🔍 TESTING: Alice trying to see Bob org...');
  const { data: shouldBeEmpty, error: selErr } = await alice
    .from('organizations')
    .select('id,name')
    .eq('id', bobOrgId);

  console.log('📊 Alice select Bob org =>', shouldBeEmpty);
  if (selErr) console.log('⚠️ Select error (ok if RLS denies):', selErr.message);

  // NEGATIVE: Alice tries to insert member row into Bob org (should fail)
  console.log('🚫 TESTING: Alice trying to insert membership into Bob org...');
  const aliceUser = (await alice.auth.getUser()).data.user;
  const { error: insertErr } = await alice
    .from('org_members')
    .insert({ org_id: bobOrgId, user_id: aliceUser.id, role: 'member' });

  console.log('📊 Alice insert membership into Bob org =>', insertErr?.message ?? '❌ UNEXPECTED: succeeded');

  // POSITIVE: Alice can read her org
  console.log('✅ TESTING: Alice reading her own org...');
  const { data: aliceOrg, error: aliceOrgSelErr } = await alice
    .from('organizations')
    .select('id,name')
    .eq('id', aliceOrgId);

  console.log('📊 Alice select Alice org =>', aliceOrg);
  if (aliceOrgSelErr) throw aliceOrgSelErr;

  // POSITIVE: Bob can read his org
  console.log('✅ TESTING: Bob reading his own org...');
  const { data: bobOrg, error: bobOrgSelErr } = await bob
    .from('organizations')
    .select('id,name')
    .eq('id', bobOrgId);

  console.log('📊 Bob select Bob org =>', bobOrg);
  if (bobOrgSelErr) throw bobOrgSelErr;

  // NEGATIVE: Bob tries to update Alice's org (should fail)
  console.log('🚫 TESTING: Bob trying to update Alice org...');
  const { error: updateErr } = await bob
    .from('organizations')
    .update({ name: 'Hacked by Bob' })
    .eq('id', aliceOrgId);

  console.log('📊 Bob update Alice org =>', updateErr?.message ?? '❌ UNEXPECTED: succeeded');

  console.log('\n✅ RLS smoke test completed successfully!');
  console.log('\n📋 Expected Results:');
  console.log('- Alice select Bob org: [] (empty) or permission denied');
  console.log('- Alice insert into Bob org: Should fail with policy error');
  console.log('- Alice/Bob select own org: Should work');
  console.log('- Bob update Alice org: Should fail with policy error');
}

main().catch((e) => {
  console.error('❌ RLS smoke test failed:', e);
  process.exit(1);
});
