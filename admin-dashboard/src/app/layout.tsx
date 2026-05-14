import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Juicy App | Premium Admin Dashboard",
  description: "Billion-dollar scale admin platform for fresh juice delivery",
};

import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import HideDevTools from "@/components/HideDevTools";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          /* Hide all Next.js and Vercel development tools */
          #__next-prerender-indicator,
          #vercel-toolbar,
          .vercel-toolbar-container,
          [data-vercel-toolbar],
          [data-nextjs-toast],
          [data-nextjs-dialog-overlay],
          [data-devtools-toast],
          [role="complementary"],
          div[role="status"],
          .nextjs-container-errors,
          [id*="__next-error"],
          button[title*="Dev Tools"],
          button[aria-label*="Dev Tools"],
          svg[aria-label*="Next.js"],
          [style*="position: fixed"][style*="bottom: 0"],
          [style*="position: fixed"][style*="right: 0"],
          [style*="position: fixed"][style*="z-index: 1"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            position: fixed !important;
            top: -9999px !important;
            left: -9999px !important;
            z-index: -9999 !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        `}} />
      </head>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <HideDevTools />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
