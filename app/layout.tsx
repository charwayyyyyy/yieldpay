import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "YieldPay AI",
  description: "Direct pre-harvest financing for Ghanaian farmers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} font-sans bg-moolre-light text-moolre-navy antialiased min-h-screen flex flex-col`}>
        {/* Sleek Glassmorphic Navbar */}
        <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center gap-3">
                  <Image src="/logo.svg" alt="YieldPay Logo" width={160} height={64} className="h-16 w-auto object-contain" priority />
                  <span className="font-fraunces text-2xl font-bold text-moolre-green tracking-tight">YieldPay</span>
                </Link>
              </div>
              <div className="flex space-x-8 items-center">
                <Link href="/" className="text-moolre-navy hover:text-moolre-green font-medium transition-colors">
                  Marketplace
                </Link>
                <Link href="/dashboard" className="text-moolre-navy hover:text-moolre-green font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin?key=demo123" className="text-moolre-navy hover:text-moolre-green font-medium transition-colors">
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="flex-grow">
          {children}
        </main>
        
        {/* Simple Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12 py-8 text-center text-gray-500 text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} YieldPay AI. Built for the Moolre Startup Cup.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link href="/privacy" className="hover:text-moolre-green transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-moolre-green transition-colors">Terms of Use</Link>
              <Link href="/api-docs" className="hover:text-moolre-green transition-colors font-semibold">API Documentation (Moolre Integration)</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
