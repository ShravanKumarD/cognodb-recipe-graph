export default function DbErrorNotice({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-warn/30 bg-warn/5 px-6 py-16 text-center">
      <span className="text-4xl">🔌</span>
      <p className="font-display text-xl">Can&apos;t reach CognoDB</p>
      <p className="max-w-md text-sm text-muted">
        {message ?? "The graph database is unreachable right now."} Check that{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 text-xs">COGNODB_URI</code>,{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 text-xs">COGNODB_USER</code> and{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 text-xs">COGNODB_PASSWORD</code> are
        set in <code className="rounded bg-surface px-1.5 py-0.5 text-xs">.env.local</code>, that
        the instance isn&apos;t paused, and that <code className="rounded bg-surface px-1.5 py-0.5 text-xs">npm run seed</code> has been run at least once.
      </p>
    </div>
  );
}
