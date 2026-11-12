export default function Field({ label, error, children, hint }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="block text-xs font-medium text-heart" role="alert">{error}</span>}
    </label>
  );
}
