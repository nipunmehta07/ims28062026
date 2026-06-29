'use client';

import SettingsView from '@/components/SettingsView';

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">System Settings</h1>
          <p className="text-sm text-text-secondary">Perform database backups, restoral snapshots, and restore instances</p>
        </div>
      </div>
      <SettingsView />
    </div>
  );
}