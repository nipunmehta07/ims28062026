// src/components/ui/RefreshButton.tsx
'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  className?: string;
}

export function RefreshButton({ onRefresh, className }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={className}
    >
      <RefreshCw className={cn(
        "w-4 h-4 mr-2",
        isRefreshing && "animate-spin"
      )} />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </Button>
  );
}