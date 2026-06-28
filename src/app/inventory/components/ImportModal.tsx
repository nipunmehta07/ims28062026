"use client";

import { useState, useCallback } from "react";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Progress,
} from "@/components/ui";
import { FileUpload } from "@/components/ui/FileUpload";
import { bulkAddItemsAction } from "@/app/actions";
import toast from "react-hot-toast";
import { Upload, X, AlertCircle, CheckCircle, FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";

interface ParsedRow {
  name: string;
  sku: string;
  category: string;
  unit: string;
  unitCost: string;
  initialQty: string;
  openingStockDate: string;
  [key: string]: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}



export function ImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  const validateRow = (row: ParsedRow, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!row.name?.trim()) {
      errors.push({ row: rowIndex, field: "name", message: "Name is required" });
    }
    if (!row.sku?.trim()) {
      errors.push({ row: rowIndex, field: "sku", message: "SKU is required" });
    }
    if (!row.category?.trim()) {
      errors.push({ row: rowIndex, field: "category", message: "Category is required" });
    }
    if (!row.unit?.trim()) {
      errors.push({ row: rowIndex, field: "unit", message: "Unit is required" });
    }
    if (row.unitCost && isNaN(parseFloat(row.unitCost))) {
      errors.push({ row: rowIndex, field: "unitCost", message: "Invalid price format" });
    }
    if (row.initialQty && isNaN(parseInt(row.initialQty))) {
      errors.push({ row: rowIndex, field: "initialQty", message: "Invalid quantity format" });
    }

    return errors;
  };

  const handleFileSelect = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;

    setCsvFile(file);
    setValidationErrors([]);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const data = results.data as ParsedRow[];
        setParsedData(data);

        // Validate all rows
        const allErrors: ValidationError[] = [];
        data.forEach((row, index) => {
          const rowErrors = validateRow(row, index + 1);
          allErrors.push(...rowErrors);
        });
        setValidationErrors(allErrors);
      },
      error: (error: Error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
        setCsvFile(null);
        setParsedData([]);
      },
    });
  }, []);

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    const validItems = parsedData.filter((_, index) => {
      return !validationErrors.some((e) => e.row === index + 1);
    });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const items = validItems.map((item) => ({
        name: item.name,
        sku: item.sku,
        category: item.category || "Component",
        unit: item.unit || "pcs",
        unitCost: parseFloat(item.unitCost) || 0,
        initialQty: parseInt(item.initialQty) || 0,
        openingStockDate: item.openingStockDate || new Date().toISOString().split("T")[0],
      }));

      const addedCount = await bulkAddItemsAction(items);

      clearInterval(progressInterval);
      setImportProgress(100);

      setImportResult({
        success: addedCount ?? 0,
        failed: parsedData.length - (addedCount ?? 0),
      });

      if ((addedCount ?? 0) > 0) {
        toast.success(`Successfully imported ${addedCount} products!`);
        onSuccess();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setCsvFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportProgress(0);
    setImportResult(null);
    onClose();
  };

  const previewData = parsedData.slice(0, 10);
  const hasValidationErrors = validationErrors.length > 0;
  const canImport = parsedData.length > 0 && !hasValidationErrors && !isImporting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      showCloseButton
      closeOnBackdrop={!isImporting}
      closeOnEscape={!isImporting}
    >
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <FileSpreadsheet size={20} className="text-white" />
          </div>
          <div>
            <ModalTitle>Import Products from CSV</ModalTitle>
            <ModalDescription>
              Upload a CSV file to bulk import products into your inventory.
            </ModalDescription>
          </div>
        </div>
      </ModalHeader>

      <ModalContent className="space-y-6">
        {/* File Upload - Gradient drop zone */}
        {!csvFile && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl blur-xl" />
            <FileUpload
              accept=".csv"
              multiple={false}
              maxFiles={1}
              maxSize={10}
              onChange={handleFileSelect}
              showPreview={false}
            />
          </div>
        )}

        {/* Selected File - Emerald styling */}
        {csvFile && (
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:to-teal-500/10 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-emerald-500" />
              <div>
                <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                  {csvFile.name}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {(csvFile.size / 1024).toFixed(1)} KB • {parsedData.length} rows
                </p>
              </div>
            </div>
            {!isImporting && (
              <button
                onClick={() => {
                  setCsvFile(null);
                  setParsedData([]);
                  setValidationErrors([]);
                }}
                className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
              >
                <X size={16} className="text-emerald-500" />
              </button>
            )}
          </div>
        )}

        {/* Preview Table - Glassmorphism */}
        {previewData.length > 0 && (
          <div>
            <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">
              Preview (First 10 rows)
            </h4>
            <div className="overflow-x-auto border border-emerald-500/10 rounded-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
              <Table minWidth="min-w-[600px]">
                <TableHeader>
                  <TableRow hover={false} className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
                    <TableHead className="text-emerald-600 dark:text-emerald-400">#</TableHead>
                    {Object.keys(previewData[0] || {}).map((key) => (
                      <TableHead key={key} className="text-emerald-600 dark:text-emerald-400">{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => {
                    const rowErrors = validationErrors.filter((e) => e.row === index + 1);
                    const hasRowError = rowErrors.length > 0;

                    return (
                      <TableRow key={index} selected={hasRowError} className={hasRowError ? "bg-rose-50/50 dark:bg-rose-950/20" : ""}>
                        <TableCell className="text-emerald-600 dark:text-emerald-400 font-bold">{index + 1}</TableCell>
                        {Object.values(row).map((value, i) => (
                          <TableCell key={i} className="max-w-[150px] truncate">
                            {value || "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Validation Errors - Rose styling */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 border border-rose-200 dark:border-rose-800 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-rose-500" />
              <h4 className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                Validation Errors ({validationErrors.length})
              </h4>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {validationErrors.slice(0, 20).map((error, index) => (
                <p key={index} className="text-[10px] text-rose-600 dark:text-rose-300">
                  Row {error.row}: {error.field} - {error.message}
                </p>
              ))}
              {validationErrors.length > 20 && (
                <p className="text-[10px] text-rose-500 font-medium">
                  ...and {validationErrors.length - 20} more errors
                </p>
              )}
            </div>
          </div>
        )}

        {/* Import Progress - Emerald gradient */}
        {isImporting && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Importing...
              </span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                {importProgress}%
              </span>
            </div>
            <div className="relative">
              <Progress value={importProgress} size="md" className="h-2" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-50 blur-sm animate-pulse" />
            </div>
          </div>
        )}

        {/* Import Result - Emerald success */}
        {importResult && (
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <CheckCircle size={20} className="text-emerald-500" />
            <div className="flex-1">
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                Import Complete
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                {importResult.success} succeeded, {importResult.failed} failed
              </p>
            </div>
          </div>
        )}

        {/* CSV Format Guide */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-zinc-900 dark:to-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Expected CSV Format
          </h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
            Required columns: <code className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded">name, sku, category, unit, unitCost</code>
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Optional columns: <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded">initialQty, openingStockDate</code>
          </p>
        </div>
      </ModalContent>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isImporting}>
          {importResult ? "Close" : "Cancel"}
        </Button>
        {!importResult && (
          <Button
            variant="gradient"
            onClick={handleImport}
            disabled={!canImport}
            isLoading={isImporting}
          >
            <Upload size={14} />
            Import {parsedData.length} Products
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default ImportModal;