import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/nav/app-nav";
import { PageTransition } from "@/components/ui/page-transition";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/api/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoalTracker - Track Your Goals & Habits",
  description: "A modern goal and habit tracker focused on setting goals, logging progress, streaks, milestones, and clear visualizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen`}
      >
        <QueryProvider>
          <AppNav />
          <PageTransition>
            <main className="pb-20 md:pb-0 pt-0">
              {children}
            </main>
          </PageTransition>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
