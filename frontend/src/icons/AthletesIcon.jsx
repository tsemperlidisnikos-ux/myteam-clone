export default function AthletesIcon({ size = 20, color = "#d1d5db" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="3" />
      <path d="M12 8v4l3 3" />
      <path d="M12 12l-3 3" />
      <path d="M5 21l4-7" />
      <path d="M19 21l-4-7" />
    </svg>
  );
}
