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
        "border-2 border-dashed cursor-pointer transition-colors",
        isDragActive || dragActive
          ? "border-primary bg-primary/5"
          : "border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="p-4 sm:p-6 text-center">
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          {isUploading ? (
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-primary border-t-transparent rounded-full mb-2 sm:mb-3" />
          ) : (
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500 mb-2 sm:mb-3" />
          )}
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isUploading
              ? "Uploading..."
              : isDragActive
              ? "Drop file here"
              : "Drop PDF files here"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isUploading ? "Please wait..." : "or click to browse"}
          </p>
        </div>
      </div>
    </Card>
  );
}
