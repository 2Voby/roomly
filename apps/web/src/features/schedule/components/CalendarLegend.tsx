export function CalendarLegend() {
  return (
    <div className="calendar-legend-top" aria-label="Позначення розкладу">
      <span>
        <i className="legend-dot legend-own" />
        Ваше бронювання
      </span>
      <span>
        <i className="legend-dot legend-other" />
        Інші бронювання · кольори відрізняють користувачів
      </span>
      <span>
        <i className="legend-dot legend-free" />
        Доступно для бронювання
      </span>
      <span className="legend-hint">Потягніть мишкою для вибору діапазону або натисніть слот</span>
    </div>
  );
}
