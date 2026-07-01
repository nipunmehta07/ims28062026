// src/modules/manufacturing/components/ManufacturingView.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { getBoms, getProductionLogs, produceBomAction, deleteProductionLogAction } from '@/app/actions';
import { Card } from '@/components/ui/Card';
import { Hammer, History, ClipboardList, Trash2, Calendar, Activity, Layers, Hash, Factory, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import BomView from './BomView';

export default function ManufacturingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'bom' ? 'bom' : 'production';
  
  const queryClient = useQueryClient();
  const [bomId, setBomId] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [buildDate, setBuildDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: boms = [] } = useQuery({
    queryKey: ['boms'],
    queryFn: () => getBoms()
  });

  const { data: logs = [], isLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['productionLogs'],
    queryFn: () => getProductionLogs()
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['productionLogs'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['boms'] });
    refetchLogs();
  };

  // KPI stats
  const totalBuilds = logs.length;
  const totalUnitsManufactured = useMemo(() => {
    return logs.reduce((sum: number, log: any) => sum + (log.quantityBuilt || 0), 0);
  }, [logs]);

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomId) return toast.error('Select a recipe assembly to build.');
    if (qty <= 0) return toast.error('Quantity must be greater than 0.');

    setIsSubmitting(true);
    const loadingToast = toast.loading('Running build pipeline & deducting material components...');
    try {
      await produceBomAction({
        bomId,
        quantityToBuild: qty,
        buildDate,
        notes
      });
      toast.success(`Success! Manufactured ${qty} units.`, { id: loadingToast });
      setNotes('');
      setBomId('');
      setQty(1);
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Build failed. Check if component quantities are sufficient.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Reversing this build will add components back to stock and deduct the finished good. Proceed?')) return;
    const loadingToast = toast.loading('Reversing build...');
    try {
      await deleteProductionLogAction(logId);
      toast.success('Build log reversed successfully.', { id: loadingToast });
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Reversal failed.', { id: loadingToast });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 font-sans text-gray-800 text-left">
      
      {activeTab === 'production' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top KPI row (Odoo style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Total Builds */}
            <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Total builds executed
              </span>
              <span className="text-4xl font-light text-gray-700 mt-2">
                {totalBuilds}
              </span>
            </div>

            {/* Units Manufactured */}
            <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Units assembled
              </span>
              <span className="text-4xl font-light text-gray-700 mt-2">
                {totalUnitsManufactured.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Form execution */}
            <div className="lg:col-span-1">
              <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Hammer className="w-4 h-4 text-[#006666]" />
                  <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider">Execute Production</h3>
                </div>
                
                <form onSubmit={handleBuild} className="space-y-4 text-xs font-medium text-gray-600">
                  <div className="space-y-1.5">
                    <label className="font-bold">Assembly Recipe (BOM) *</label>
                    <select
                      value={bomId}
                      onChange={(e) => setBomId(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none bg-white font-medium"
                      required
                    >
                      <option value="">-- Select recipe assembly --</option>
                      {boms.map((bom: any) => (
                        <option key={bom.id} value={bom.id}>
                          {bom.name} ({bom.item?.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold">Quantity to Manufacture *</label>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold">Production Date *</label>
                    <input
                      type="date"
                      value={buildDate}
                      onChange={(e) => setBuildDate(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold">Production Notes</label>
                    <textarea
                      placeholder="Batch numbers, material notes, or visual inspections..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#6a4a63] hover:bg-[#5c3e55] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? 'Processing Build...' : 'Execute Build Run'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Execution history log */}
            <div className="lg:col-span-2">
              <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                  <History className="w-4 h-4 text-[#006666]" />
                  <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider">Production Log Run History</h3>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="w-6 h-6 border-2 border-[#6a4a63] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/30 border border-dashed border-gray-200 rounded-2xl space-y-3">
                    <Factory className="w-12 h-12 text-gray-300" strokeWidth={1} />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-700">No production runs executed yet</p>
                      <p className="text-[10px] text-gray-400 max-w-xs mx-auto">Submit the build form on the left to execute your first assembly run and track component deductions.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px] bg-gray-50">
                          <th className="p-3">BOM Recipe</th>
                          <th className="p-3">Built Qty</th>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Inspection / Notes</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {logs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-800">
                              {log.bomName || log.bom?.name || 'Unknown Recipe'}
                            </td>
                            <td className="p-3 font-bold text-emerald-600">
                              +{log.quantityBuilt}
                            </td>
                            <td className="p-3 text-gray-500">
                              {new Date(log.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="p-3 text-gray-500 max-w-[200px] truncate">
                              {log.notes || <span className="italic text-gray-300">No notes logged</span>}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Reverse build run"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <BomView />
        </div>
      )}
    </div>
  );
}
