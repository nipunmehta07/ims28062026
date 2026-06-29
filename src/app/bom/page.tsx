'use client';

import BomView from '@/components/BomView';

export default function BomsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Bill of Materials (BOM)</h1>
          <p className="text-sm text-text-secondary">Define product recipes, track sub-assemblies, and run manufacturing actions</p>
        </div>
      </div>
      <BomView />
    </div>
  );
}