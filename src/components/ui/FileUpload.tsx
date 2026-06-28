"use client";

import { HTMLAttributes, forwardRef, useState, useRef, useCallback } from "react";
import { Upload, X, File, Image, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { Progress } from "./Progress";

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

export interface FileUploadProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  disabled?: boolean;
  error?: string;
  showPreview?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(
  ({
    onChange,
    accept,
    multiple = true,
    maxFiles = 10,
    maxSize = 10, // 10MB
    disabled = false,
    error,
    showPreview = true,
    className = "",
    ...props
  }, ref) => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        return `File exceeds ${maxSize}MB limit`;
      }
      if (accept) {
        const acceptedTypes = accept.split(",").map(t => t.trim());
        const fileType = file.type;
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith(".")) return fileExtension === type.toLowerCase();
          if (type.endsWith("/*")) return fileType.startsWith(type.replace("/*", "/"));
          return fileType === type;
        });
        if (!isAccepted) {
          return `File type not accepted`;
        }
      }
      return null;
    };

    const simulateUpload = useCallback((fileId: string) => {
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "uploading" } : f))
      );

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, progress: 100, status: "complete" } : f))
          );
        } else {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
          );
        }
      }, 200);
    }, []);

    const addFiles = useCallback((files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = maxFiles - uploadedFiles.length;
      const filesToAdd = fileArray.slice(0, remainingSlots);

      const newFiles: UploadedFile[] = filesToAdd.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        progress: 0,
        status: "pending",
        error: validateFile(file) || undefined,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      
      // Simulate upload progress
      newFiles.forEach((fileData) => {
        if (!fileData.error) {
          simulateUpload(fileData.id);
        }
      });

      onChange?.(uploadedFiles.concat(newFiles).map(f => f.file));
    }, [maxFiles, uploadedFiles, onChange, simulateUpload, validateFile]);

    const removeFile = (fileId: string) => {
      setUploadedFiles((prev) => {
        const file = prev.find(f => f.id === fileId);
        if (file?.preview) {
          URL.revokeObjectURL(file.preview);
        }
        const newFiles = prev.filter(f => f.id !== fileId);
        onChange?.(newFiles.map(f => f.file));
        return newFiles;
      });
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled && e.dataTransfer.files) {
        addFiles(e.dataTransfer.files);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
    };

    const getFileIcon = (file: File) => {
      if (file.type.startsWith("image/")) return Image;
      if (file.type.includes("pdf") || file.type.includes("document")) return FileText;
      return File;
    };

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {/* Drop zone with gradient border */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
            transition-all duration-200 overflow-hidden
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${isDragging
              ? "border-emerald-500 bg-emerald-50/50 dark:border-emerald-400 dark:bg-emerald-950/30"
              : error
                ? "border-rose-300 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/30"
                : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
            }
          `}
        >
          {/* Gradient border effect on drag */}
          {isDragging && (
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 pointer-events-none" />
          )}
          
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
          />
          
          <div className="relative z-10">
            <div className={`
              w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
              ${isDragging 
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30" 
                : "bg-gray-100 dark:bg-zinc-800"
              }
            `}>
              <Upload size={28} className={isDragging ? "text-white" : "text-gray-400"} />
            </div>
            
            <p className={`text-[11px] font-bold uppercase tracking-widest ${isDragging ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
              {isDragging ? "Drop files here" : "Drag & drop or click to upload"}
            </p>
            <p className="text-[10px] text-gray-400 mt-2">
              {accept ? `Accepted: ${accept}` : "All file types accepted"}
              {maxSize && ` • Max ${maxSize}MB`}
              {maxFiles > 1 && ` • Up to ${maxFiles} files`}
            </p>
          </div>
        </div>

        {/* File list */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles.map((fileData) => {
              const FileIcon = getFileIcon(fileData.file);
              return (
                <div
                  key={fileData.id}
                  className={`
                    relative flex items-center gap-4 p-4 rounded-xl border
                    transition-all duration-200
                    ${fileData.error
                      ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/30"
                      : fileData.status === "complete"
                        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                        : "border-gray-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 hover:border-emerald-200 dark:hover:border-emerald-800"
                    }
                  `}
                >
                  {/* File preview or icon */}
                  {showPreview && fileData.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fileData.preview}
                      alt={fileData.file.name}
                      className="w-12 h-12 object-cover rounded-xl shadow-sm"
                    />
                  ) : (
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      ${fileData.error 
                        ? "bg-rose-100 dark:bg-rose-900/50" 
                        : fileData.status === "complete"
                          ? "bg-emerald-100 dark:bg-emerald-900/50"
                          : "bg-gray-100 dark:bg-zinc-800"
                      }
                    `}>
                      <FileIcon size={22} className={`
                        ${fileData.error ? "text-rose-500" : fileData.status === "complete" ? "text-emerald-500" : "text-gray-400"}
                      `} />
                    </div>
                  )}
                  
                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-gray-900 dark:text-white truncate">
                      {fileData.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[9px] text-gray-500 dark:text-gray-400">
                        {formatFileSize(fileData.file.size)}
                      </p>
                      {fileData.error && (
                        <span className="text-[9px] text-rose-500 font-medium">{fileData.error}</span>
                      )}
                    </div>
                    
                    {/* Emerald gradient progress bar */}
                    {fileData.status === "uploading" && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-200"
                            style={{ width: `${fileData.progress}%` }}
                          />
                        </div>
                        <p className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                          {Math.round(fileData.progress)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status icon and remove button */}
                  <div className="flex items-center gap-2">
                    {fileData.status === "complete" && !fileData.error && (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center animate-in zoom-in duration-200">
                        <CheckCircle size={16} className="text-emerald-500" />
                      </div>
                    )}
                    {fileData.error && (
                      <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                        <AlertCircle size={16} className="text-rose-500" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(fileData.id)}
                      className={`
                        w-7 h-7 rounded-full flex items-center justify-center
                        transition-colors duration-150
                        ${fileData.error 
                          ? "bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-500" 
                          : "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }
                      `}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && !uploadedFiles.length && (
          <p className="mt-1.5 text-[10px] font-medium text-rose-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";