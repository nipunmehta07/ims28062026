// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Camera, Key } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const [email, setEmail] = useState("nipunmehta7@gmail.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        username: email, // Map Email input to Auth username field
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#eae8fc] via-[#e2dff5] to-[#decde8] p-4 md:p-6 font-sans">
      <div className="w-full max-w-[480px] bg-white rounded-xl shadow-2xl p-8 md:p-10 space-y-6 animate-in fade-in zoom-in-95 duration-500">
        
        {/* LOGO BOX HEADER */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-6 py-4 bg-gray-50/50 hover:bg-gray-50 transition-colors select-none">
            <Camera className="w-5 h-5 text-gray-400" />
            <span className="text-lg font-bold text-gray-600 font-display">Your logo</span>
          </div>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email / Username field */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">Email</label>
              <button 
                type="button" 
                onClick={() => setEmail("admin")}
                className="text-[10px] font-medium text-[#714b67] hover:underline"
              >
                Choose a user
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. nipunmehta7@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#edf2fa] border border-transparent rounded-lg text-sm text-gray-800 focus:outline-none focus:bg-[#e6ecf7] focus:ring-1 focus:ring-[#714b67]/50 transition-all font-medium"
              required
            />
          </div>

          {/* Password field */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">Password</label>
              <Link 
                href="/forgot-password"
                className="text-[10px] font-medium text-[#714b67] hover:underline"
              >
                Reset Password
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-[#edf2fa] border border-transparent rounded-lg text-sm text-gray-800 focus:outline-none focus:bg-[#e6ecf7] focus:ring-1 focus:ring-[#714b67]/50 transition-all font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#6a4a63] hover:bg-[#5c3e55] text-white rounded-lg text-sm font-semibold tracking-wide transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* Footer info links */}
        <div className="text-center">
          <Link href="/register" className="text-xs font-medium text-[#714b67] hover:underline">
            Don't have an account?
          </Link>
        </div>

        {/* OR Spacer */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-150" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-[10px] text-gray-400 uppercase font-semibold tracking-wider">- or -</span>
          </div>
        </div>

        {/* PASSKEY BUTTON */}
        <button
          type="button"
          onClick={() => {
            setEmail("admin");
            setPassword("admin");
            success("Passkey credentials pre-filled!");
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-sm"
        >
          <Key className="w-4 h-4 text-[#714b67]" />
          <span>Use a Passkey</span>
        </button>

        {/* BRANDING FOOTER */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider select-none">
          <span>Powered by</span>
          <span className="text-gray-500 font-extrabold">Odoo</span>
        </div>
      </div>
    </div>
  );
}