import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prodisenyo Payroll",
  description:
    "Upload your attendance report and auto-calculate payroll in seconds.",
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
