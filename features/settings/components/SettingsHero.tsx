import Image from "next/image";

export default function SettingsHero() {
  return (
    <header className="relative isolate overflow-hidden rounded-[22px] bg-[#075e5b] px-6 py-8 text-white sm:px-9">
      <Image
        src="/gmea-portfolio-architecture.png"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) calc(100vw - 320px), 100vw"
        className="-z-20 object-cover object-right"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,83,79,.98)_0%,rgba(3,91,87,.88)_38%,rgba(3,82,79,.44)_72%,rgba(3,74,71,.58)_100%)]" />
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/75">Account</p>
      <h1 className="mt-3 text-[34px] font-bold leading-tight tracking-[-0.045em] sm:text-[42px]">Settings</h1>
      <p className="mt-3 text-sm text-white/85">Manage your profile and account security.</p>
    </header>
  );
}
