import { getCurrentOrgIdOrThrow } from "@/modules/auth/lib/current-org";
import { db } from "@/shared/db";
import { contracts } from "@/shared/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface ContractDraft {
  title: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ContractDraftResult {
  contractId: string;
  orgId: string;
  uploadPath: string;
}

export async function createContractDraft({
  title,
  mimeType,
  sizeBytes,
}: ContractDraft): Promise<ContractDraftResult> {
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
    .where(eq(contracts.org_id, orgId))
    .orderBy(contracts.created_at);

  return result.map((contract) => ({
    ...contract,
    status: contract.status || "draft",
    file_url: contract.file_url || null,
    created_at: contract.created_at || new Date(),
    updated_at: contract.updated_at || new Date(),
  }));
}

export async function finalizeContractUpload({
  contractId,
  filePath,
  sizeBytes,
  mimeType,
}: {
  contractId: string;
  filePath: string;
  sizeBytes: number;
  mimeType: string;
}): Promise<void> {
  const orgId = await getCurrentOrgIdOrThrow();

  await db
    .update(contracts)
    .set({
      status: "active", // Use 'active' instead of 'uploaded' as it's in the enum
      file_url: filePath,
      updated_at: new Date(),
    })
    .where(and(eq(contracts.id, contractId), eq(contracts.org_id, orgId)));
}
