import { getCurrentOrgIdOrThrow } from "@/modules/auth/lib/current-org";
import { listContractsForOrg } from "@/modules/contracts/lib/contracts";
import { ContractList } from "./contract-list";
import { ContractUpload } from "./contract-upload";

export default async function ContractsPage() {
  const orgId = await getCurrentOrgIdOrThrow();
  const contracts = await listContractsForOrg(orgId);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Contracts</h1>
        <p className="text-muted-foreground">
          Upload and manage your organization&apos;s contracts
        </p>
      </div>

      <div className="grid gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Upload New Contract</h2>
          <ContractUpload />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Your Contracts</h2>
          <ContractList contracts={contracts} />
        </div>
      </div>
    </div>
  );
}
