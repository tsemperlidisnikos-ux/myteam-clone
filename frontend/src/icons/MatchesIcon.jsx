export default function MatchesIcon({ size = 20, color = "#d1d5db" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="8" cy="12" r="4" />
      <circle cx="16" cy="12" r="4" />
      <path d="M12 12h0" />
    </svg>
  );
}
