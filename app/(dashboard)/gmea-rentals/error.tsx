"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function GmeaRentalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unable to open GMEA Rentals", error);
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center bg-white px-5 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-sm">
        <AlertTriangle className="mx-auto text-rose-600" size={30} aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold text-slate-950">
          Rentals could not be opened
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The request may have been interrupted. Retry the page, or return to
          the Rentals list and open it again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#076d69] px-4 text-sm font-semibold text-white hover:bg-[#065d5a]"
          >
            <RefreshCw size={15} aria-hidden="true" /> Retry
          </button>
          <Link
            href="/gmea-rentals"
            prefetch={false}
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Rentals
          </Link>
        </div>
      </section>
    </main>
  );
}
