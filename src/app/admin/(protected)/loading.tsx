export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-8 w-48 animate-pulse rounded-md bg-neutral-200" />
      <div className="h-32 animate-pulse rounded-md bg-neutral-100" />
      <div className="h-32 animate-pulse rounded-md bg-neutral-100" />
    </div>
  );
}
