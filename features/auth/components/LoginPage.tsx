import Image from "next/image";
import LoginForm from "@/features/auth/components/LoginForm";
import LoginHero from "@/features/auth/components/LoginHero";

interface LoginPageProps {
  nextPath: string | null;
  initialError?: string | null;
}

export default function LoginPage({ nextPath, initialError }: LoginPageProps) {
  return (
    <main className="min-h-screen bg-[#f7f9fb] lg:grid lg:grid-cols-[58%_42%]">
      <LoginHero />

      <section className="relative flex min-h-screen flex-col items-center justify-center bg-white px-5 py-8 sm:px-8 lg:px-[9%] lg:py-10">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <Image
            src="/prodisenyo-building-mark.png"
            alt="Prodisenyo building mark"
            width={64}
            height={52}
            className="h-[52px] w-16 object-contain"
          />
          <div>
            <p className="text-lg font-semibold tracking-[-0.02em] text-[#076966]">
              Prodisenyo ProBuild
            </p>
            <p className="text-[9px] uppercase tracking-[0.26em] text-[#6d7889]">
              Construction ERP Platform
            </p>
          </div>
        </div>

        <div className="w-full max-w-[440px] py-6">
          <header>
            <h2 className="text-[28px] font-semibold tracking-[-0.035em] text-[#162238] sm:text-[30px]">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-[#7a8496]">
              Sign in to continue to Prodisenyo ProBuild
            </p>
          </header>

          <div className="mt-8">
            <LoginForm nextPath={nextPath} initialError={initialError} />
          </div>

          <div className="mt-7 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-[#dce1e7]" />
            <span className="text-xs text-[#8791a1]">or</span>
            <span className="h-px flex-1 bg-[#dce1e7]" />
          </div>

          <a
            href="mailto:andrewvillalon.dev@gmail.com"
            aria-label="Contact administrator at andrewvillalon.dev@gmail.com"
            className="mt-6 block text-center text-sm font-medium text-[#076966] hover:underline"
          >
            Contact Administrator
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-[#8a93a2] lg:mt-[5vh]">
          {"\u00A9"} {new Date().getFullYear()} Prodisenyo ProBuild. All rights reserved.
        </p>
      </section>
    </main>
  );
}
