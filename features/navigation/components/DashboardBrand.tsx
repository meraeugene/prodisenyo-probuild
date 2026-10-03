import Image from "next/image";

export default function DashboardBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Image src="/prodisenyo-building-mark.png" alt="" width={40} height={40} className={`${collapsed ? "h-10 w-9" : "h-10 w-8"} shrink-0 object-contain`} priority />
      {!collapsed && <p className="whitespace-nowrap text-sm font-semibold leading-tight tracking-[-0.035em] text-[#1d1d1f]">Prodisenyo ProBuild</p>}
    </div>
  );
}
