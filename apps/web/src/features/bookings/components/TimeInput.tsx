import { forwardRef, type FocusEvent, type InputHTMLAttributes } from 'react';

function normalizeTypedTime(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function roundToHalfHour(value: string, rounding: 'nearest' | 'up') {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return value;
  const roundedMinutes =
    rounding === 'up'
      ? Math.ceil((hours * 60 + minutes) / 30) * 30
      : Math.round((hours * 60 + minutes) / 30) * 30;
  const rounded = Math.min(roundedMinutes, 23 * 60 + 30);
  return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
}

export const TimeInput = forwardRef<
  HTMLInputElement,
  {
    label: string;
    error?: string;
    value: string;
    name: string;
    onChange: (value: string) => void;
    onBlur: (event: FocusEvent<HTMLInputElement>) => void;
    rounding?: 'nearest' | 'up';
  } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>
>(function TimeInput(
  { label, error, value, name, onChange, onBlur, rounding = 'nearest', ...props },
  ref,
) {
  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const normalized = roundToHalfHour(value, rounding);
    if (normalized !== value) onChange(normalized);
    onBlur(event);
  }

  return (
    <label className="field time-input-field">
      <span className="field-label">{label}</span>
      <span className="time-input-wrap">
        <input
          {...props}
          ref={ref}
          className={`input time-input ${error ? 'input-error' : ''}`}
          type="text"
          name={name}
          value={value}
          inputMode="numeric"
          autoComplete="off"
          maxLength={5}
          placeholder="12:00"
          pattern="[0-9]{2}:[0-9]{2}"
          onChange={(event) => {
            const formatted = normalizeTypedTime(event.target.value);
            onChange(formatted.length === 5 ? roundToHalfHour(formatted, rounding) : formatted);
          }}
          onBlur={handleBlur}
        />
        <span className="time-input-suffix">30 хв</span>
      </span>
      <span className={`field-error time-input-error ${error ? '' : 'time-input-error-empty'}`}>
        {error || '\u00a0'}
      </span>
    </label>
  );
});
