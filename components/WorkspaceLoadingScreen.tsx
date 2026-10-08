import Image from "next/image";

export default function WorkspaceLoadingScreen() {
  return (
    <main data-workspace-loading="true" className="grid min-h-dvh place-items-center bg-[#f5f6f8] px-6">
      <div role="status" aria-live="polite" aria-label="Loading Prodisenyo ProBuild" className="flex flex-col items-center text-center">
        <Image src="/prodisenyo-building-mark.png" alt="" width={64} height={80} className="h-20 w-16 object-contain" priority />
        <p className="mt-5 text-xl font-semibold tracking-tight text-[#1d1d1f]">Prodisenyo ProBuild</p>
        <div aria-hidden="true" className="mt-5 h-0.5 w-40 overflow-hidden rounded-full bg-[#d0d5dd]">
          <div className="h-full w-1/2 rounded-full bg-[#076d69] animate-[loading_1.6s_ease-in-out_infinite] motion-reduce:animate-none" />
        </div>
        <span className="sr-only">Loading workspace</span>
      </div>
    </main>
  );
}
