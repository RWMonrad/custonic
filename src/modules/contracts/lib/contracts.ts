import { getCurrentOrgIdOrThrow } from "@/modules/auth/lib/current-org";
import { db } from "@/shared/db";
import { contracts } from "@/shared/db/schema";
import { createClient } from "@supabase/supabase-js";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface ContractDraftResult {
  contractId: string;
  orgId: string;
  uploadPath: string;
}

export async function createContractDraft({
  title,
}: {
  title: string;
}): Promise<ContractDraftResult> {
  const orgId = await getCurrentOrgIdOrThrow();
  const contractId = nanoid();

  // Generate storage path: contracts/{orgId}/{contractId}/{title}
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uploadPath = `contracts/${orgId}/${contractId}/${sanitizedTitle}`;

  // Create contract record in draft status
  await db.insert(contracts).values({
    org_id: orgId,
    title,
    counterparty: "Pending", // Required field, will be updated later
    status: "draft",
    file_url: uploadPath,
    // We'll update other fields after successful upload
  });

  return {
    contractId,
    orgId,
    uploadPath,
  };
}

export interface ContractList {
  id: string;
  title: string;
  status: string;
  file_url: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export async function listContractsForOrg(
  orgId: string,
): Promise<ContractList[]> {
  const result = await db
    .select({
      id: contracts.id,
      title: contracts.title,
      status: contracts.status,
      file_url: contracts.file_url,
      created_at: contracts.created_at,
      updated_at: contracts.updated_at,
    })
    .from(contracts)
    .where(
      and(
        eq(contracts.org_id, orgId),
        isNull(contracts.deleted_at), // IMPORTANT: Filter out soft-deleted contracts
      ),
    )
    .orderBy(contracts.created_at);

  return result.map((contract) => ({
    ...contract,
    status: contract.status || "draft",
    file_url: contract.file_url || null,
    created_at: contract.created_at || new Date(),
    updated_at: contract.updated_at || new Date(),
  }));
}

export async function getContractById(
  contractId: string,
): Promise<ContractList | null> {
  const orgId = await getCurrentOrgIdOrThrow();

  const result = await db
    .select({
      id: contracts.id,
      title: contracts.title,
      status: contracts.status,
      file_url: contracts.file_url,
      created_at: contracts.created_at,
      updated_at: contracts.updated_at,
    })
    .from(contracts)
    .where(
      and(
        eq(contracts.id, contractId),
        eq(contracts.org_id, orgId),
        isNull(contracts.deleted_at), // IMPORTANT: Filter out soft-deleted contracts
      ),
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const contract = result[0];
  return {
    ...contract,
    status: contract.status || "draft",
    file_url: contract.file_url || null,
    created_at: contract.created_at || new Date(),
    updated_at: contract.updated_at || new Date(),
  };
}

export async function renameContract({
  orgId,
  contractId,
  title,
}: {
  orgId: string;
  contractId: string;
  title: string;
}): Promise<void> {
  await db
    .update(contracts)
    .set({
      title,
      updated_at: new Date(),
    })
    .where(
      and(
        eq(contracts.id, contractId),
        eq(contracts.org_id, orgId),
        isNull(contracts.deleted_at),
      ),
    );
}

export async function softDeleteContract({
  orgId,
  contractId,
}: {
  orgId: string;
  contractId: string;
}): Promise<void> {
  await db
    .update(contracts)
    .set({
      status: "deleted",
      deleted_at: new Date(),
      updated_at: new Date(),
    })
    .where(
      and(
        eq(contracts.id, contractId),
        eq(contracts.org_id, orgId),
        isNull(contracts.deleted_at),
      ),
    );
}

export async function finalizeContractUpload({
  contractId,
  filePath,
}: {
  contractId: string;
  filePath: string;
}): Promise<void> {
  const orgId = await getCurrentOrgIdOrThrow();

  // Step 1: Verify contract exists and belongs to user's org
  const contractRecords = await db
    .select({ file_url: contracts.file_url })
    .from(contracts)
    .where(
      and(
        eq(contracts.id, contractId),
        eq(contracts.org_id, orgId),
        isNull(contracts.deleted_at), // IMPORTANT: Don't allow finalizing deleted contracts
      ),
    )
    .limit(1);

  if (contractRecords.length === 0) {
    throw new Error("Contract not found or access denied");
  }

  const contract = contractRecords[0];

  // Step 2: Verify file path format and org consistency
  if (!contract.file_url) {
    throw new Error("Contract has no file path");
  }

  const expectedPathPrefix = `contracts/${orgId}/${contractId}`;
  if (!contract.file_url.startsWith(expectedPathPrefix)) {
    throw new Error("File path does not match expected org/contract format");
  }

  // Step 3: Verify file actually exists in storage
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: files, error: listError } = await supabase.storage
    .from("contracts")
    .list(`${orgId}/${contractId}`, { limit: 1 });

  if (listError) {
    throw new Error(`Failed to verify storage: ${listError.message}`);
  }

  if (!files || files.length === 0) {
    throw new Error("File not found in storage - cannot finalize contract");
  }

  // Step 4: Update contract status to active
  await db
    .update(contracts)
    .set({
      status: "active", // Use 'active' instead of 'uploaded' as it's in the enum
      file_url: filePath,
      updated_at: new Date(),
    })
    .where(and(eq(contracts.id, contractId), eq(contracts.org_id, orgId)));
}
