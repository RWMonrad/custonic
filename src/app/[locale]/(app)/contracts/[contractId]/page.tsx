import { AnalysisPanel } from "@/modules/analysis/components/AnalysisPanel";
import { getLatestAnalysisForContract } from "@/modules/analysis/lib/queries";
import { adaptAnalysisForClient } from "@/modules/analysis/lib/type-adapter";
import type { AnalysisWithFindings } from "@/modules/analysis/types/analysis";
import { getCurrentOrgIdOrThrow } from "@/modules/auth/lib/current-org";
import { ContractDetailActions } from "@/modules/contracts/components/contract-detail-actions";
import {
  getContractById,
  type ContractList,
} from "@/modules/contracts/lib/contracts";
import Link from "next/link";
import AppLayout from "../../layout";

interface ContractDetailPageProps {
  params: {
    contractId: string;
    locale: string;
  };
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { contractId } = params;

  let contract: ContractList | null = null;
  let analysis: AnalysisWithFindings | null = null;
  let error: Error | null = null;
  let contractNotFound = false;

  try {
    const orgId = await getCurrentOrgIdOrThrow();
    contract = await getContractById(contractId);

    if (!contract) {
      contractNotFound = true;
    } else {
      const serverAnalysis = await getLatestAnalysisForContract(
        contractId,
        orgId,
      );
      analysis = adaptAnalysisForClient(serverAnalysis);
    }
  } catch (err) {
    error = err as Error;
  }

  if (contractNotFound) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Contract Not Found</h1>
          <p className="text-gray-600 mb-8">
            The contract you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/contracts"
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Back to Contracts
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Contract Not Found</h1>
          <p className="text-gray-600 mb-8">
            The contract you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/contracts"
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Back to Contracts
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-600 mb-8">
            You don&apos;t have permission to view this contract.
          </p>
          <Link
            href="/contracts"
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Back to Contracts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold">{contract!.title}</h1>
        <div className="grid gap-6 lg:grid-cols-3 mt-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Contract Details</h2>
              <p>Contract content will be displayed here.</p>
            </div>
          </div>
          <div className="space-y-6">
            <AnalysisPanel contract={contract!} analysis={analysis} />
            <ContractDetailActions contract={contract!} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
