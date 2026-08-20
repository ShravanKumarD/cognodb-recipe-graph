const variants = {
  neutral: "bg-surface border border-border text-muted",
  accent: "bg-accent-soft text-accent border border-accent/20",
  good: "bg-good/10 text-good border border-good/25",
  warn: "bg-warn/10 text-warn border border-warn/25",
};

export default function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
