import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import BackgroundGradientSnippet from "@/components/ui/background-gradient-snippet";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Juice SaaS Admin",
  description: "Production-grade Juice & Fruit Shop Admin Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 antialiased overflow-x-hidden`}>
        <BackgroundGradientSnippet />
        <div className="relative z-10">
          <Sidebar />
          <main className="md:ml-64 min-h-screen p-4 md:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
