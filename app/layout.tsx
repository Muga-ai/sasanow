import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Sasa Now — Nairobi Delivered",
  description:
    "Nairobi's quick commerce platform. Groceries, errands, pharmacy and more delivered in under 45 minutes.",
  metadataBase: new URL("https://sasanow.co.ke"),
  openGraph: {
    title: "Sasa Now",
    description: "Nairobi delivered, sasa hivi.",
    url: "https://sasanow.co.ke",
    siteName: "Sasa Now",
    locale: "en_KE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: "var(--font-dm)",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#1F6B3A", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#E8A020", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
