import { Button } from './Button';

export function ErrorState({
  onRetry,
  title = 'Не вдалося завантажити дані',
}: {
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="state-panel state-panel-error">
      <span className="state-icon" aria-hidden="true">
        !
      </span>
      <h2>{title}</h2>
      <p>Спробуйте ще раз трохи пізніше.</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Спробувати знову
        </Button>
      ) : null}
    </div>
  );
}
