import Link from "next/link";
import { ArrowLeft, FolderSearch2 } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <main className="flex min-h-[calc(100vh-69px)] items-center justify-center bg-white p-4 sm:p-8">
      <section className="w-full max-w-xl rounded-[26px] border border-white/80 bg-white/80 p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:p-9">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#08746f]"><FolderSearch2 size={25} /></span>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#08746f]">Page not found</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950">This record is no longer available</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">It may have been removed, or the link may be outdated.</p>
        <Link href="/" className="mx-auto mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#076d69] px-5 text-sm font-semibold text-white hover:bg-[#055f5b]"><ArrowLeft size={15} />Return home</Link>
      </section>
    </main>
  );
}
