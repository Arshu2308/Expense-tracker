import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExpenseFlow — Premium Wealth Ledger & Analytics",
  description: "Secure, glassmorphic, and dynamic personal finance management with typesafe endpoints, automated recurring templates, and deep categorical budget metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const saved = localStorage.getItem('expenseflow_theme');
              if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          })()
        ` }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
