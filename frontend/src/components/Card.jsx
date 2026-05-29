export default function Card({ label, value, suffix = "" }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value ?? "—"}
        {suffix}
      </div>
    </div>
  );
}
