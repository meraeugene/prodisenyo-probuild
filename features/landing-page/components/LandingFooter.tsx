import Image from "next/image";
import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-[#083e39] text-white">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_0.7fr_0.7fr] lg:px-10">
        <div className="max-w-[430px]">
          <div className="flex items-center gap-3">
            <Image
              src="/prodisenyo-building-mark.png"
              alt=""
              width={48}
              height={44}
              className="h-11 w-12 object-contain brightness-0 invert"
            />
            <div>
              <p className="font-bold tracking-[-0.025em]">Prodisenyo ProBuild</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-teal-100/70">
                Construction ERP
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-teal-50/65">
            One system for construction projects, costs, and delivery.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">
            Product
          </p>
          <nav className="mt-4 flex flex-col gap-3 text-sm text-teal-50/70">
            <a href="#modules" className="hover:text-white">Modules</a>
            <a href="#workflow" className="hover:text-white">How it works</a>
            <a href="#product-tour" className="hover:text-white">Product tour</a>
          </nav>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">
            Access
          </p>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <Link href="/auth/login?switch=1" className="text-teal-50/70 hover:text-white">
              Sign In
            </Link>
            <a href="#roles" className="text-teal-50/70 hover:text-white">
              Role workspaces
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-5 py-5 text-xs text-teal-50/55 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>Prodisenyo Builders Corp. All rights reserved.</p>
          <p>Built for better project delivery.</p>
        </div>
      </div>
    </footer>
  );
}
