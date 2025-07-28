import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
}

export function UploadZone({ onFileUpload, isUploading }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0]);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
    multiple: false,
    disabled: isUploading,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed cursor-pointer transition-colors bg-gray-800 border-gray-700",
        isDragActive || dragActive
          ? "border-cyan-500 bg-cyan-500/10"
          : "hover:border-gray-600",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="p-6 text-center">
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          {isUploading ? (
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-3" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400 mb-3" />
          )}
          <p className="text-sm font-medium text-gray-300 mb-1">
            {isUploading
              ? "Processing file..."
              : isDragActive
              ? "Drop file here"
              : "Drop PDF, TXT, or MD files"}
          </p>
          <p className="text-xs text-gray-500">
            {isUploading ? "Extracting text and generating notes..." : "or click to browse (10MB max)"}
          </p>
        </div>
      </div>
    </Card>
  );
}
