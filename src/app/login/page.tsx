"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Globe, GitFork } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { FormField } from "@/app/components/composite/FormField";
import { Input } from "@/app/components/ui/Input";
import { useToast } from "@/app/components/ui/Toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const router = useRouter();
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        error("Invalid credentials. Please try again.");
        setLoading(false);
      } else {
        success("Welcome back!");
        router.push("/");
        router.refresh();
      }
    } catch {
      error("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "github") => {
    setSocialLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch {
      error(`Failed to sign in with ${provider}`);
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 dark:from-zinc-950 dark:via-emerald-950/20 dark:to-zinc-950 p-4 md:p-6">
      {/* Emerald mesh pattern background */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, emerald-500 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }} />
      
      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
      
      <Card 
        variant="glass" 
        padding="xl" 
        radius="2xl" 
        className="w-full max-w-md relative overflow-hidden"
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-[2rem] p-[1px] bg-gradient-to-br from-emerald-500/30 via-transparent to-teal-500/30" />
        
        <CardHeader className="relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          <CardTitle>Welcome Back</CardTitle>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Sign in to your account to continue</p>
        </CardHeader>
        
        <CardContent className="relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Username" required>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/10"
                />
              </div>
            </FormField>

            <FormField label="Password" required>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-emerald-500/30 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              size="lg" 
              isLoading={loading} 
              className="w-full shadow-lg shadow-emerald-500/20"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-emerald-500/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white/80 dark:bg-zinc-950/80 px-4 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest backdrop-blur-sm">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Sign In - Glassmorphism buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleSocialSignIn("google")}
              isLoading={socialLoading === "google"}
              className="w-full hover:scale-[1.02] hover:shadow-lg transition-all"
            >
              <Globe size={16} className="text-emerald-500" />
              Google
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleSocialSignIn("github")}
              isLoading={socialLoading === "github"}
              className="w-full hover:scale-[1.02] hover:shadow-lg transition-all"
            >
              <GitFork size={16} />
              GitHub
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="justify-center relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <p className="text-[11px] text-gray-400">
            Do not have an account?{" "}
            <Link href="/register" className="font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}