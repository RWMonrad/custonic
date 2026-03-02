"use client";

import { AlertCircle, CheckCircle, FileText, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";

interface UploadFile {
  id: string;
  name: string;
  size: number;
  status: "pending" | "uploading" | "success" | "error";
  progress?: number;
  error?: string;
}

interface UploadDropzoneProps {
  onFilesUploaded?: (files: UploadFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

export function UploadDropzone({
  onFilesUploaded,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [".pdf", ".doc", ".docx"],
}: UploadDropzoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles = newFiles.filter((file) => {
        const extension = "." + file.name.split(".").pop()?.toLowerCase();
        const isValidType = acceptedTypes.includes(extension);
        const isValidSize = file.size <= maxSize;

        if (!isValidType) {
          console.error(`Invalid file type: ${file.name}`);
          return false;
        }

        if (!isValidSize) {
          console.error(`File too large: ${file.name}`);
          return false;
        }

        return true;
      });

      const uploadFiles: UploadFile[] = validFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        status: "pending",
      }));

      setFiles((prev) => [...prev, ...uploadFiles].slice(0, maxFiles));

      // Simulate upload progress
      uploadFiles.forEach((file) => {
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, status: "uploading", progress: 0 } : f,
            ),
          );

          // Simulate progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
              clearInterval(interval);
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === file.id
                    ? { ...f, status: "success", progress: 100 }
                    : f,
                ),
              );
              // Call the callback when file is successfully uploaded
              onFilesUploaded?.([file]);
            } else {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === file.id
                    ? { ...f, progress: Math.min(progress, 99) }
                    : f,
                ),
              );
            }
          }, 200);
        }, 500);
      });
    },
    [acceptedTypes, maxSize, maxFiles, onFilesUploaded],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    },
    [addFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
      }
    },
    [addFiles],
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "uploading":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        );
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-danger" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Upload Contracts
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your contract files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Accepted formats: {acceptedTypes.join(", ")} • Max size:{" "}
              {formatFileSize(maxSize)}
            </p>
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(",")}
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Select Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Upload Queue ({files.length})
            </h3>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-3 p-3 bg-background rounded-lg border"
                >
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    {file.status === "uploading" &&
                      file.progress !== undefined && (
                        <div className="mt-2">
                          <div className="bg-muted rounded-full h-1">
                            <div
                              className="bg-primary h-1 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === "uploading"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {files.some((f) => f.status === "success") && (
              <div className="mt-4 pt-4 border-t border-border">
                <Button className="w-full">Analyze Uploaded Files</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
