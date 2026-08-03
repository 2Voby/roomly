export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="state-panel">
      <span className="state-icon" aria-hidden="true">
        ⌁
      </span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
