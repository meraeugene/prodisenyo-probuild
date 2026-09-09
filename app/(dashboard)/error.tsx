"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[calc(100vh-69px)] items-center justify-center bg-white p-4 sm:p-8">
      <section className="w-full max-w-xl rounded-[26px] border border-white/80 bg-white/80 p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:p-9">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle size={25} /></span>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#08746f]">Unable to load page</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950">This workspace did not finish loading</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">The connection may have been interrupted. Retry the page, or return to your role&apos;s home screen.</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" onClick={reset} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#076d69] px-5 text-sm font-semibold text-white hover:bg-[#055f5b]"><RefreshCw size={15} />Retry</button>
          <Link href="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={15} />Return home</Link>
        </div>
      </section>
    </main>
  );
}
