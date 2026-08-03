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
      <section className="auth-card">
        <NavLink className="brand brand-centered" to="/schedule">
          Roomly
        </NavLink>
        <div className="auth-heading">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
