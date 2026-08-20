export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 px-6 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left">
        <p>Substitute — a recipe graph built on CognoDB, queried with openCypher.</p>
        <p>Every recipe, ingredient and substitution here lives as a node or a relationship, not a row.</p>
      </div>
    </footer>
  );
}
