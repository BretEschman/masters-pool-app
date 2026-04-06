"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card p-8 max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2
          className="text-xl font-bold text-[var(--text-primary)] mb-2"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Something went wrong
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          An unexpected error occurred. Try refreshing the page.
        </p>
        <button
          onClick={() => reset()}
          className="bg-[var(--em-green)] text-black px-6 py-3 rounded-lg font-bold hover:bg-[var(--em-green-dark)] hover:text-white transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
