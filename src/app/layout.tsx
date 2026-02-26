import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UserProvider } from '@/context/UserContext';
import "./globals.css";
import AppProviders from "@/components/AppProviders";
import NavBar from "@/components/NavBar";
import SuppressConsoleWarnings from "@/components/SuppressConsoleWarnings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#10b981",
};

export const metadata: Metadata = {
  title: "AI Job Hunter",
  description: "AI-powered career co-pilot for job seekers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JobHunter",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SuppressConsoleWarnings />
        <UserProvider>
          <AppProviders>
            <NavBar />
            {children}
          </AppProviders>
        </UserProvider>
      </body>
    </html>
  );
}
