"use client";

import { useState } from "react";
import { Button, type DropdownOption } from "@/app/components/ui";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";

export interface ExportColumn {
  key: string;
  header: string;
  accessor: (row: Record<string, unknown>) => string | number;
}

interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  filename: string;
  label?: string;
}

export function ExportButton({
  data,
  columns,
  filename,
  label = "Export"
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleCSVExport = () => {
    const csvData = data.map(row =>
      columns.reduce((acc, col) => {
        acc[col.header] = col.accessor(row);
        return acc;
      }, {} as Record<string, string | number>)
    );

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleJSONExport = () => {
    const jsonData = data.map(row =>
      columns.reduce((acc, col) => {
        acc[col.key] = col.accessor(row);
        return acc;
      }, {} as Record<string, string | number>)
    );

    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const exportOptions: DropdownOption[] = [
    { value: "csv", label: "Export CSV", icon: <FileSpreadsheet size={14} /> },
    { value: "json", label: "Export JSON", icon: <FileText size={14} /> },
  ];

  const handleSelect = (option: DropdownOption) => {
    if (option.value === "csv") handleCSVExport();
    else if (option.value === "json") handleJSONExport();
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
      >
        <Download size={14} />
        {label}
      </Button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 z-20 w-40 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
          {exportOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt)}
              className="w-full flex items-center gap-2 px-4 py-3 text-[11px] font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExportButton;