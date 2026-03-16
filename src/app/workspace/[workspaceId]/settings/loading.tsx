export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-muted" />
        <div className="h-4 w-56 rounded bg-muted" />
      </div>

      {/* Nav skeleton */}
      <div className="flex gap-1 border-b pb-px mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-t-md bg-muted" />
        ))}
      </div>

      {/* Form skeleton */}
      <div className="max-w-2xl space-y-4">
        <div className="h-64 rounded-lg border bg-muted" />
      </div>
    </div>
  );
}
