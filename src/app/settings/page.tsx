"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  User,
  Bell,
  Palette,
  Plug,
  Mail,
  Camera,
  Moon,
  Sun,
  Monitor,
  Plus,
  Trash2,
  Key,
  Webhook,
  Link2,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";
import { Tabs, Card, CardHeader, CardTitle, CardContent, Avatar, Button, Input } from "@/app/components/ui";
import { useToast } from "@/app/components/ui/Toast";

// Password change form component
function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const { success } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    // Simulate API call
    setTimeout(() => {
      success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Input
          type={showCurrent ? "text" : "password"}
          label="Current Password"
          placeholder="Enter current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          floating
        />
        <button
          type="button"
          onClick={() => setShowCurrent(!showCurrent)}
          className="absolute right-3 top-8 text-emerald-500 hover:text-emerald-600"
        >
          {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <div className="relative">
        <Input
          type={showNew ? "text" : "password"}
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          floating
        />
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          className="absolute right-3 top-8 text-emerald-500 hover:text-emerald-600"
        >
          {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <Input
        type="password"
        label="Confirm New Password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={error}
        floating
      />
      <Button type="submit" variant="gradient" size="md">
        Update Password
      </Button>
    </form>
  );
}

// Profile Tab Content
function ProfileTab() {
  const [name, setName] = useState("John Operator");
  const [email, setEmail] = useState("john@company.com");
  const [avatarUrl, setAvatarUrl] = useState("");
  const { success } = useToast();

  const handleSave = () => {
    success("Profile updated successfully");
  };

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar
              src={avatarUrl}
              alt={name}
              fallback={name}
              size="xl"
            />
            <div className="flex-1">
              <div className="flex gap-3">
                <Button variant="secondary" size="sm">
                  <Camera size={14} />
                  Upload Photo
                </Button>
                {avatarUrl && (
                  <Button variant="ghost" size="sm" onClick={() => setAvatarUrl("")}>
                    Remove
                  </Button>
                )}
              </div>
              <p className="mt-3 text-[10px] text-gray-400 uppercase tracking-wide">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              floating
            />
            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              floating
            />
            <div className="pt-4">
              <Button variant="gradient" onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>
    </div>
  );
}

// Notifications Tab Content
function NotificationsTab() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [frequency, setFrequency] = useState("realtime");
  const { success } = useToast();

  const handleSave = () => {
    success("Notification preferences saved");
  };

  return (
    <div className="space-y-8">
      <Card variant="glass" padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications - Emerald toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
                <Mail size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[13px] font-bold">Email Notifications</p>
                <p className="text-[10px] text-gray-400">
                  Receive updates via email
                </p>
              </div>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                emailNotifications 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30" 
                  : "bg-gray-200 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
                  emailNotifications ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
                <Bell size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[13px] font-bold">Push Notifications</p>
                <p className="text-[10px] text-gray-400">
                  Receive browser push notifications
                </p>
              </div>
            </div>
            <button
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                pushNotifications 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30" 
                  : "bg-gray-200 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
                  pushNotifications ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass" padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader>
          <CardTitle>Email Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-zinc-900 border border-emerald-500/20 rounded-xl px-4 py-3 text-[13px] font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            >
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly Digest</option>
              <option value="daily">Daily Summary</option>
              <option value="weekly">Weekly Report</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleSave}>Save Preferences</Button>
      </div>
    </div>
  );
}

// Appearance Tab Content
function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const [density, setDensity] = useState("comfortable");
  const [language, setLanguage] = useState("en");
  const { success } = useToast();

  const handleSave = () => {
    success("Appearance settings saved");
  };

  return (
    <div className="space-y-8">
      {/* Dark Mode - Animated emerald gradient cards */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                theme === "light"
                  ? "border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 shadow-lg shadow-emerald-500/20"
                  : "border-gray-100 dark:border-zinc-800 hover:border-emerald-500/30"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === "light" ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gray-100 dark:bg-zinc-800"}`}>
                <Sun size={24} className={theme === "light" ? "text-white" : "text-gray-400"} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                theme === "dark"
                  ? "border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 shadow-lg shadow-emerald-500/20"
                  : "border-gray-100 dark:border-zinc-800 hover:border-emerald-500/30"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === "dark" ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gray-100 dark:bg-zinc-800"}`}>
                <Moon size={24} className={theme === "dark" ? "text-white" : "text-gray-400"} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Dark</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                theme === "system"
                  ? "border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 shadow-lg shadow-emerald-500/20"
                  : "border-gray-100 dark:border-zinc-800 hover:border-emerald-500/30"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === "system" ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gray-100 dark:bg-zinc-800"}`}>
                <Monitor size={24} className={theme === "system" ? "text-white" : "text-gray-400"} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">System</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Density */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader>
          <CardTitle>Display Density</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {["compact", "comfortable", "spacious"].map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`flex-1 py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                  density === d
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-gray-100 text-gray-600 hover:bg-emerald-50 dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-emerald-950/30"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader>
          <CardTitle>Language</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-zinc-900 border border-emerald-500/20 rounded-xl px-4 py-3 text-[13px] font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}

// Integrations Tab Content
function IntegrationsTab() {
  const [apiKeys, setApiKeys] = useState([
    { id: "1", name: "Production API", key: "sk_live_xxxxx...xxxx", created: "2024-01-15" },
    { id: "2", name: "Test API", key: "sk_test_xxxxx...xxxx", created: "2024-03-20" },
  ]);
  const [webhooks] = useState([
    { id: "1", url: "https://api.example.com/webhook", events: ["order.created", "stock.updated"] },
  ]);
  const { success } = useToast();

  const generateApiKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: "New API Key",
      key: `sk_live_${Math.random().toString(36).substring(2, 15)}...`,
      created: new Date().toISOString().split("T")[0],
    };
    setApiKeys([...apiKeys, newKey]);
    success("API key generated");
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
    success("API key deleted");
  };

  return (
    <div className="space-y-8">
      {/* API Keys */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden hover:shadow-lg hover:shadow-emerald-500/10 transition-shadow">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>API Keys</CardTitle>
          <Button variant="gradient" size="sm" onClick={generateApiKey}>
            <Plus size={14} />
            Generate Key
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl border border-emerald-500/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
                  <Key size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{apiKey.name}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">{apiKey.key}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Created: {apiKey.created}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteApiKey(apiKey.id)}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          {apiKeys.length === 0 && (
            <p className="text-[11px] text-gray-400 text-center py-8">
              No API keys generated yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden hover:shadow-lg hover:shadow-emerald-500/10 transition-shadow">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Webhooks</CardTitle>
          <Button variant="secondary" size="sm">
            <Plus size={14} />
            Add Webhook
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl border border-emerald-500/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 flex items-center justify-center">
                  <Webhook size={18} className="text-teal-500" />
                </div>
                <div>
                  <p className="text-[13px] font-bold font-mono text-gray-900 dark:text-white">{webhook.url}</p>
                  <div className="flex gap-2 mt-2">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-bold uppercase"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          {webhooks.length === 0 && (
            <p className="text-[11px] text-gray-400 text-center py-8">
              No webhooks configured yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* External Services */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden hover:shadow-lg hover:shadow-emerald-500/10 transition-shadow">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader>
          <CardTitle>External Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: "Slack", desc: "Team notifications", connected: true, icon: Link2 },
            { name: "Zapier", desc: "Automation workflows", connected: false, icon: Link2 },
            { name: "GitHub", desc: "CI/CD integration", connected: true, icon: Link2 },
          ].map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-zinc-900 dark:to-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-emerald-500/20 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 flex items-center justify-center">
                  <service.icon size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{service.name}</p>
                  <p className="text-[10px] text-gray-400">{service.desc}</p>
                </div>
              </div>
              <Button
                variant={service.connected ? "secondary" : "gradient"}
                size="sm"
              >
                {service.connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Main Settings Page Component
export default function SettingsPage() {
  const tabs = [
    {
      id: "profile",
      label: "Profile",
      icon: <User size={14} />,
      content: <ProfileTab />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell size={14} />,
      content: <NotificationsTab />,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <Palette size={14} />,
      content: <AppearanceTab />,
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: <Plug size={14} />,
      content: <IntegrationsTab />,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-widest mb-2 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Settings</h1>
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Manage your account preferences
        </p>
      </div>
      <Tabs tabs={tabs} variant="gradient" />
    </div>
  );
}