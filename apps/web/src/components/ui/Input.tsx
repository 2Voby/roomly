import type { InputHTMLAttributes } from 'react';

export function Input({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input className={`input ${error ? 'input-error' : ''}`} {...props} />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
