import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="page-center">
      <div className="not-found">
        <span>404</span>
        <h1>Сторінку не знайдено</h1>
        <p>Перевірте адресу або поверніться до розкладу.</p>
        <Link className="button button-primary" to="/schedule">
          До розкладу
        </Link>
      </div>
    </main>
  );
}
