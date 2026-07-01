"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/app/actions";
import { AuditTrailViewer } from "@/components/composite/AuditTrailViewer";

export default function AuditTrailPage() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => getAuditLogs(),
    refetchInterval: 10000 // auto-refresh every 10s
  });

  return <AuditTrailViewer entries={entries as any} isLoading={isLoading} />;
}