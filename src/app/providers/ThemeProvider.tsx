"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useState } from "react";

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ims-theme",
  ...props
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted after hydration to avoid mismatch
    const timer = setTimeout(() => {
      setMounted(true);
    }, 1);
    return () => clearTimeout(timer);
  }, []);

  // Avoid hydration mismatch by rendering children only after mount
  if (!mounted) {
    return (
      <div suppressHydrationWarning style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
      storageKey={storageKey}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}