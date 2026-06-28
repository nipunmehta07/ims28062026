// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast"; 
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"] 
});

const geistMono = Geist_Mono({ 
  variable: "--font-geist-mono", 
  subsets: ["latin"] 
});

export const metadata: Metadata = {
  title: "Inventory Management System",
  description: "Production & Assembly Line Control",
  manifest: "/manifest.json", // Tells the OS this is an app
  // This tells the browser to respect your app's theme
  colorScheme: "dark light", 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
     <body 
        // ADDED: bg-background and text-foreground to link to your CSS variables
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground transition-colors duration-500`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          
          <Toaster 
            position="bottom-right"
            containerStyle={{
              bottom: 40,
              right: 40,
            }}
            toastOptions={{
              duration: 4000,
              style: { 
                // --- BASE NEUTRAL GLASS ---
                background: 'rgba(255, 255, 255, 0.03)', // Very faint white
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                color: 'inherit', // Inherits from your globals.css foreground
                fontFamily: 'var(--font-geist-sans)',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '16px 24px',
                borderRadius: '20px',
                // Subtle neutral border
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                maxWidth: '400px',
              },
              success: {
                // High-end Emerald Border Glow
                style: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.15)',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: 'rgba(255, 255, 255, 0)',
                },
              },
              error: {
                // High-end Crimson Border Glow
                style: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  boxShadow: '0 10px 20px -5px rgba(244, 63, 94, 0.15)',
                },
                iconTheme: {
                  primary: '#f43f5e',
                  secondary: 'rgba(255, 255, 255, 0)',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}