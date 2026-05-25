export default function Spinner({ className = "h-8 w-8" }) {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-pusri-blue/20 border-t-pusri-blue ${className}`}
      role="status"
      aria-label="Memuat"
    />
  );
}
