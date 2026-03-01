import { ContractAnalysis } from "@/modules/analysis/components/contract-analysis";
import { getCurrentOrgIdOrThrow } from "@/modules/auth/lib/current-org";
import { ContractDetailActions } from "@/modules/contracts/components/contract-detail-actions";
import { getContractById } from "@/modules/contracts/lib/contracts";
import { format } from "date-fns";

interface ContractDetailPageProps {
  params: {
    contractId: string;
    locale: string;
  };
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  try {
    const orgId = await getCurrentOrgIdOrThrow();
    const contract = await getContractById(params.contractId);

    // Return 404-like UI if contract not found (no data leakage)
    if (!contract) {
      return (
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Contract Not Found
            </h1>
            <p className="mt-2 text-gray-600">
              The contract you're looking for doesn't exist or you don't have
              access to it.
            </p>
          </div>
        </div>
      );
    }

    // Extract file name from file_url
    const fileName = contract.file_url
      ? contract.file_url.split("/").pop() || "Unknown"
      : "No file";

    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{contract.title}</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contract Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Contract Details</h2>

              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contract.status === "active"
                          ? "bg-green-100 text-green-800"
                          : contract.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : contract.status === "expired"
                              ? "bg-red-100 text-red-800"
                              : contract.status === "terminated"
                                ? "bg-gray-100 text-gray-800"
                                : contract.status === "pending_review"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {contract.status}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(contract.created_at || new Date(), "PPP")}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    File Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{fileName}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    File Path
                  </dt>
                  <dd className="mt-1 text-sm text-gray-500 font-mono break-all">
                    {contract.file_url || "No file"}
                  </dd>
                </div>
              </dl>
            </div>

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
            <ContractAnalysis contract={contract} />
            <ContractDetailActions contract={contract} />
          </div>
        </div>
      </div>
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
