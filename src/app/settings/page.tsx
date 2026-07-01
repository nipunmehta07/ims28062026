// src/app/settings/page.tsx
import SettingsView from '@/modules/settings/components/SettingsView';

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SettingsView />
    </div>
  );
}