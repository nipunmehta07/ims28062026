"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Check, X, Globe, GitFork } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { FormField } from "@/app/components/composite/FormField";
import { Input } from "@/app/components/ui/Input";
import { useToast } from "@/app/components/ui/Toast";

// Password strength calculator
function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (!password) {
    return { score: 0, label: "Enter password", color: "bg-gray-200" };
  }

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const labels = [
    "Very Weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Very Strong",
  ];

  const colors = [
    "bg-rose-500",
    "bg-rose-400",
    "bg-amber-400",
    "bg-amber-500",
    "bg-emerald-400",
    "bg-emerald-500",
  ];

  return {
    score,
    label: labels[score] || labels[0],
    color: colors[score] || colors[0],
  };
}

// Password requirement checker
function PasswordRequirements({
  password,
  confirmPassword,
}: {
  password: string;
  confirmPassword: string;
}) {
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains special character", met: /[^a-zA-Z0-9]/.test(password) },
    { label: "Passwords match", met: password === confirmPassword && password.length > 0 },
  ];

  return (
    <div className="mt-3 space-y-2">
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center gap-2">
          {req.met ? (
            <Check size={12} className="text-emerald-500" />
          ) : (
            <X size={12} className="text-gray-300" />
          )}
          <span
            className={`text-[10px] ${
              req.met ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
            }`}
          >
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const { success, error } = useToast();

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!acceptTerms) {
      newErrors.terms = "You must accept the terms and privacy policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        error(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      success("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch {
      error("Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "github") => {
    setSocialLoading(provider);
    try {
      // In a real app, this would redirect to OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 1000));
      error(`${provider} sign-in is not configured yet`);
      setSocialLoading(null);
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
      <div className="absolute top-1/4 -right-32 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -left-32 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
      
      <Card 
        variant="glass" 
        padding="xl" 
        radius="2xl" 
        className="w-full max-w-md relative overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-[2rem] p-[1px] bg-gradient-to-br from-emerald-500/30 via-transparent to-teal-500/30" />
        
        <CardHeader className="relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          <CardTitle>Create Account</CardTitle>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Get started with your free account</p>
        </CardHeader>
        
        <CardContent className="relative">
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Full Name" required error={errors.name}>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-12 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/10"
                  floating
                />
              </div>
            </FormField>

            <FormField label="Username" required error={errors.username}>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <Input
                  type="text"
                  placeholder="Enter a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/10"
                  floating
                />
              </div>
            </FormField>

            <FormField label="Email Address" required error={errors.email}>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/10"
                  floating
                />
              </div>
            </FormField>

            <FormField label="Password" required error={errors.password}>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <Input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/10"
                  floating
                />
              </div>
              {/* Password Strength Meter */}
              {password && (
                <div className="mt-3">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.score
                            ? passwordStrength.color
                            : "bg-gray-200 dark:bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Strength: {passwordStrength.label}
                  </p>
                </div>
              )}
            </FormField>

            <FormField
              label="Confirm Password"
              required
              error={errors.confirmPassword}
            >
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/10"
                  floating
                />
              </div>
            </FormField>

            {/* Password Requirements */}
            <PasswordRequirements password={password} confirmPassword={confirmPassword} />

            {/* Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-emerald-500/30 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms && (
                <p className="mt-2 text-[10px] font-medium text-rose-500">{errors.terms}</p>
              )}
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              size="lg" 
              isLoading={loading} 
              className="w-full shadow-lg shadow-emerald-500/20"
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-emerald-500/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white/80 dark:bg-zinc-950/80 px-4 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest backdrop-blur-sm">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Social Sign Up - Glassmorphism buttons */}
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
            Already have an account?{" "}
            <Link href="/login" className="font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}