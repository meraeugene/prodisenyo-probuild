import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prodisenyo Payroll System",
  description:
    "Upload your attendance report and auto-calculate payroll in seconds.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-apple-snow antialiased">{children}</body>
    </html>
  );
}
