"use client";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="m-6 space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-6"
    >
      <h1 className="text-xl font-semibold text-rose-900">
        Unable to load GMEA projects
      </h1>
      <p className="text-sm text-rose-700">
        Check the connection and make sure the GMEA database migrations have
        been applied.
      </p>
      {process.env.NODE_ENV === "development" && (
        <p className="text-sm">{error.message}</p>
      )}
      <button
        className="rounded-xl bg-rose-800 px-4 py-2 text-sm text-white"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}
