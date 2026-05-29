export default function TeamsIcon({ size = 20, color = "#d1d5db" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="9" cy="7" r="4" />
      <circle cx="17" cy="7" r="4" />
      <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
      <path d="M13 21v-2a6 6 0 0 1 8-5.5" />
    </svg>
  );
}
