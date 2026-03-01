"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
    createContractDraftAction,
    finalizeContractUploadAction,
    initialContractDraftState,
    initialFinalizeUploadState,
} from "./actions";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function SubmitButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export function ContractUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Validate file
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("Only PDF and DOCX files are allowed");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 20MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Create contract draft
      const formData = new FormData();
      formData.append("title", file.name);
      formData.append("mimeType", file.type);
      formData.append("sizeBytes", file.size.toString());

      const draftResponse = await createContractDraftAction(
        initialContractDraftState,
        formData,
      );

      if (draftResponse.status === "error") {
        throw new Error(draftResponse.message);
      }

      if (!draftResponse.data) {
        throw new Error("No upload data received");
      }

      // Step 2: Upload file to Supabase Storage
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(draftResponse.data.uploadPath, file, {
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Step 3: Finalize contract record
      const finalizeFormData = new FormData();
      finalizeFormData.append("contractId", draftResponse.data.contractId);
      finalizeFormData.append("filePath", draftResponse.data.uploadPath);
      finalizeFormData.append("sizeBytes", file.size.toString());
      finalizeFormData.append("mimeType", file.type);

      const finalizeResponse = await finalizeContractUploadAction(
        initialFinalizeUploadState,
        finalizeFormData,
      );

      if (finalizeResponse.status === "error") {
        throw new Error(finalizeResponse.message);
      }

      // Success!
      setSuccess("Contract uploaded successfully");
      router.refresh();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadProgress(0);
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="border rounded-lg p-6">
      <form>
        <div className="mb-4">
          <label
            htmlFor="file"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Contract File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 disabled:opacity-50"
          />
          <p className="mt-1 text-sm text-gray-500">
            PDF and DOCX files up to 20MB
          </p>
        </div>

        {isUploading && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
            {success}
          </div>
        )}
      </form>
    </div>
  );
}
