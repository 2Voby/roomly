export function CurrentTimeIndicator({ top }: { top: number }) {
  return (
    <span className="current-time-indicator" style={{ top: `${top}%` }} aria-label="Поточний час" />
  );
}
