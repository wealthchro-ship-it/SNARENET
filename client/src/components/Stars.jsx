export default function Stars({ rating }) {
  const value = Math.max(1, Math.min(5, Number(rating) || 0));
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(value)}
      <span style={{ color: '#3a4350' }}>{'★'.repeat(Math.max(0, 5 - value))}</span>
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-btn ${n <= value ? 'on' : ''}`}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-pressed={n === value}
        >
          ★
        </button>
      ))}
      <style>{`
        .star-input { display: inline-flex; gap: 6px; }
        .star-btn {
          background: none; border: none; font-size: 26px; line-height: 1;
          color: #3a4350; transition: color .12s ease, transform .12s ease; padding: 2px;
        }
        .star-btn.on { color: #fbbf24; }
        .star-btn:hover { transform: scale(1.15); color: #fbbf24; }
      `}</style>
    </div>
  );
}