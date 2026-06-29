'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBoms, getProductionLogs, produceBomAction, deleteProductionLogAction } from '@/app/actions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Hammer, History, ClipboardList, Trash2, Calendar, Activity, Layers, Hash, Factory } from 'lucide-react';
import toast from 'react-hot-toast';
import BomView from '@/components/BomView';

type Tab = 'production' | 'bom';

export default function ManufacturingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('production');
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

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['productionLogs'],
    queryFn: () => getProductionLogs()
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['productionLogs'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['boms'] });
  };

  // KPI stats
  const totalBuilds = logs.length;
  const totalUnitsManufactured = useMemo(() => {
    return logs.reduce((sum: number, log: any) => sum + (log.quantityBuilt || 0), 0);
  }, [logs]);

  const isFormReady = bomId && qty > 0;

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

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'production', label: 'Production', icon: <Hammer className="w-4 h-4" /> },
    { key: 'bom', label: 'BOM Recipes', icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-text-primary tracking-tight font-display">Manufacturing Operations</h1>
            <p className="text-sm text-text-secondary">Assemble products from BOM recipes and manage production runs.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
            <Factory className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent tracking-wide uppercase font-display">Assembly Line</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-bg-tertiary p-1 rounded-xl border border-border w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 font-semibold ${
              activeTab === tab.key
                ? 'bg-accent text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'production' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* KPI Summary Chips */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-50" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-display">Total Builds</span>
                <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Hash className="w-4 h-4 text-accent" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary mt-3 stat-number relative z-10 font-display">{totalBuilds}</p>
              <span className="text-xs text-text-tertiary relative z-10">Production runs completed</span>
            </div>
            <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
              <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent opacity-50" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-display">Units Manufactured</span>
                <div className="w-7 h-7 bg-success/10 rounded-lg flex items-center justify-center">
                  <Layers className="w-4 h-4 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary mt-3 stat-number relative z-10 font-display">{totalUnitsManufactured.toLocaleString()}</p>
              <span className="text-xs text-text-tertiary relative z-10">Total assembled output</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Manufacturing Run trigger form */}
            <div className="lg:col-span-1">
              <Card className={`glass-card rounded-2xl p-5 sticky top-24 transition-all duration-300 ${isFormReady ? 'border-accent/30 shadow-lg shadow-accent/5' : ''}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-accent/15 rounded-lg flex items-center justify-center">
                    <Hammer className="w-4 h-4 text-accent" />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-display">Execute Production</h3>
                </div>
                
                <form onSubmit={handleBuild} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Assembly Recipe (BOM)</label>
                    <select
                      value={bomId}
                      onChange={(e) => setBomId(e.target.value)}
                      className="w-full text-sm p-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent outline-0 outline-offset-0 transition-all cursor-pointer"
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
                    <label className="text-xs font-semibold text-text-secondary">Quantity to Manufacture</label>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                      className="w-full text-sm p-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent outline-0 outline-offset-0 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Production Date</label>
                    <input
                      type="date"
                      value={buildDate}
                      onChange={(e) => setBuildDate(e.target.value)}
                      className="w-full text-sm p-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent outline-0 outline-offset-0 transition-all cursor-pointer"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Production Notes</label>
                    <textarea
                      placeholder="Batch number, material notes, or visual inspections..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full text-sm p-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent outline-0 outline-offset-0 transition-all resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Processing Build...' : 'Execute Build Run'}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Right: History Log of builds */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-success/15 rounded-lg flex items-center justify-center">
                    <History className="w-4 h-4 text-success" />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-display">Production Log Run History</h3>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skeleton h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-border rounded-xl bg-bg-tertiary/30">
                    <div className="w-14 h-14 bg-bg-tertiary rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-7 h-7 text-text-tertiary" />
                    </div>
                    <p className="text-sm font-semibold text-text-primary mb-1">No production runs yet</p>
                    <p className="text-xs text-text-tertiary max-w-xs mx-auto">Submit the build form on the left to execute your first assembly run and start tracking production.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow hover={false} className="border-b border-border bg-bg-tertiary/40">
                          <TableHead className="text-xs font-bold text-text-secondary">BOM Recipe</TableHead>
                          <TableHead className="text-xs font-bold text-text-secondary text-right">Built Qty</TableHead>
                          <TableHead className="text-xs font-bold text-text-secondary">Timestamp</TableHead>
                          <TableHead className="text-xs font-bold text-text-secondary">Inspection / Notes</TableHead>
                          <TableHead className="text-xs font-bold text-text-secondary text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log: any, index: number) => (
                          <TableRow key={log.id} className="border-b border-border hover:bg-bg-hover/30 transition-colors group row-enter" style={{ animationDelay: `${index * 30}ms` }}>
                            <TableCell className="text-sm font-semibold text-text-primary">
                              {log.bomName || log.bom?.name || 'Unknown Recipe'}
                            </TableCell>
                            <TableCell className="text-sm font-bold text-success text-right">
                              +{log.quantityBuilt}
                            </TableCell>
                            <TableCell className="text-xs text-text-secondary">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                                {new Date(log.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-text-secondary max-w-[200px] truncate">
                              {log.notes || <span className="italic text-text-tertiary">No notes logged</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-1.5 hover:bg-error/15 rounded-lg text-text-tertiary hover:text-error transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                                title="Reverse build run"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bom' && (
        <div className="animate-in fade-in duration-300">
          <BomView />
        </div>
      )}
    </div>
  );
}