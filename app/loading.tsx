export default function loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-apple-snow">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-1 leading-none animate-pulse">
          <span className="text-2xl font-black tracking-wide ">PRODISENYO</span>

          <div className="flex items-center gap-2 -mt-1">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent via-emerald-500 to-emerald-500"></div>

            <span className="text-[10px] tracking-[0.20em]  whitespace-nowrap">
              PAYTRACK
            </span>

            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent via-emerald-500 to-emerald-500"></div>
          </div>
        </div>

        {/* Spinner */}
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-emerald-700"></div>
      </div>
    </div>
  );
}
