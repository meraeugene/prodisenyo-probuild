import type { Metadata } from "next";
import "./globals.css";
import "sonner/dist/styles.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { AppStateProvider } from "@/features/app/AppStateProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Prodisenyo PayTrack",
    template: "%s | Prodisenyo PayTrack",
  },
  description:
    "Prodisenyo PayTrack helps teams upload attendance logs, review worked hours, and generate accurate payroll reports faster.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", geist.variable)}
      data-theme="prodisenyo"
    >
      <body className="min-h-screen bg-apple-snow antialiased">
        <AppStateProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className:
                "border border-apple-mist bg-apple-white text-apple-charcoal",
            }}
          />
        </AppStateProvider>
      </body>
    </html>
  );
}
