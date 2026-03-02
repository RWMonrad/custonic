import { billingHooks } from "@/modules/billing/lib/billing-hooks-clean";
import { BILLING_EVENTS } from "@/shared/billing/constants";

/**
 * Check if file size is within plan limits
 */
export async function validateFileSizeForUpload(
  orgId: string,
  fileSizeBytes: number,
): Promise<{
  allowed: boolean;
  maxSizeBytes: number;
  message: string;
}> {
  return await billingHooks.checkFileSizeLimit(orgId, fileSizeBytes);
}

/**
 * Record contract upload in billing ledger
 */
export async function recordContractUpload(
  orgId: string,
  contractId: string,
  userId: string,
  fileSizeBytes: number,
  mimeType: string,
): Promise<void> {
  await billingHooks.recordUsage(
    orgId,
    BILLING_EVENTS.CONTRACT_UPLOADED,
    "contract",
    contractId,
    {
      file_size_bytes: fileSizeBytes,
      mime_type: mimeType,
      contract_id: contractId,
    },
    userId, // Track which user uploaded
  );
}

/**
 * Record signed download in billing ledger
 */
export async function recordSignedDownload(
  orgId: string,
  contractId: string,
  userId: string,
): Promise<void> {
  await billingHooks.recordUsage(
    orgId,
    BILLING_EVENTS.SIGNED_DOWNLOAD,
    "contract",
    contractId,
    {
      contract_id: contractId,
    },
    userId,
  );
}
