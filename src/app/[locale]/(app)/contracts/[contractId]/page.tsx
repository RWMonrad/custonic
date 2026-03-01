import { AnalysisPanel } from "@/modules/analysis/components/AnalysisPanel";
import { getLatestAnalysisForContract } from "@/modules/analysis/lib/queries";
import { adaptAnalysisForClient } from "@/modules/analysis/lib/type-adapter";
import { getCurrentOrgIdOrThrow } from "@/modules/auth/lib/current-org";
import { ContractDetailActions } from "@/modules/contracts/components/contract-detail-actions";
import { getContractById } from "@/modules/contracts/lib/contracts";
import { format } from "date-fns";
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

  try {
    // Get current org and verify contract access
    const orgId = await getCurrentOrgIdOrThrow();
    const contract = await getContractById(contractId);

    if (!contract) {
      return (
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Contract Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The contract you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <a
              href="/contracts"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Back to Contracts
            </a>
          </div>
        </div>
      );
    }

    // Get latest analysis for this contract
    const serverAnalysis = await getLatestAnalysisForContract(
      contractId,
      orgId,
    );
    const analysis = adaptAnalysisForClient(serverAnalysis);

    // Extract file name from file_url
    const fileName = contract.file_url
      ? contract.file_url.split("/").pop() || "Unknown"
      : "No file";

    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {contract.title}
            </h1>
            <p className="text-muted-foreground">
              Contract analysis and risk assessment
            </p>
            {/* Status Timeline */}
            <div className="bg-white rounded-lg border p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Status Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      [
                        "draft",
                        "active",
                        "expired",
                        "terminated",
                        "pending_review",
                      ].includes(contract.status)
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">Uploaded</p>
                    <p className="text-xs text-gray-500">
                      {format(contract.created_at || new Date(), "PPp")}
                    </p>
                  </div>
                </div>

                {contract.status === "active" && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">Active</p>
                      <p className="text-xs text-gray-500">
                        Contract is active and ready
                      </p>
                    </div>
                  </div>
                )}

                {(contract.status === "expired" ||
                  contract.status === "terminated") && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {contract.status === "expired"
                          ? "Expired"
                          : "Terminated"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Contract is no longer active
                      </p>
                    </div>
                  </div>
                )}

                {contract.status === "pending_review" && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Pending Review</p>
                      <p className="text-xs text-gray-500">
                        Contract is under review
                      </p>
                    </div>
                  </div>
                )}

                {(contract.status === "queued" ||
                  contract.status === "processing") && (
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        contract.status === "queued"
                          ? "bg-yellow-500"
                          : "bg-blue-500 animate-pulse"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {contract.status === "queued" ? "Queued" : "Processing"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {contract.status === "queued"
                          ? "Analysis is queued"
                          : "Analysis in progress"}
                      </p>
                    </div>
                  </div>
                )}

                {contract.status === "completed" && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">Analysis Complete</p>
                      <p className="text-xs text-gray-500">
                        Contract analysis completed
                      </p>
                    </div>
                  </div>
                )}

                {contract.status === "failed" && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-medium">Analysis Failed</p>
                      <p className="text-xs text-gray-500">
                        Analysis encountered an error
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 opacity-50">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <div>
                    <p className="text-sm font-medium">Analyzed (Future)</p>
                    <p className="text-xs text-gray-500">Analysis complete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <AnalysisPanel contract={contract} analysis={analysis} />
            <ContractDetailActions contract={contract} />
          </div>
        </div>
      </AppLayout>
    );
  } catch (error) {
    // Handle authentication errors gracefully
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Access Denied
          </h1>
          <p className="mt-2 text-gray-600">
            You need to be logged in to view contracts.
          </p>
        </div>
      </div>
    );
  }
}
