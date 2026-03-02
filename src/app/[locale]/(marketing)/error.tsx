'use client';

export default function MarketingError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button className="mt-4" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
