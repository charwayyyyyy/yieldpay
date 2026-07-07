import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
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
      <body className={`${outfit.variable} font-sans bg-moolre-light text-moolre-navy antialiased min-h-screen flex flex-col`}>
        {/* Sleek Glassmorphic Navbar */}
        <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <Image src="/logo.svg" alt="YieldPay Logo" width={160} height={40} className="h-10 w-auto object-contain py-1" priority />
                </Link>
              </div>
              <div className="flex space-x-8">
                <Link href="/" className="text-moolre-navy hover:text-moolre-green font-medium transition-colors">
                  Marketplace
                </Link>
                <Link href="/dashboard" className="text-moolre-navy hover:text-moolre-green font-medium transition-colors">
                  Dashboard
                </Link>
                <div className="text-sm font-semibold text-moolre-gold bg-moolre-gold/10 px-4 py-2 rounded-full hidden sm:block">
                  Powered by Moolre
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="flex-grow">
          {children}
        </main>
        
        {/* Simple Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12 py-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} YieldPay AI. Built for the Moolre Startup Cup.</p>
        </footer>
      </body>
    </html>
  );
}
