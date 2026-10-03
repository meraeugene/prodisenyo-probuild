import Image from "next/image";

export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-6">
      <div role="status" aria-live="polite" className="flex flex-col items-center">
        <div className="flex items-center gap-2.5">
          <Image
            src="/prodisenyo-building-mark.png"
            alt=""
            width={32}
            height={40}
            className="h-10 w-8 object-contain"
            priority
          />
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-[#1d1d1f]">
            Prodisenyo ProBuild
          </span>
        </div>
        <div aria-hidden="true" className="mt-6 h-0.5 w-28 overflow-hidden rounded-full bg-[#e1e9e7]">
          <div className="h-full w-1/2 rounded-full bg-[#076d69] animate-[loading_1.6s_ease-in-out_infinite] motion-reduce:animate-none" />
        </div>
        <span className="mt-3 text-xs text-[#53736f]">Loading workspace…</span>
      </div>
    </main>
  );
}
