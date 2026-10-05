export default function Loading() {
  return (
    <div className="shell py-20 animate-pulse" role="status">
      <div className="h-10 rounded bg-secondary w-2/3 mb-8" />
      <div className="h-64 rounded-2xl bg-secondary" />
      <span className="sr-only">Loading Baela…</span>
    </div>
  );
}
