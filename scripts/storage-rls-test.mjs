import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon)
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );

async function signIn(email, password) {
  const supabase = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  return createClient(url, anon, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    },
  });
}

async function main() {
  const aliceEmail = process.env.TEST_ALICE_EMAIL;
  const alicePass = process.env.TEST_ALICE_PASS;
  const bobEmail = process.env.TEST_BOB_EMAIL;
  const bobPass = process.env.TEST_BOB_PASS;

  if (!aliceEmail || !alicePass || !bobEmail || !bobPass) {
    throw new Error(
      "Set TEST_ALICE_EMAIL/TEST_ALICE_PASS/TEST_BOB_EMAIL/TEST_BOB_PASS in .env.local",
    );
  }

  console.log("🔐 Signing in Alice and Bob...");
  const alice = await signIn(aliceEmail, alicePass);
  const bob = await signIn(bobEmail, bobPass);

  // Alice creates org
  const { data: aliceOrgId } = await alice.rpc("create_org_and_make_owner", {
    org_name: "Alice Storage Test",
  });
  console.log("✅ Alice org created:", aliceOrgId);

  // Alice uploads a test file
  const testPath = `contracts/${aliceOrgId}/test-contract/test.txt`;
  const testFile = new Blob(["test content"], { type: "text/plain" });

  console.log("📁 Alice uploading INVALID file (wrong MIME type)...");
  const { error: uploadError } = await alice.storage
    .from("contracts")
    .upload(testPath, testFile);

  if (uploadError) {
    console.log(
      "⚠️ Upload failed (expected due to MIME type restriction):",
      uploadError.message,
    );
  } else {
    console.log("❌ UNEXPECTED: Upload succeeded with invalid MIME type");
    // Clean up if it somehow succeeded
    await alice.storage.from("contracts").remove([testPath]);
  }

  // Alice uploads a VALID PDF file
  const validPath = `contracts/${aliceOrgId}/test-contract/valid.pdf`;
  const validFile = new Blob(["%PDF-1.4 fake content"], {
    type: "application/pdf",
  });

  console.log("📁 Alice uploading VALID PDF file...");
  const { error: validUploadError } = await alice.storage
    .from("contracts")
    .upload(validPath, validFile);

  if (validUploadError) {
    console.log("⚠️ Valid upload failed:", validUploadError.message);
  } else {
    console.log("✅ Alice uploaded valid PDF successfully");
  }

  // NEGATIVE: Alice tries to upload to wrong org path (path parsing test)
  const wrongOrgPath = `contracts/00000000-0000-0000-0000-000000000000/wrong-org/test.pdf`;
  const wrongOrgFile = new Blob(["%PDF-1.4 fake content"], {
    type: "application/pdf",
  });

  console.log("🔍 TESTING: Alice uploading to wrong org path...");
  const { error: wrongOrgError } = await alice.storage
    .from("contracts")
    .upload(wrongOrgPath, wrongOrgFile);

  if (wrongOrgError) {
    console.log(
      "⚠️ Wrong org path upload blocked (expected):",
      wrongOrgError.message,
    );
  } else {
    console.log("❌ UNEXPECTED: Upload to wrong org path succeeded");
    // Clean up if it somehow succeeded
    await alice.storage.from("contracts").remove([wrongOrgPath]);
  }

  // NEGATIVE: Bob tries to list Alice's files
  console.log("🔍 TESTING: Bob trying to list Alice files...");
  const { data: bobList, error: bobListError } = await bob.storage
    .from("contracts")
    .list(`${aliceOrgId}/`, { limit: 10 });

  console.log("📊 Bob list Alice files =>", bobList?.length || 0, "files");
  if (bobListError) {
    console.log("⚠️ Bob list error (expected):", bobListError.message);
  }

  // NEGATIVE: Bob tries to download Alice's file
  console.log("🔍 TESTING: Bob trying to download Alice file...");
  const { data: bobDownload, error: bobDownloadError } = await bob.storage
    .from("contracts")
    .download(testPath);

  console.log(
    "📊 Bob download Alice file =>",
    bobDownload ? "SUCCESS (unexpected!)" : "BLOCKED",
  );
  if (bobDownloadError) {
    console.log("⚠️ Bob download error (expected):", bobDownloadError.message);
  }

  // POSITIVE: Alice can list her own files
  console.log("✅ TESTING: Alice listing her own files...");
  const { data: aliceList, error: aliceListError } = await alice.storage
    .from("contracts")
    .list(`${aliceOrgId}/`, { limit: 10 });

  console.log("📊 Alice list own files =>", aliceList?.length || 0, "files");
  if (aliceListError) {
    console.log("❌ Alice list error (unexpected):", aliceListError.message);
  }

  console.log("\n✅ Storage RLS test completed!");
  console.log("\n📋 Expected Results:");
  console.log("- Alice upload invalid MIME type: BLOCKED by storage policy");
  console.log("- Alice upload valid PDF: SUCCESS");
  console.log("- Alice upload to wrong org path: BLOCKED by path parsing");
  console.log("- Bob list Alice files: 0 files or permission denied");
  console.log("- Bob download Alice file: BLOCKED");
  console.log("- Alice list own files: Should work");
}

main().catch((e) => {
  console.error("❌ Storage RLS test failed:", e);
  process.exit(1);
});
