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
            expand
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  "group border border-apple-mist bg-white text-apple-charcoal shadow-[0_20px_48px_rgba(24,83,43,0.14)] rounded-[20px]",
                title: "text-sm font-semibold text-apple-charcoal",
                description: "text-[13px] leading-5 text-apple-steel",
                content: "gap-1.5",
                icon: "text-[rgb(var(--theme-chart-2))]",
                closeButton:
                  "border border-apple-mist bg-[rgb(var(--apple-snow))] text-apple-steel transition hover:bg-apple-mist hover:text-apple-charcoal",
                success:
                  "border-emerald-200 bg-[linear-gradient(180deg,rgba(248,253,250,1),rgba(239,250,243,1))]",
                error:
                  "border-red-200 bg-[linear-gradient(180deg,rgba(255,250,250,1),rgba(254,242,242,1))]",
                info:
                  "border-sky-200 bg-[linear-gradient(180deg,rgba(249,252,255,1),rgba(240,249,255,1))]",
                warning:
                  "border-amber-200 bg-[linear-gradient(180deg,rgba(255,252,245,1),rgba(254,249,195,0.4))]",
              },
            }}
          />
        </AppStateProvider>
      </body>
    </html>
  );
}
