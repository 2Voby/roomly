import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';

export function PasswordInput({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field password-field">
      <span className="field-label">{label}</span>
      <span className="password-input-wrap">
        <input
          className={`input ${error ? 'input-error' : ''}`}
          type={visible ? 'text' : 'password'}
          {...props}
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={visible ? 'Приховати пароль' : 'Показати пароль'}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? '◉' : '◌'}
        </button>
      </span>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
