import { NavLink } from 'react-router-dom';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-hidden="true">
        <NavLink className="brand auth-brand" to="/schedule">
          <span className="brand-mark">R</span> Roomly
        </NavLink>
        <div className="auth-visual-copy">
          <span className="auth-pill">простір для фокусу</span>
          <h2>Плануйте зустрічі без зайвих повідомлень</h2>
          <p>Перевіряйте доступність переговорних і бронюйте час за кілька секунд.</p>
        </div>
        <div className="auth-art">
          <span className="auth-art-card auth-art-card-one">
            <b>10:00</b>
            <small>Командний sync</small>
          </span>
          <span className="auth-art-card auth-art-card-two">
            <b>12:30</b>
            <small>Акваріум · 8 осіб</small>
          </span>
          <span className="auth-art-dot auth-art-dot-one" />
          <span className="auth-art-dot auth-art-dot-two" />
          <span className="auth-art-line" />
        </div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-card">
          <NavLink className="brand auth-mobile-brand" to="/schedule">
            <span className="brand-mark">R</span> Roomly
          </NavLink>
          <div className="auth-heading">
            <span className="section-kicker">Roomly workspace</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
