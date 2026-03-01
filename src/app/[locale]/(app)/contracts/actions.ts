"use server";

import {
    createContractDraft,
    finalizeContractUpload,
} from "@/modules/contracts/lib/contracts";
import { z } from "zod";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const createDraftSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
});

const finalizeUploadSchema = z.object({
  contractId: z.string().uuid("Invalid contract ID"),
  filePath: z.string().min(1, "File path is required"),
});

export type ContractDraftState = {
  status: "idle" | "error" | "success";
  message?: string;
  data?: {
    contractId: string;
    orgId: string;
    uploadPath: string;
  };
};

export const initialContractDraftState: ContractDraftState = { status: "idle" };

export async function createContractDraftAction(
  prevState: ContractDraftState,
  formData: FormData,
): Promise<ContractDraftState> {
  const title = formData.get("title") as string;

  const validatedFields = createDraftSchema.safeParse({
    title,
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      message: validatedFields.error.issues[0]?.message || "Invalid input",
    };
  }

  try {
    const result = await createContractDraft({
      title: validatedFields.data.title,
    });

    return {
      status: "success",
      data: result,
    };
  } catch (error) {
    console.error("Failed to create contract draft:", error);
    return {
      status: "error",
      message: "Failed to create contract draft",
    };
  }
}

export type FinalizeUploadState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialFinalizeUploadState: FinalizeUploadState = {
  status: "idle",
};

export async function finalizeContractUploadAction(
  prevState: FinalizeUploadState,
  formData: FormData,
): Promise<FinalizeUploadState> {
  const contractId = formData.get("contractId") as string;
  const filePath = formData.get("filePath") as string;

  const validatedFields = finalizeUploadSchema.safeParse({
    contractId,
    filePath,
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      message: validatedFields.error.issues[0]?.message || "Invalid input",
    };
  }

  try {
    await finalizeContractUpload({
      contractId: validatedFields.data.contractId,
      filePath: validatedFields.data.filePath,
    });

    return {
      status: "success",
      message: "Contract uploaded successfully",
    };
  } catch (error) {
    console.error("Failed to finalize contract upload:", error);
    return {
      status: "error",
      message: "Failed to finalize contract upload",
    };
  }
}
